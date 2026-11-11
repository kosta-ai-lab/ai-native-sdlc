# kosta-ai-lab 공개 포털 — 운영 안내

> 정본 기획: [LEARNING_SITE_PLAN.md](LEARNING_SITE_PLAN.md) · 화면 명세: [LEARNING_SITE_DESIGN.md](LEARNING_SITE_DESIGN.md)
> 이 문서는 포털의 빌드·검사·갱신·배포 절차를 정리한다. Pages 활성화, main 병합, 첫 실서비스 배포는 검토 후 메인테이너가 따로 진행한다.

## 1. 구성

```text
site/
  package.json        스크립트만 있고 의존성은 없다(Node 내장 모듈만 사용)
  src/                index.html(승인 문구·메타·meta CSP) · story.css · layers.css · motion-core.js · layers.js · story.js · favicon.svg
  data/portal.json    로드맵 영역·주제·확장 주제, 공개 항목(프로젝트·강의·예제) 연결
  data/sources.json   원본 링크 manifest(path·url·status·type·evidence·verify)
  scripts/            build · check · test · behavior(최소 DOM 동작 회귀) · serve · lib
  dist/               빌드 산출물(.gitignore의 dist/ 규칙으로 추적하지 않음)
.github/workflows/learning-site.yml
```

소개 문구는 `index.html`에 문서로 두고, 로드맵·자료 연결은 데이터로 관리한다. 사이트는 교재를 복사하지 않는다. 원본 링크는 모두 `https://github.com/kosta-ai-lab/ai-native-sdlc/blob|tree/main/<경로>` 형식이며 경로 조각마다 URL 인코딩을 적용한다. 그 밖에 허용하는 외부 주소는 조직 페이지 `https://github.com/kosta-ai-lab`와 저장소 Issues뿐이다.

## 2. 로컬 명령

`site/` 안에서 Node.js 18.17 이상으로 실행한다. 실제 검수 버전은 Node.js v22.23.1이며, 다른 지원 버전의 실행은 별도 확인이 필요하다. 설치할 패키지는 없다.

| 명령 | 하는 일 |
|---|---|
| `node scripts/build.mjs` | 화면 파일 7개와 `site/data/*.json`만 `site/dist`로 바이트 그대로 복사하고 `.nojekyll`과 빌드 표식 `.site-build`를 쓴다 |
| `node scripts/build.mjs --out <저장소 밖 폴더>` | 빈 폴더이거나 이전 빌드 표식이 있는 폴더에만 빌드한다 |
| `node scripts/check.mjs --dist` | 정적 검사와 산출물 검사(4절) |
| `node scripts/test.mjs` | 데이터·검사 변조 검출·화면 동작 회귀(src·dist, 두 base)·갱신 대응·빌드 재현성·미리보기 서버 테스트 |
| `node scripts/behavior.mjs [--dist]` | 최소 DOM·가짜 시계에서 실제 화면 스크립트를 실행하는 동작 회귀만 따로 실행 |
| `node scripts/serve.mjs --port 0 [--base /ai-native-sdlc/ \| --base /]` | `site/dist`만 `http://127.0.0.1:<빈 포트>/ai-native-sdlc/`(기본) 또는 루트 `/`로 제공한다 |
| `npm run verify` | build → check --dist → test |

**출력 경로 안전 규칙**
- 저장소 안에서는 `site/dist`만 허용한다. 저장소 루트·상위 폴더·파일시스템 루트·홈·`site/` 자체·심볼릭 링크는 거부한다.
- 표식 없는 비어 있지 않은 폴더는 거부한다.
- 표식에 없는 파일이 하나라도 있으면 **아무것도 지우지 않고** 중단한다.
- 정리할 때는 이전 표식에 적힌 파일 가운데 사이트 정적 파일 이름 형식(`*.html|css|js|json|svg`, `data/` 아래 포함)인 것만 지운다. `..`나 절대 경로가 적힌 표식 항목은 무시한다. 재귀 삭제는 하지 않는다.

**미리보기 서버:** 127.0.0.1에만 바인딩한다. 빌드 표식이 있는 폴더만 제공한다. 기본 base에서는 `/`를 302, `/ai-native-sdlc`를 301로 보낸다. `--base /`에서는 `/`에서 바로 index를 준다(자기 자신으로 리다이렉트하지 않음). 점 파일·상위 경로·알 수 없는 확장자는 404다. GitHub Pages와 같게 CSP 응답 헤더를 보내지 않으므로 index.html의 meta CSP가 그대로 적용된다.

## 3. 내용 갱신

| 하고 싶은 일 | 고칠 곳 |
|---|---|
| 소개·참여 문구 수정 | `src/index.html` (승인 문구를 바꾸면 `check.mjs`의 `APPROVED_COPY`도 함께 고친다) |
| 새 강의 추가 | `courses/README.md`와 루트 README에 오른 뒤, `sources.json`에 원본 항목을 추가하고 `portal.json courses[]`에 `areas`와 함께 한 항목을 추가한다 |
| 새 공개 자료·프로젝트 추가 | `portal.json resources[]`에 항목 하나(`areas`, `actions`)를 추가한다. 로드맵 영역 장면·영역 펼침·상세·무대의 연결이 자동으로 반영된다 |
| 운영 서비스 추가 | 운영 여부를 실제로 확인한 뒤 `kind:"service"`로 추가한다. `status:"operating"`에는 `verified:{date,url}`가 필요하다. 새 도메인은 `scripts/check.mjs`의 `allowedExternal`과 `src/story.js`의 링크 허용 규칙 양쪽에 근거와 함께 추가하고, 링크의 보조 설명도 실제 목적지에 맞춘다. 빌드 검사뿐 아니라 브라우저에서 버튼 주소와 이동을 확인한다 |
| 모듈 상태 변화 | 원본 README의 `상태·담당`이 바뀌면 `sources.json`의 `verify·status`와 `portal.json`의 `sourceStatus·owner`를 맞춘다. 목적이 "(작성 예정)"에서 실제 내용으로 바뀌면 `modulePending`을 `false`로 바꾼다 |
| 주제에 자료 연결 | `sources.json`에 원본을 추가하고 주제의 `related`에 id를 넣는다. 연결 자료가 생기면 `availability`를 `available`로 바꾼다. 검사가 "연결 자료가 있는데 준비 중" 또는 그 반대를 막는다 |
| 새 영역 | 승인된 다섯 영역 이름은 검사로 고정되어 있고, 영역 펼침 배치(`layers.js`)도 다섯 영역을 전제로 한다. 영역 체계를 바꾸려면 기획·디자인 승인 후 검사와 배치를 함께 고친다 |

선후관계·고정 학습 순서는 데이터에 넣지 않는다(검사가 `prerequisites`, `order` 등의 필드를 막는다). 근거 자료로 정해지면 기획 승인을 거쳐 추가한다.

## 4. 정적 검사 범위 (`check.mjs`)

- **sources:** 필수 필드, id 중복, `git ls-files` 존재, 경로로 계산한 URL과의 일치, `verify` 문자열이 원문에 있는지
- **영역:** 승인된 다섯 이름, 이전 `#stage/01`~`10`이 모두 한 영역에 연결되는지, 선후관계 필드 금지
- **주제·확장:**
  - 영역 참조, 원문 상태·담당 반영
  - `modulePending`이 원문의 "(작성 예정)" 여부와 일치하는지
  - `availability`가 실제 연결 자료(git 추적 `related`) 또는 목적이 작성된 모듈 문서의 유무와 일치하는지. 빈 README만으로는 "공개 자료 있음"이 될 수 없다
- **공개 항목:**
  - 상태 값, 근거 없는 "운영 중" 금지, 외부 주소 허용 목록, 사이트 안 이동 대상 존재
  - 예제가 요구사항→명세→인수조건→테스트→구현 순서인지
- **강의:** 개수 상한 없이 각 항목의 README 강의 목록 제목과 강의 README 원제목 일치, 교재 PDF, 강사 근거, `_sample-course` 제외. 추가 강의가 검사를 통과하고 중복 id는 거부되는 회귀 시험을 포함한다.
- **화면 문구:**
  - 승인 초안 제목·핵심 문장·메뉴·하단 링크 보존
  - 홈 화면(index.html)의 내부 용어(시안·초안·검수·감사·미확정·TODO·preview) 금지
  - 배포 원본 전체(src·data)의 검토용 흔적(통합 시안·시안 비교·designs-v2 등)과 개인·내부 경로 금지
- **메타데이터·CSP:** 승인 title·description과 같은 og 값, favicon, canonical·og:url·og:image·noindex·CNAME 없음. meta CSP 1개가 link/script보다 먼저 있고 정책이 정확히 일치, meta에서 무시되는 지시어(frame-ancestors 등) 없음, inline script·이벤트 속성·위험 DOM API 없음, 스크립트 순서, 스크립트가 쓰는 id 존재
  - 과장·추적 표현과 저장 API 금지
- **자산:** 상대 경로(스킴·`/`·`..` 금지), 데이터 경로 `new URL('data/' + name, document.baseURI)`, 원격 폰트·CDN 금지
- **워크플로:** 권한 범위, main 전용 배포 조건, configure/deploy는 deploy job에만, needs·page_url, build job의 build·check·test, action major(5절)
- **`--dist`:** 허용 목록과의 정확한 일치, 소스와 바이트 동일(재현성), 원본 교재·스크립트·CNAME 미포함, 빌드 표식에 로컬 경로 없음, `/ai-native-sdlc/`와 `/` 양쪽 해석

## 5. GitHub Actions 워크플로

파일: `.github/workflows/learning-site.yml`

| 이벤트 | build job | Pages artifact | deploy job |
|---|---|---|---|
| `pull_request` (site/ 또는 워크플로 변경) | build · check --dist · test | 만들지 않음 | 실행하지 않음 |
| `push` to `main` (같은 경로) | 실행 | `site/dist` 업로드 | 실행 |
| `workflow_dispatch` on `main` | 실행 | 업로드 | 실행 |
| `workflow_dispatch` on 다른 브랜치 | 실행 | 만들지 않음 | 실행하지 않음 |

- 권한: 최상위 `contents: read`. `pages: write`·`id-token: write`는 deploy job에만 있다.
- 배포 조건: `github.event_name != 'pull_request' && github.ref == 'refs/heads/main' && github.repository == 'kosta-ai-lab/ai-native-sdlc'`.
- 동시 실행: PR은 같은 ref의 이전 실행을 취소하고, 배포는 `pages` 그룹에서 취소 없이 실행한다. `actions/checkout`은 `persist-credentials: false`다.
- Node.js: `ubuntu-latest` 기본 Node를 쓰고 로그에 버전을 남긴다.

### Action 버전 근거 (2026-11-11 확인)

[GitHub Docs — Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 예시를 따른다: `actions/checkout@v6` · `actions/configure-pages@v5` · `actions/upload-pages-artifact@v4` · `actions/deploy-pages@v4`, deploy job의 `needs: build`, `github-pages` environment와 `page_url`, job 권한 `pages: write`·`id-token: write`. starter의 `path: '.'` 대신 `site/dist`로 한정했다. 버전을 올릴 때는 공식 문서·릴리스 노트를 확인하고 `site/scripts/check.mjs`의 `ACTION_MAJORS`도 함께 바꾼다. Actions 방식 배포에는 Jekyll이 돌지 않으므로 `.nojekyll`이 artifact에서 빠져도 동작한다.

## 6. 첫 배포 절차 (검토 승인 후, 메인테이너가 수행)

1. PR에서 `Learning site / Build and check (site only)` 통과를 확인한다.
2. Settings → Pages → Source를 **GitHub Actions**로 바꾼다. 2026-11-10 조회에서 Pages는 404였다.
3. Settings → Environments → `github-pages` 배포 브랜치가 `main`만 허용하는지 확인한다.
4. main에 병합한다. 경로 조건에 걸리지 않으면 `Learning site`를 main에서 수동 실행한다.
5. 배포 주소(예상 `https://kosta-ai-lab.github.io/ai-native-sdlc/`, 실제 주소는 배포 후 확인)에서 확인한다: 스크롤 스토리, 영역 펼침→상세→닫기 복귀, Escape·뒤로·Tab, `#area-spec`·`#stage/04`·`#path/todo` 새로고침, 강의·예제 원본 링크, 동작 줄이기, 모바일 폭, 콘솔의 CSP 위반 없음.
6. 문제가 있으면 직전 성공 실행을 재실행하거나 되돌리는 PR을 올린다.

## 7. 편집·운영 메모 (공개 화면에 싣지 않음)

- 조직 표기는 GitHub 식별자 `kosta-ai-lab`을 쓴다. 소개 문구의 활동 근거는 저장소 README이며, 기관의 공식 소개문으로 확정된 것은 아니다. 권한·보증을 확대해 쓰지 않는다.
- **운영 서비스:** 별도로 연결할 운영 서비스의 이름과 URL은 확인되지 않았다. 그래서 공개 목록에는 프로젝트·강의·코드 예제만 두었고, 운영 중으로 표시한 항목은 없다. 할 일 예제는 웹 앱 실행 서비스가 아니다(README 설명 유지).
- **원본의 기존 링크 문제(원본은 수정하지 않음):**
  - `courses/README.md` 표가 Agentic 강의를 존재하지 않는 `agentic-coding-using-claude-code/`로 연결한다. 실제 폴더는 `Agentic Coding using Claude Code/`이다.
  - `modules/04-sdd/M03-spec-kit/README.md`가 언급하는 `GUIDE-windows.md`·`GUIDE-codex.md`는 없다. 실제 파일은 `GUIDE-claude-*`, `GUIDE-codex-*`이다.
- **영역 배치:** 영역에 주제를 둔 배치는 README의 "무엇을 배울 수 있나요?" 분류를 따른 사이트 편집이며, 선후관계를 뜻하지 않는다. 모듈 06은 성격에 따라 두 주제로 나눴다: 작업 규칙·자동화는 'AI와 구현', 테스트 먼저 구현하기는 '테스트·검증'. 임베디드는 원문 목적이 작성 전이라, 이름("환경 구축")을 근거로 'AI와 구현'에 임시로 연결했다.
- **강의 표기:** 강의 제목은 루트 README 강의 목록의 표기를 쓰고, 강의 README의 원제목을 함께 보인다. Agentic 강의의 강사(박준성)는 강의 목록 표기이고, 분량은 강의 README의 "4시간"이다(목록 표기는 "4시간 × 10편 시리즈").

## 8. 이번 작업에서 하지 않은 것

- 원격 commit·push·PR 수정, Pages 설정, 배포, 워크플로 원격 실행
- 실제 브라우저 렌더링과 한국어 교정(관제 검수자가 수행)
- origin/main의 새 커밋(강의 PDF·새 모듈 등) 병합과 그 자료의 sources/portal 반영. 새 자료는 담당·상태 확인 후 사람이 추가한다
- 원본 README·LICENSE·CONTRIBUTING·modules·courses·samples 수정
