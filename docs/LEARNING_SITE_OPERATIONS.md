# kosta-ai-lab 학습 로드맵 사이트 — 운영 안내

> 기획: [LEARNING_SITE_PLAN.md](LEARNING_SITE_PLAN.md) · 화면 명세: [LEARNING_SITE_DESIGN.md](LEARNING_SITE_DESIGN.md)
> 이 문서는 사이트의 빌드·검사·갱신·배포 절차를 정리한다.

## 1. 구성

```text
site/
  package.json         스크립트만 있고 의존성은 없다(Node 내장 모듈만 사용)
  data/roadmap.json    로드맵·단계·자료·강사별 묶음
  data/unit-<단원>.json 단원 한눈에 보기의 내용. 단원마다 하나(예: unit-06-m01.json)
  src/index.html       고정 문구, 메타데이터, meta CSP
  src/app.css          화면 스타일
  src/core.js          계산(단계 상태, 마친 자료 수, 새로움, 저장소 주소). 화면과 시험이 함께 쓴다
  src/app.js           화면 동작. 데이터를 읽어 DOM API로 화면을 만든다
  src/unit.html        단원 한눈에 보기 화면의 고정 문구, 메타데이터, meta CSP
  src/unit.css         단원 한눈에 보기 화면 스타일
  src/unit.js          단원 한눈에 보기 화면 동작. 단원 내용을 읽어 DOM API로 화면을 만든다
  src/favicon.svg      사이트 표식
  src/fonts.css        글꼴 선언(생성 파일)
  src/fonts/           글꼴 woff2와 OFL.txt(생성 파일)
  fonts/               글꼴에 든 글자 목록(생성 파일, 배포하지 않음)
  scripts/             build · check · test · serve · lib, 단원 내용 검사 unit-check, 글꼴 도구 fonts.py
  dist/                빌드 산출물(.gitignore의 dist/ 규칙으로 추적하지 않음)
  dist/data/dates.json 자료 날짜. 빌드가 git 이력에서 만든다(원본 site/data에는 두지 않는다)
.github/workflows/learning-site.yml
```

사이트는 교재 파일을 복사하지 않는다. 다만 따라 하기 단원에는 가이드를 한 화면으로 옮긴 한눈에 보기를 둔다(3절, [ADR 0007](../decisions/0007-unit-overview-pages.md)). 자료 링크는 모두 `https://github.com/kosta-ai-lab/ai-native-sdlc/blob|tree/main/<경로>` 형식이며 경로 조각마다 URL 인코딩을 적용한다. 그 밖에 검사가 허용하는 외부 주소는 조직 페이지, 저장소 첫 화면, 저장소 아래 주소(Issues 등)뿐이다.

## 2. 로컬 명령

`site/` 안에서 Node.js 18.17 이상으로 실행한다. 2026-11-23에 확인한 버전은 Node.js v24.22.0이다. 설치할 패키지는 없다.

| 명령 | 하는 일 |
|---|---|
| `node scripts/build.mjs` | 화면 파일, 글꼴, `data/*.json`만 `site/dist`로 바이트 그대로 복사하고 `.nojekyll`과 빌드 표식 `.site-build`를 쓴다. 자료 날짜 `data/dates.json`은 git 이력에서 만들어 쓴다 |
| `node scripts/build.mjs --require-history` | git 이력이 온전하지 않으면(얕은 복제) 아무것도 쓰지 않고 실패한다. 배포 워크플로가 이 명령을 쓴다 |
| `node scripts/build.mjs --out <저장소 밖 폴더>` | 빈 폴더이거나 이전 빌드 표식이 있는 폴더에만 빌드한다 |
| `node scripts/check.mjs --dist` | 정적 검사와 산출물 검사(5절) |
| `node scripts/test.mjs` | 계산, 자료 날짜, 검사의 변조 검출, 빌드 재현성, 미리보기 서버 시험 |
| `node scripts/serve.mjs --port 0` | `site/dist`만 `http://127.0.0.1:<빈 포트>/ai-native-sdlc/`로 제공한다. `--base /`는 루트로, `--host <주소>`는 다른 기기에서 열 수 있게 제공한다 |
| `npm run verify` | build → check --dist → test |

**출력 경로 안전 규칙**
- 저장소 안에서는 `site/dist`만 허용한다. 저장소 루트·상위 폴더·파일시스템 루트·홈·`site/` 자체·심볼릭 링크는 거부한다.
- 비어 있지 않은데 빌드 표식이 없는 폴더는 거부한다.
- 표식에 없는 파일이 하나라도 있으면 아무것도 지우지 않고 멈춘다.
- 정리할 때는 이전 표식에 적힌 파일 가운데 사이트 정적 파일 이름 형식인 것만 지운다. 재귀 삭제는 하지 않는다.

**미리보기 서버:** 기본값으로는 127.0.0.1에서만 연다. 빌드 표식이 있는 폴더만 제공한다. 점 파일·상위 경로·알 수 없는 확장자는 404다. GitHub Pages처럼 CSP 응답 헤더를 보내지 않으므로 index.html의 meta CSP가 그대로 적용된다.

## 3. 내용 갱신

로드맵의 내용은 `data/roadmap.json`에, 단원 한눈에 보기의 내용은 `data/unit-<단원>.json`에 있다. 고친 뒤 `npm run verify`를 실행한다.

| 하고 싶은 일 | 고칠 곳 |
|---|---|
| 새 강의·가이드 추가 | `items`에 항목을 더한다(`id`, `kind`, `title`, `by`, `source`, `meta`, `summary`, `how`, `links`). 로드맵의 `stages[].items`에 id를 놓고, `people`에서 만든 사람의 묶음에 넣는다 |
| 준비 중이던 모듈에 본문이 올라옴 | 해당 `kind: "soon"` 항목을 공개 자료 형식으로 바꾼다. README에서 "(작성 예정)"이 없어지면 검사가 알려 준다 |
| 강의 제목 변경 | 강의의 `title`(또는 `original`)은 강의 README의 첫 제목과 같아야 한다. 화면에 다른 제목을 쓰려면 `title`에 쓰고 README 제목을 `original`에 둔다 |
| 단계 추가·순서 변경 | 로드맵의 `stages`를 고친다. 노선도는 11칸이다. 마지막 단계가 11칸을 벗어나면(`col` + 단계 수 − 1이 11보다 크면) 검사가 막는다 |
| 단원 한눈에 보기 추가 | `data/unit-<단원>.json`을 쓰고, 그 자료의 `items` 항목에 `"visual": "<단원>"`을 넣는다. 아래 '단원 한눈에 보기'를 본다 |
| 가이드 문서를 고침 | 한눈에 보기가 있는 단원이면 `data/unit-<단원>.json`도 같이 고친다. 요청문·명령·출력이 달라지면 검사가 '가이드에 없는 줄'로 알려 준다 |
| 사람 이름의 화면 표기 변경 | `names`에서 이름과 화면 표기를 고친다. 화면 표기는 그 이름으로 시작해야 한다(예: `"윤성열": "윤성열 대표"`). `by`와 `people`의 이름은 원문 표기 그대로 둔다 |
| 고정 문구 수정 | `src/index.html`(제목, 설명, 이용 방법, 소개, 하단) 또는 `src/app.js`(버튼과 안내 문구) |
| 로드맵 추가 | 화면이 세 로드맵과 환승 표시 하나를 전제로 한다. 기획과 화면 명세를 고친 뒤 `app.css`·`app.js`·검사를 함께 바꾼다 |

지켜야 할 것:

- **상태는 원문을 따른다.** 준비 중 표시는 README에 "(작성 예정)"이 있는 모듈에만 쓴다. 담당은 README의 표기를 따른다('협의'는 '협의 중'으로 적는다).
- **만든 사람에는 근거가 있어야 한다.** `by`가 자료의 안내 문서나 `courses/README.md`에 나와야 한다. 문서에 이름이 없고 커밋 기록으로만 확인한 자료는 `byEvidence: "git-history"`로 표시한다.
- **약속하지 않는다.** 무료, 보장 같은 표현은 원문에 있어도 요약에 옮기지 않는다.
- **한국어 문장은 배포 전에 모두 검사한다.** 화면에 나오는 글은 `index.html`·`unit.html`, `app.js`·`unit.js`의 문구, `roadmap.json`과 `unit-*.json`의 글 항목이다.

### 자료 날짜와 NEW·업데이트 표시

날짜는 손으로 적지 않는다. 빌드가 git 이력에서 읽어 `dist/data/dates.json`에 쓰고, 화면이 그 파일을 읽는다.

- **무엇의 날짜인가:** 자료의 안내 문서(`source`)와 '자료 열기'에 연결한 파일·폴더(`links`)의 이력이다. 준비 중 자료에는 날짜가 없다.
- **공개한 날:** 그 경로가 처음 들어온 날. 파일을 옮겼으면 옛 경로까지 따라가서 찾는다.
- **업데이트한 날:** 내용이 마지막으로 바뀐 날. 내용이 그대로인 이동은 세지 않는다. 한 번도 바뀌지 않았으면 화면에 공개한 날만 나온다.
- **기준:** main의 첫 부모 이력만 따라가므로(`git log --first-parent`) PR로 들어온 자료는 병합한 날로 잡힌다. 날짜는 한국 시간이다.
- **표시:** 공개한 날을 포함해 14일 동안 NEW, 그 뒤에 내용이 바뀌면 바뀐 날을 포함해 14일 동안 업데이트가 붙는다. 날수는 `src/app.js`의 `FRESH_DAYS`다. 방문자가 여는 날을 기준으로 계산하므로 다시 배포하지 않아도 기간이 지나면 표시가 사라진다.
- **알아 둘 것:** 오타 수정 같은 작은 변경도 업데이트로 잡힌다. 연결하지 않은 파일의 변경은 잡히지 않는다. 얕은 복제에서 빌드하면 틀린 날짜를 내지 않으려고 날짜를 넣지 않는다(`git fetch --unshallow` 뒤에 다시 빌드한다).

### 단원 한눈에 보기

따라 하기 단원의 가이드 문서를 한 화면으로 옮긴 것이다. 주소는 `unit.html?u=<단원>`이고, 로드맵의 자료 안내판 '자료 열기'에 첫 버튼으로 나온다. 화면 틀(`src/unit.html`·`unit.css`·`unit.js`)은 모든 단원이 함께 쓰고, 단원마다 내용 파일 하나만 쓴다.

**원본은 가이드 문서다.** 내용 파일은 가이드를 옮긴 것이므로 가이드에 없는 사실을 넣지 않는다.

- **요청문, 명령, 코드, 출력:** 가이드와 글자 그대로 같아야 한다. 검사가 한 줄씩 대조한다. 긴 출력은 줄을 골라 넣어도 되지만 넣은 줄은 가이드의 줄 그대로여야 한다.
- **설명 문장:** 가이드의 문장을 줄여 옮긴다. 말투는 사이트와 같은 합니다체다. 이 부분은 검사가 대조하지 않으므로 사람이 읽고 확인한다.
- **마디의 순서:** 가이드에 나오는 순서 그대로 적는다. 같은 마디가 두 번 나오면 두 번 적는다.
- **단계 표시의 색:** 색이 실제 상태를 뜻할 때만 쓰고 `marks`에 뜻을 적는다.

내용 파일의 모양은 다음과 같다. 본보기는 `data/unit-06-m01.json`이다.

| 항목 | 내용 |
|---|---|
| `id`, `item`, `guide` | 단원 id(파일 이름과 같다), 로드맵의 자료 id, 가이드 문서 경로 |
| `where`, `title`, `lead` | 화면 위쪽의 위치, 제목, 두세 문장 소개. `title`은 글이거나 `[글, 색]` 조각의 목록 |
| `start` | 처음에 펼쳐 보일 단계 번호(없으면 0) |
| `marks`, `pips` | 단계 동그라미 표시의 뜻(`plain`·`ink`·`warn`·`bad`·`good`·`calm`), 단계 아래 작은 네모의 뜻 |
| `kinds` | 마디의 이름과 한 문장 설명. 예: `"hand": ["맡긴다", "…"]`. 단원이 쓰는 마디를 모두 적는다 |
| `principles` | `{ name, here, did }`의 목록. 원칙의 이름, 이 단원에서 뜻하는 것, 돌아보기. 없으면 원칙 구역과 돌아보기 구역이 나오지 않는다 |
| `steps` | 단계 목록. 단계마다 `title`, `name`(짧은 이름), `state`(표시), `out`(짧은 출력), `pips`·`pipsLabel`, `principles`(원칙 번호), `note`, `lanes`(마디) |
| `lanes` | `{ kind, blocks }`의 목록. `kind`는 `kinds`의 열쇠, `blocks`는 조각의 목록 |
| `sections` | 단원마다 다른 구역. `compare`(나란히 견주기), `chain`(이어지는 길), `table`(표) |
| `promptLabel`, `env` | 요청문 위에 붙는 말(기본 "요청"), 검증 환경 |

조각은 열쇠가 하나인 객체다: `p`(설명), `label`(이름표), `prompt`(요청문), `cmd`(직접 실행하는 명령), `code`(코드와 파일 내용), `term`(터미널 출력), `verdict`(판단 한 줄), `ticks`(확인 목록), `outs`(산출물), `list`(목록), `next`(다음 단계와 잇는 말), `table`(작은 표). 글 안에서는 억음 부호로 감싼 코드와 별표 두 개로 감싼 굵은 글씨를 쓸 수 있다.

확인하는 법:

```bash
node scripts/unit-check.mjs 06-m01     # 형식과 가이드 대조만 빠르게
npm run verify                         # 로드맵 자료와의 짝, 글꼴, 산출물까지
node scripts/serve.mjs --port 0        # 띄운 뒤 unit.html?u=06-m01 을 연다
```

## 4. 글꼴 다시 만들기

화면 글꼴은 IBM Plex Sans KR과 IBM Plex Mono의 부분집합이다(SIL OFL 1.1). Sans KR은 두 묶음으로 나눈다.

- **기본 묶음(core):** 글꼴을 만든 시점에 화면에 쓰던 글자. 그 뒤로 새 글자를 쓰지 않았다면 방문자는 이 묶음만 받는다.
- **추가 묶음(rest):** 한글 완성형 2,350자 가운데 나머지. 내용이 바뀌어 새 글자가 생기면 브라우저가 알아서 받는다.

그래서 내용을 고칠 때마다 글꼴을 다시 만들 필요는 없다. 새 글자가 많이 쌓이면 다시 만들어 기본 묶음에 넣는다. 다만 두 묶음 어디에도 없는 글자(새 기호, 2,350자 밖의 한글)를 쓰면 검사가 실패하므로 그때는 다시 만든다. 저장소 루트에서 실행한다.

```bash
uv run --with fonttools --with brotli python site/scripts/fonts.py
```

도구는 고정한 커밋의 원본 글꼴을 받아 SHA-256을 확인한다. OFL의 예약 글꼴 이름(Plex) 조건에 따라 글꼴 이름을 Roadmap Sans, Roadmap Mono로 바꾼다. 출처와 조건은 [제3자 자료 고지](../THIRD_PARTY_NOTICES.md)에 있다. 빌드·검사·시험은 이 도구 없이 동작한다.

## 5. 정적 검사 범위 (`check.mjs`)

- **데이터 구조:** 필수 항목, id 형식과 중복, 종류, 링크의 `file`/`dir` 구분
- **배치와 참조:** 단계마다 자료가 하나 이상 있는지, 단계의 자료가 실제 항목인지, 놓이지 않은 자료가 없는지, 노선도 11칸, 로드맵마다 다른 도형, 다음 로드맵, 환승 표시의 전제(첫 로드맵 2단계와 둘째 로드맵 1단계가 같은 칸·같은 자료)
- **강사별 자료:** 공개 자료가 만든 사람 아래에 한 번씩 나오는지
- **원본 대조:**
  - 링크 경로가 `git ls-files`에 있는지
  - 준비 중 모듈의 README에 "(작성 예정)"이 있고 담당이 같은지
  - 공개 자료의 안내 문서에 "(작성 예정)"이 없는지
  - 만든 사람의 근거가 있는지, 강의 제목이 README 제목과 같은지
- **단원 한눈에 보기:** 내용 파일의 형식, 요청문·명령·코드·출력의 모든 줄이 가이드 문서에 있는지, 로드맵 자료의 `visual`과 서로 가리키는지, `guide`가 그 자료의 링크에 있는 문서인지. 설명 문장은 대조하지 않는다
- **화면 글:** `index.html`과 `roadmap.json`에 제작 단계 용어(시안·초안 등)와 근거 없이 약속하는 표현이 없는지, 모든 원본에 개인·내부 주소가 없는지. `unit.html`에도 같은 검사를 한다. 단원 내용에는 '초안'처럼 가이드의 낱말이 나오므로 개인·내부 주소만 본다(실습의 로컬 주소는 허용). `app.js`와 `unit.js`의 문구는 사람이 검사한다
- **메타데이터·CSP:** title·description과 같은 og 값, favicon, canonical·og:url·og:image·noindex·CNAME 없음. meta CSP 1개가 link/script보다 먼저 있고 정책이 정확히 일치하는지
- **화면 원본:** inline script·inline style·이벤트 속성·iframe·form 없음, 스크립트 순서, 스크립트가 쓰는 id, `noscript` 안내, 상대 경로, 외부 링크 허용 목록과 링크 경로의 git 추적 여부, 외부 글꼴·CDN 없음
- **화면 스크립트:** 문자열을 HTML로 넣는 API 없음, 추적·외부 전송 API 없음, `app.js`가 읽는 파일은 문서 기준 상대 경로의 로드맵 데이터와 자료 날짜 둘뿐, `localStorage`는 마친 자료 표시 한 항목만. `unit.js`가 읽는 파일은 단원 내용 하나뿐이고 저장 API는 쓰지 않는다. 주소의 단원 id는 소문자·숫자·붙임표만 받는다
- **글꼴:** 선언한 파일이 있는지, 선언에 없는 woff2가 없는지, `OFL.txt`가 있는지, 화면 글자가 글꼴 두 묶음 안에 있는지(터미널 출력의 기호 ❯와 ✓는 원본 글꼴에 없어 시스템 글꼴로 보인다)
- **워크플로:** 권한 범위, main 전용 배포 조건, configure/deploy는 deploy job에만, `github-pages` environment와 `needs: build`, build job의 build·check·test, 이력 전체 받기(`fetch-depth: 0`)와 `--require-history`, action major(6절)
- **`--dist`:** 허용 목록과의 정확한 일치, 원본과 바이트 동일(재현성), 원본 교재·스크립트·CNAME 미포함, 빌드 표식에 로컬 경로 없음, `/ai-native-sdlc/`와 `/` 양쪽 해석, 자료 날짜 파일의 형식과 지금 이력에서 다시 읽은 값과의 일치

## 6. GitHub Actions 워크플로

파일: `.github/workflows/learning-site.yml`

| 이벤트 | build job | Pages artifact | deploy job |
|---|---|---|---|
| `pull_request` (site/, 자료 폴더 modules/·courses/·samples/, 워크플로 변경) | build · check --dist · test | 만들지 않음 | 실행하지 않음 |
| `main`에 `push` (같은 경로) | 실행 | `site/dist` 업로드 | 실행 |
| `main`에서 `workflow_dispatch` | 실행 | 업로드 | 실행 |
| 다른 브랜치에서 `workflow_dispatch` | 실행 | 만들지 않음 | 실행하지 않음 |

- 권한: 최상위 `contents: read`. `pages: write`·`id-token: write`는 deploy job에만 있다.
- 배포 조건: `github.event_name != 'pull_request' && github.ref == 'refs/heads/main' && github.repository == 'kosta-ai-lab/ai-native-sdlc'`.
- 동시 실행: PR은 같은 ref의 이전 실행을 취소하고, 배포는 `pages` 그룹에서 취소 없이 실행한다. `actions/checkout`은 `persist-credentials: false`다.
- 이력: 자료 날짜를 git 이력에서 읽으므로 `fetch-depth: 0`으로 이력 전체를 받고, `build.mjs --require-history`로 이력이 온전한지 확인한다.
- 경로 조건: 자료가 놓인 최상위 폴더가 push의 `paths`에 있어야 한다. 자료를 새 최상위 폴더에 두고 로드맵에 연결하면 검사가 그 폴더를 `paths`에 넣으라고 알려 준다.
- Node.js: `ubuntu-latest` 기본 Node를 쓰고 로그에 버전을 남긴다.

### Action 버전 근거 (2026-11-11 확인)

[GitHub Docs — Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 예시를 따른다: `actions/checkout@v6` · `actions/configure-pages@v5` · `actions/upload-pages-artifact@v4` · `actions/deploy-pages@v4`. 버전을 올릴 때는 공식 문서·릴리스 노트를 확인하고 `site/scripts/check.mjs`의 `ACTION_MAJORS`도 함께 바꾼다.

## 7. 배포 절차

1. PR에서 `Learning site / Build and check (site only)` 통과를 확인한다.
2. main에 병합한다. `site/`나 자료 폴더(`modules/`, `courses/`, `samples/`)가 바뀌었으면 배포가 자동으로 실행된다. 자료 본문만 고쳐도 다시 배포해야 화면의 업데이트한 날이 바뀌기 때문이다. 바뀐 파일이 경로 조건에 해당하지 않으면 `Learning site`를 main에서 수동 실행한다.
3. 공개 주소 https://kosta-ai-lab.github.io/ai-native-sdlc/ 에서 확인한다: 노선도, 로드맵 바꾸기, 자료 고르기와 원본 링크, 자료 날짜와 NEW·업데이트 표시, 강사별 자료, 마친 자료 표시, `#dev/sddc` 주소로 새로 고침, 좁은 화면, 콘솔의 CSP 위반 없음.
4. 문제가 있으면 직전 성공 실행을 재실행하거나 되돌리는 PR을 올린다.

## 8. 편집 메모 (공개 화면에 싣지 않음)

- 조직 표기는 GitHub 식별자 `kosta-ai-lab`을 쓴다. 소개 문구의 근거는 저장소 README이며, 기관의 공식 소개문으로 확정된 것은 아니다.
- **사이트가 편집한 순서:** '처음 시작하기'의 강의 순서와 '에이전트 하니스'의 단계 묶음은 원문에 근거가 없는 사이트의 편집이다. 담당 강사가 순서를 정하면 그에 맞춘다. 'AI-Native 개발 전주기'는 방법론의 순서를 따르되, 객체설계(07)를 설계 강의와 함께 '설계' 단계에 두어 인수조건(05)과 구현(06)보다 앞에 놓았다.
- **담당 표기:** `by`에는 각 README의 표기를 그대로 적는다(검사가 원문과 대조한다). 화면에는 `names` 표의 표기로 통일해 보여 준다. 표에 있는 사람은 박준성 교수, 윤성열 대표, 이선아 교수 셋이다. README에 '박준성 회장'으로 적힌 자리도 화면에는 '박준성 교수'로 나온다. 표에 없는 사람은 README의 표기 그대로 나와서 '최성웅'과 '최성웅 교수'처럼 다를 수 있다. README의 '협의'만 '협의 중'으로 적는다.
- **이용 순서:** `SAMPLE.md`의 성격이 가이드마다 다르다(완성한 앱 확인, 이어지는 과제, 예제 앱 안내, 명령 요약 등). 그래서 이용 순서와 링크 이름을 자료마다 원문을 보고 썼다. 가이드를 더할 때도 `SAMPLE.md`를 열어 보고 쓴다.
- **자료 제목:** 강의 제목은 강의 README의 제목을 쓴다. README 제목이 영어인 강의 둘은 한국어 제목을 쓰고 원제를 함께 보여 준다. 가이드 제목은 README의 목적을 줄인 편집이다.
- **만든 사람:** Personal AI Agent Development 강의와 할 일 생성 예제는 안내 문서에 이름이 없어 커밋 기록의 작성자로 확인했다. 강의는 `courses/README.md`의 강의 표에 강사를 올렸고, 예제는 `byEvidence: "git-history"`로 표시했다.
- **원본에 남아 있는 문제(원본은 수정하지 않음):**
  - `modules/04-sdd/M03-spec-kit`의 README, SAMPLE, GUIDE가 가리키는 `GUIDE.md`·`GUIDE-windows.md`·`GUIDE-codex.md`는 없다. 실제 파일은 `GUIDE-claude-mac.md`, `GUIDE-claude-windows.md`, `GUIDE-codex-mac.md`, `GUIDE-codex-windows.md`이고 사이트는 실제 파일로 연결한다.
  - 하니스 M11, M13, M15의 `SAMPLE.md`는 머리글만 있는 빈 양식이다. 사이트는 이 세 파일을 연결하지 않는다.
  - 하니스 M07 README는 `SAMPLE.md`가 있다고 표시하지만 파일이 없다. M01 README에는 작성 중 메모("논의 사항")가 남아 있다.
- **공개 전 표기:** GETTING_STARTED, BACKLOG, GOVERNANCE, CONTRIBUTING, PR 양식의 머리말에는 저장소가 비공개였던 때의 안내가 남아 있다. 이번 변경에서는 고치지 않았다.
