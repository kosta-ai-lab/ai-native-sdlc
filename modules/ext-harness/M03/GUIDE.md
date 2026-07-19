# 개념

**Research Assistant 하네스**는 Claude Code 안에서 **학술 연구 보조 전문가 5명이 팀으로 협업**하도록 미리 설정해 놓은 구성 파일 묶음입니다.

"문헌 리뷰 해줘"라고 한 마디만 하면, 아래 5명의 에이전트가 순서대로(일부는 동시에) 일합니다.

| 에이전트 | 하는 일 |
|---------|--------|
| 🔍 literature-searcher | 논문·서적·보고서를 웹에서 검색하고 관련성 평가 |
| 📝 note-taker | 문헌별로 구조화된 읽기 메모 작성 (핵심 논지, 방법론, 인용 구절) |
| 🧠 critic-synthesizer | 비판적 분석, 테마별 종합, 연구 갭(gap) 식별 |
| 📚 reference-manager | APA/MLA/Chicago 등 인용 형식 관리, BibTeX 생성 |
| ✅ research-coordinator | 전체 결과물 교차 검증 후 최종 보고서 작성 |

최종적으로 `_workspace/` 폴더에 **문헌 검색 결과 → 읽기 메모 → 비평·종합 → 참고문헌 → 최종 연구 보고서** 5개의 마크다운 파일이 만들어집니다.

> ⚠️ **범위 참고**: 실험 수행, 통계 분석 실행, 논문 최종 집필, 학술지 투고는 이 하네스의 범위가 아닙니다. "연구 준비 단계"를 도와주는 도구입니다.

# 1 단계:환경 설정

1. **Claude Code 설치** — 터미널에서 실행되는 Anthropic의 AI 코딩 도구입니다.

   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

   > Node.js 18 이상이 필요합니다. 설치 여부는 `node -v`로 확인하세요.
   > 설치 후 터미널에서 `claude`를 입력하면 로그인 안내가 나옵니다 (Claude Pro/Max 구독 또는 API 키 필요).

2. **Git 설치** (하네스 다운로드용) — `git --version`으로 확인. 없다면 [git-scm.com](https://git-scm.com)에서 설치하거나, 아래 4단계의 "Git 없이 받기" 방법을 사용하세요.

## 규칙 및 산출물

특정 규칙과 산출물은 없습니다. 

## 체크리스트
[ ] 필요한 프로그램이 다 설치되었는지 확인한다.

# 2 단계: 작업 폴더 만들기

연구 자료가 저장될 폴더를 하나 만듭니다. 

```bash
mkdir my-research
cd my-research
```

## 규칙

폴더 이름은 자유롭게 작성 가능합니다. 하지만 에이전트에서 해당 폴더명을 참조할 수도 있습니다.

## 산출물

```bash
my-research
```
## 체크리스트
[ ] 폴더명이 만들어졌는지 확인한다.

# 3 단계: 참조 깃허브 싸이트에서 하네스 다운로드받기

### 방법 A — Git으로 받기 (권장)

저장소 전체가 아니라 필요한 하네스 하나만 가볍게 받아옵니다.

```bash
# 1) 임시 폴더에 저장소를 얕게 클론
git clone --depth 1 https://github.com/revfactory/harness-100.git /tmp/harness-100

# 2) research-assistant 하네스의 .claude 폴더를 내 프로젝트로 복사
cp -r /tmp/harness-100/ko/63-research-assistant/.claude ./

# 3) 임시 폴더 정리 (선택)
rm -rf /tmp/harness-100
```

### 방법 B — Git 없이 받기

1. 브라우저에서 https://github.com/revfactory/harness-100 접속
2. 초록색 **Code** 버튼 → **Download ZIP** 클릭
3. 압축을 풀고 `ko/63-research-assistant/` 안에 있는 **`.claude` 폴더**를 내 작업 폴더(`my-research/`)로 복사

> 💡 `.claude`는 점(.)으로 시작하는 **숨김 폴더**입니다. 파일 탐색기에서 안 보이면 "숨김 파일 표시"를 켜세요 (macOS: `Cmd+Shift+.`).

### 잘 복사됐는지 확인

```bash
ls -R .claude
```

## 규칙

참조 깃허브 싸이트에 있는 내용을 그대로 받아오는 작업으로, 특별한 규칙이 없습니다.

## 산출물

아래와 같은 구조가 보이면 성공입니다. 내가 만든 폴더 아래에 다음이 보여야 합니다.

```
.claude/
├── CLAUDE.md
├── agents/
│   ├── literature-searcher.md
│   ├── note-taker.md
│   ├── critic-synthesizer.md
│   ├── reference-manager.md
│   └── research-coordinator.md
└── skills/
    ├── research-assistant/skill.md          ← 오케스트레이터(팀 지휘자)
    ├── systematic-review-protocol/skill.md  ← PRISMA·PICO·Boolean 검색 지원
    └── citation-formatter/skill.md          ← APA/MLA/Chicago·BibTeX 변환
```

## 체크리스트
[ ] 내가 만든 폴더명이 존재하는지 확인한다.
[ ] 특정 선택한 하네스가 내가 만든 폴더명 아래 존재하는지 확인한다.
