#!/usr/bin/env python3
"""화면 글꼴 만들기 (관리자용 도구, Apache-2.0).

실행(저장소 어디서든):
    uv run --with fonttools --with brotli python site/scripts/fonts.py

하는 일
- IBM Plex Sans KR, IBM Plex Mono(SIL Open Font License 1.1)를 고정한 주소에서 받아 SHA-256을 확인한다.
- 화면에 지금 쓰는 글자(core)와 그 밖의 한글 완성형 2,350자(rest)로 나눠 woff2를 만든다.
  방문자는 core만 받고, 내용이 바뀌어 새 글자가 생기면 브라우저가 rest를 알아서 받는다.
  fonts.css에서 rest를 먼저, core를 나중에 선언한다. 범위가 겹치면 나중에 선언한 쪽을 먼저 쓰기 때문이다.
- OFL의 예약 글꼴 이름(Plex) 조건에 따라 글꼴 이름을 Roadmap Sans, Roadmap Mono로 바꾼다.
- site/src/fonts/*.woff2, site/src/fonts/OFL.txt, site/src/fonts.css, site/fonts/charset-*.txt를 쓴다.

빌드·검사·시험(node scripts/*.mjs)은 이 도구 없이 동작한다. 글꼴을 다시 만들 때만 쓴다.
"""
import hashlib
import io
import sys
import tempfile
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

SITE = Path(__file__).resolve().parent.parent
SRC, DATA = SITE / "src", SITE / "data"
OUT, CHARSETS = SRC / "fonts", SITE / "fonts"
CACHE = Path(tempfile.gettempdir()) / "kosta-roadmap-fonts"
RAW = "https://raw.githubusercontent.com/google/fonts/"
SANS_REF, SANS_DIR = "88729e1588acb77b1453390d2769f5a21bb22db1", "ofl/ibmplexsanskr/"
MONO_REF, MONO_DIR = "431022a4eeb0e1009ba0126f41353d8ca2375a2a", "ofl/ibmplexmono/"
SANS = [  # (굵기, 굵기 이름, 원본 파일, SHA-256)
    (400, "Regular", "IBMPlexSansKR-Regular.ttf", "53750379270312368cf7641901f43a98dd892e3d9d5798cf25cdc245c85c71c0"),
    (500, "Medium", "IBMPlexSansKR-Medium.ttf", "4a7130f56ce50bf10f9d383f624e50bad2c80bebc63e51f4269ece2c7d919166"),
    (600, "SemiBold", "IBMPlexSansKR-SemiBold.ttf", "823c1956adf56c27c06b062725dfce23f266e4fd1366290f2957c8407482a817"),
    (700, "Bold", "IBMPlexSansKR-Bold.ttf", "9d82a8be5330f6d7b53121262867b402baca672eb69b852928f06d185d357f7d"),
]
MONO = (400, "Regular", "IBMPlexMono-Regular.ttf", "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46")
OFL = ("OFL.txt", "7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da")
SANS_FAMILY, MONO_FAMILY = "Roadmap Sans", "Roadmap Mono"
ASCII = [chr(c) for c in range(0x20, 0x7F)]
EXTRA = "·…–—→←×“”‘’"
HANGUL_SYLLABLES = "U+AC00-D7A3"


def fetch(ref, folder, name, sha256):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (sha256[:16] + "-" + name)
    if not cached.exists():
        with urllib.request.urlopen(RAW + ref + "/" + folder + name, timeout=120) as res:
            cached.write_bytes(res.read())
    blob = cached.read_bytes()
    got = hashlib.sha256(blob).hexdigest()
    if got != sha256:
        cached.unlink()
        sys.exit(f"fonts: {name}의 SHA-256이 다릅니다. 기대 {sha256}, 실제 {got}")
    return blob


def ksx1001_hangul():
    return [bytes([hi, lo]).decode("euc_kr") for hi in range(0xB0, 0xC9) for lo in range(0xA1, 0xFF)]


def used_chars():
    files = [SRC / "index.html", SRC / "app.js", SRC / "unit.html", SRC / "unit.js", *sorted(DATA.glob("*.json"))]
    text = "".join(p.read_text(encoding="utf-8") for p in files)
    return {c for c in text if ord(c) > 0x7E and not c.isspace()}


def unicode_range(chars):
    cps = sorted({ord(c) for c in chars})
    runs, start, prev = [], cps[0], cps[0]
    for cp in cps[1:]:
        if cp != prev + 1:
            runs.append((start, prev))
            start = cp
        prev = cp
    runs.append((start, prev))
    return ",".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in runs)


def rename(font, family, style, origin):
    names = font["name"]
    full, ps = f"{family} {style}", family.replace(" ", "") + "-" + style
    for rec in list(names.names):
        new = {1: family, 16: family, 2: style, 17: style, 4: full, 6: ps, 3: f"{full}; glyph subset of {origin}"}.get(rec.nameID)
        if new is not None:
            names.setName(new, rec.nameID, rec.platformID, rec.platEncID, rec.langID)
    note = f"Glyph subset of {origin} {style}. Renamed under the Reserved Font Name condition of the SIL Open Font License 1.1."
    names.setName(note, 10, 3, 1, 0x409)
    names.setName(note, 10, 1, 0, 0)


def make(blob, chars, family, style, origin, out):
    font = TTFont(io.BytesIO(blob))
    have = set(font.getBestCmap())
    keep = sorted(c for c in chars if ord(c) in have)
    opts = subset.Options()
    opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "tnum"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(c) for c in keep])
    sub.subset(font)
    rename(font, family, style, origin)
    font.flavor = "woff2"
    font.save(out)
    return keep


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    CHARSETS.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    core = set(ASCII) | used_chars() | set(EXTRA)
    rest = set(ksx1001_hangul()) - core
    css = ["/* 생성 파일: site/scripts/fonts.py가 만든다. 직접 고치지 않는다. 원본 글꼴 IBM Plex Sans KR, IBM Plex Mono (SIL OFL 1.1, fonts/OFL.txt). */"]
    kept = {"core": set(), "rest": set()}
    faces = {"rest": [], "core": []}
    for weight, style, name, sha in SANS:
        blob = fetch(SANS_REF, SANS_DIR, name, sha)
        for part, chars in (("rest", rest), ("core", core)):
            file = f"roadmap-sans-{weight}-{part}.woff2"
            keep = make(blob, chars, SANS_FAMILY, style, "IBM Plex Sans KR", OUT / file)
            kept[part] |= set(keep)
            span = HANGUL_SYLLABLES if part == "rest" else unicode_range(keep)
            faces[part].append(f'@font-face{{font-family:"{SANS_FAMILY}";font-style:normal;font-weight:{weight};font-display:swap;src:url(fonts/{file}) format("woff2");unicode-range:{span}}}')
            print(f"fonts: {file}  글자 {len(keep)}개  {(OUT / file).stat().st_size / 1024:.1f}KB")
    css += faces["rest"] + faces["core"]
    weight, style, name, sha = MONO
    file = f"roadmap-mono-{weight}.woff2"
    keep = make(fetch(MONO_REF, MONO_DIR, name, sha), ASCII, MONO_FAMILY, style, "IBM Plex Mono", OUT / file)
    css.append(f'@font-face{{font-family:"{MONO_FAMILY}";font-style:normal;font-weight:{weight};font-display:swap;src:url(fonts/{file}) format("woff2");unicode-range:{unicode_range(keep)}}}')
    print(f"fonts: {file}  글자 {len(keep)}개  {(OUT / file).stat().st_size / 1024:.1f}KB")
    (OUT / "OFL.txt").write_bytes(fetch(SANS_REF, SANS_DIR, *OFL))
    (SRC / "fonts.css").write_text("\n".join(css) + "\n", encoding="utf-8")
    (CHARSETS / "charset-core.txt").write_text("".join(sorted(kept["core"])) + "\n", encoding="utf-8")
    (CHARSETS / "charset-rest.txt").write_text("".join(sorted(kept["rest"])) + "\n", encoding="utf-8")
    missing = sorted((core | rest) - kept["core"] - kept["rest"])
    if missing:
        print("fonts: 원본 글꼴에 없는 글자(시스템 글꼴로 표시됨): " + "".join(missing))


if __name__ == "__main__":
    main()
