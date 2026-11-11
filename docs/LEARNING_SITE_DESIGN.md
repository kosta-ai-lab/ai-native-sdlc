# kosta-ai-lab 공개 포털 — 화면 명세

> 정본 기획: [LEARNING_SITE_PLAN.md](LEARNING_SITE_PLAN.md) · 운영: [LEARNING_SITE_OPERATIONS.md](LEARNING_SITE_OPERATIONS.md)
> 이 문서는 승인된 통합 디자인(스크롤 스토리 + 영역 펼침 + 자료 상세)을 `site/`에 옮긴 구현 명세다. 2026-11-11 승인된 첫 방문 UX 핵심 수정(첫 화면·강의 카드·상세 한 단계·모바일 지도·상태 두 축·문구)을 반영했다. 배포·병합 승인을 뜻하지 않는다.

## 0. 개요

- **역할:** 학습 플랫폼이 아니라 공식 입구다. 취지를 소개하고, 로드맵을 보여 주고, 지금 열람할 수 있는 공개 자료(프로젝트·강의·코드 예제)로 연결하고, 참여 방법을 안내한다.
- **화면 흐름:** 첫 화면(조직·얻을 자료·다음 행동) → 01 소개 → 02 로드맵(영역별 장면, 확장 주제) → 03 공개 자료(공개 항목, 강의, 코드 예제) → 04 참여 → 하단.
- **첫 화면:** 제목 ‘AI와 함께 개발하고, 경험과 자료를 나눕니다’, 얻을 자료(강의자료·코드 예제) 문장을 먼저 두고 판단·검토의 관점은 다음 문장에 둔다. 주 행동 ‘강의자료 보기’(→ `#courses` 강의 목록), 보조 ‘개발 주제별로 찾기’(→ `#roadmap`). 그 아래 ‘추천 시작 강의’는 `courses[].pick`이 있는 강의의 공식명·배우는 것과 강의 카드 링크다.
- **목차:** 취지 · 소개 · 개발 영역 · 공개 자료 · 참여, 상단 오른쪽 ‘바로 자료’.
- **세 가지 동작**
  1. **스크롤 스토리:** 왼쪽 본문을 일반 문서 스크롤로 읽는다. 오른쪽 sticky 무대(자체 SVG)의 도형 조각이 스크롤 거리에 선형으로 연동되어 흩어진 상태 → 개발 영역 지도 → 영역별 확대 → 공개 자료 형상으로 바뀐다. 스크롤을 가로채거나 관성을 넣지 않는다.
  2. **영역 펼침:** 로드맵에서 영역을 고르면 무대에 조립된 영역 도형 위치에서 공간이 커진다. 선택한 영역은 넓어지고 나머지는 가장자리로 압축된다. 그 안에서 주제·두 상태·담당·연결 강의·예제를 본다.
  3. **자료 상세:** 프로젝트·강의 카드, 영역의 연결 자료에서 상세 시트가 카드 위치에서 펼쳐진다. 상세는 한 단계만 연다(상세 위에 상세를 겹치지 않는다). 영역 위의 상세는 허용하며, 닫으면 그 영역으로 돌아온다.
- **문구 원칙:** 명사 나열 대신 여기서 보는 것·하는 일·버튼 결과를 쓴다. 안내는 짧게 한 번만 쓰고 같은 설명을 곳곳에 반복하지 않는다. 같은 페이지 이동은 이름 뒤 ↓, GitHub 원문은 이름 뒤 ‘GitHub’ 표시로 결과를 예고한다. 원문은 같은 탭에서 열리고 브라우저 뒤로 가기로 돌아온다.
- **하지 않는 것:** 새 교재, LMS, 회원, DB, CMS, 진도·완료 표시, AI 튜터, 확인되지 않은 운영 서비스 표시, 고정 학습 순서 확정, 외부 폰트·CDN·외부 이미지.

## 1. 파일

| 파일 | 역할 |
|---|---|
| `site/src/index.html` | 승인 문구와 구역 골격, 메타데이터, meta CSP. 데이터가 없어도 소개·참여와 대체 링크가 보인다 |
| `site/src/story.css` | 토큰, 레이아웃, 스크롤 스토리·무대, 모바일·reduced-motion 분기 |
| `site/src/layers.css` | 여는 버튼, 영역 펼침, 자료 상세 |
| `site/src/motion-core.js` | DOM 없는 순수 계산: 무대 배치, 장면 상태, 선형 보간 (`window.MotionA`) |
| `site/src/layers.js` | 겹 화면(영역 펼침·자료 상세)의 단일 소유자: 스택·history·초점·inert·스크롤 잠금 (`window.KLayers`) |
| `site/src/story.js` | 데이터 로드와 렌더, 무대 SVG 생성, 스크롤 연동, 목차, 해시, 오류 표시 |
| `site/src/favicon.svg` | 상단 브랜드 표식과 같은 도형 |
| `site/data/portal.json` | 영역·주제·확장 주제·공개 항목·강의 연결 |
| `site/data/sources.json` | 원본 링크 manifest(path·url·status·type·evidence·verify) |

스크립트는 `motion-core.js → layers.js → story.js` 순서로 `defer` 로드한다. 데이터는 `new URL('data/' + 이름, document.baseURI)`로 읽으므로 `/ai-native-sdlc/` 하위 경로와 루트(`/`) 어디서든 같은 출처의 상대 경로로 동작한다.

## 2. 글꼴과 색

- 글꼴: 시스템 글꼴만 쓴다. 본문 `-apple-system, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui`, 숫자·라벨 `ui-monospace, "SF Mono", Menlo, Consolas`. 글꼴 파일은 내려받지 않는다.
- 색 토큰: `--paper #f3f1ec`, `--ink #111311`, `--muted #55594f`, `--line #cfcbc0`, `--accent #2d4bf0`, `--stage #e9e6de`.
- 상단 높이 `--head` 64px(모바일 56px), 좌우 여백 `--gut` 48px(모바일 20px).

## 3. 스크롤 스토리

- 장면 = 취지, 소개, 로드맵, 영역 × N, 확장 주제, 공개 자료(현재 데이터로 10장면). `motion-core.js`의 `sceneNames(data)`가 데이터에서 계산한다.
- 장면 기준점 `a_i = max(0, docTop(step_i) − refY)`, 장면 값 `f = i + (scrollY − a_i)/(a_{i+1} − a_i)`. refY는 데스크톱 `0.5·innerHeight`, 모바일은 상단 아래 남은 화면의 30% 지점이다.
- **모바일(860px 이하) 지도:** 무대는 sticky가 아니다. 첫 화면 아래의 보조 그림(높이 `min(84vw,340px)`)으로, 화면 아래에서 들어와 위쪽에 닿는 동안 흩어진 도형이 조립된 지도(장면 2)로 모인다. 그래서 ‘바로 자료’·‘강의자료 보기’로 이동하면 제목과 목록이 상단 바로 아래에 보인다. 본문 장면 기준점·목차 표시는 그대로 계산한다.
- 무대 안내(`#hud-label`)는 학습 진도로 읽히지 않게 ‘페이지 안내 n/N · 장면 이름’(모바일·동작 줄이기: ‘개발 과정 지도’)으로 쓴다.
- 무대 조각: 영역·주제·확장 주제마다 하나씩(현재 18개). 장면 0 흩어짐 → 장면 2 지도 조립 → 영역 장면마다 카메라 1.8배 확대 → 마지막 장면에서 프로젝트 틀·강의 책등·예제 사슬로 재조립된다.
- 무대는 장식(`aria-hidden`)이다. 같은 정보가 본문에 모두 있다.
- 관측 지점: `#story[data-progress|data-scene|data-scene-progress]`, `#cam[transform]`, `#cam [data-piece]`, `#hud-label`, `#toc a[aria-current]`.

## 4. 영역 펼침 (`#explore.xl`)

- 여는 곳: 로드맵 장면의 영역 목록 버튼(`#area-index [data-open-area]`: 큰 영역 이름 + 짧은 행동 설명 `areas[].hint` + ‘주제 n · 공개 자료 m’), 각 영역 장면의 ‘이 영역 펼쳐 보기’.
- 시작 기하는 무대 영역 도형의 실제 화면 rect다. 도형이 화면 밖이면(모바일 비고정 지도를 지나 내려온 경우) 누른 버튼 rect에서 커지고, 닫을 때 그 버튼(전환했으면 지금 영역의 여는 버튼)으로 돌아간다. 끝 배치는 다음과 같다.
  - 넓은 화면(필드 폭 720px 이상): 선택 공간이 넓어지고, 나머지 영역은 76px 세로 기둥으로 압축된다.
  - 좁은 화면: 선택 공간이 필드 전체를 쓰고 나머지는 높이 0으로 접힌다. 접힌 세로 탭은 숨겨 Tab 순서에서 뺀다.
- **상단 바(본문 스크롤 밖, 항상 보임):** ‘지금 보는 영역 <이름>’, ‘← 로드맵으로’, 현재 영역을 포함한 영역 바꾸기 목록(`.xl__nav [data-zone-tab]`, 현재는 `aria-current`). 압축 기둥이나 목록을 누르면 그 영역으로 전환한다(history replace).
- **본문 순서:** 제목·설명 → 영역 안 바로 가기(공개 자료 있는 주제 / 연결된 강의·예제 / 준비 중인 주제, 개수 표시) → 공개 자료가 있는 주제 → 이 영역과 연결된 강의·예제(예제 파일 포함) → 준비 중인 주제 → 확장 주제 → 두 상태 한 줄 범례. 넓은 본문(860px 이상)은 왼쪽 주제·오른쪽 강의·예제 두 열이다. 바로 가기는 본문 안에서 스크롤하고 그 제목에 초점을 둔다.
- 닫으면 각 공간이 무대 도형(또는 버튼) 위치로 돌아가고, 스크롤 위치·무대 상태·연 버튼 초점이 복원된다.
- 상태: `#explore[data-state]` = `closed | opening | open | switching | closing`, `[data-area]`, `[data-t]`, `[data-frames]`, 공간 `.zone[data-zone][data-geom="x,y,w,h"]`.
- 배치는 승인된 다섯 영역을 전제로 한다(넓은 화면 압축 기둥 4개, 좁은 화면 상단 4칸). 영역 수를 바꾸려면 디자인 승인과 `layers.js` 배치 수정이 함께 필요하다.

## 5. 자료 상세 (`.dl[role=dialog]`)

- 여는 곳: 프로젝트 카드의 ‘함께 읽을 원문 목록’, 강의 카드의 ‘강의 정보 더 보기’, 영역 장면·영역 펼침의 ‘정보 보기’(`[data-open-item="res:<id>|course:<id>"]`). 강의 모음·예제 카드는 상세 없이 같은 페이지의 강의 목록·예제 구역으로 이동한다.
- 닫기 버튼 이름은 돌아갈 곳이다: 영역 위 ‘← ‘영역명’ 영역으로’, 강의 카드 ‘← 강의 목록으로’, 공개 자료 ‘← 공개 자료로’, 로드맵 장면 ‘← 로드맵으로’.
- 카드 rect에서 시트가 clip-path inset 보간으로 펼쳐지고, 표지가 제자리로 이동한 뒤 본문이 나타난다. 닫으면 카드 위치로 접힌다.
- 내용
  - 프로젝트: 함께 읽는 원본
  - 강의 모음(직접 여는 곳 없음, 남겨 둔 경로): 강의 목록과 각 강의 카드로 이동 링크(중첩 상세 없음)
  - 예제: 문서·코드 읽기 예제라는 한 줄, 단계별 원본·확인할 것·경로·Node.js·pnpm 실행 조건
  - 강의: 시리즈·전체 제목·대상·배우는 것·분량·강사·로드맵, ‘원문은 GitHub에서 열립니다. 브라우저 뒤로 가기로 돌아옵니다.’, 원문 바로 열기, 오류·개선 제안(GitHub, 로그인 필요)
- 카드의 원문·실행 링크는 카드에도 그대로 있다. 상세 안의 `#roadmap`·`#courses`·`#example` 링크는 겹 화면을 모두 닫고 이동한다.
- 상태: `.dl[data-item][data-state][data-t][data-frames]`, `.dl__sheet[data-clip]`.

## 6. 겹 화면 상태 관리 (`layers.js`)

- **스택 하나:** 예) `area:spec` → `detail:course:sdd`. 화면에서 만드는 깊이는 최대 2(영역 + 상세)이며, 안전 상한은 4다. `html[data-layers]`, `html.is-layered`, `#layers[data-stack]`.
- **전역 핸들러는 각각 하나:** keydown(Escape·Tab 가두기), focusin, click 위임, popstate, resize, visibilitychange, pointerdown. 목차 Escape도 같은 소유자에 등록한다.
- **history:** 열 때 `pushState`, 닫을 때 `history.back()`. 브라우저 뒤로도 같은 경로로 닫힌다. back이 처리되기 전에 들어온 요청은 순서대로 대기한다.
- **스크롤 잠금:** `html.is-layered{overflow:hidden}`, `scrollbar-gutter:stable`. 마지막 층을 닫으면 저장한 scrollY로 돌린다.
- **inert·초점:** 열린 층 아래(skip·head·main·foot, 아래층)는 `inert`와 `aria-hidden`. 열면 제목으로, 닫으면 연 버튼으로 초점이 간다. 브라우저가 초점을 body나 비대화형 section으로 되돌리면 같은 의도 안에서 다시 보장한다. 사용자의 Tab·포인터 조작은 우선한다.
- **회복:** 열기 중 Escape는 현재 기하에서 닫히고, 닫는 중 재열기는 현재 기하에서 다시 열린다. 애니메이션 중 resize는 최종 배치로 바로 바뀐다. 탭이 숨겨지면 애니메이션을 끝낸다.
- **재생시간:** 영역 열기 720ms · 전환 520ms · 닫기 560ms, 상세 열기 620ms · 닫기 460ms(cubic in-out). `prefers-reduced-motion: reduce`에서는 같은 경로를 1프레임으로 처리하고, 무대는 장면 2 지도로 고정한다.
- **하지 않는 것:** 상세 딥링크, 새로 고침 뒤 겹 화면 복원, history 앞으로 가기로 다시 열기.

## 7. 해시와 키보드

- 새 형식: `#area-<id>`, `#topic-<id>`, `#ext-<id>`, `#course-<id>`, `#res-<id>`, 구역 id(`#roadmap`, `#materials`, `#courses`, `#example`, `#join`).
- 이전 형식도 해당 위치로 보낸다: `#area/…`, `#topic/…`, `#ext/…`, `#stage/NN`(각 영역의 `legacyStages`), `#path/todo`(예제).
- 건너뛰기 링크 2개(본문, 공개 자료). 겹 화면 안에서는 Tab이 순환하고 Escape가 한 층씩 닫는다.

## 8. 보안·메타데이터

- GitHub Pages는 응답 헤더를 정할 수 없으므로 `index.html`의 첫 meta로 CSP를 선언한다.

  ```text
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'
  ```

  - 스크립트는 같은 출처 파일만 쓴다(inline script·이벤트 속성 없음).
  - 데이터 JSON은 같은 출처 fetch(`connect-src 'self'`)로 읽는다.
  - 무대 SVG는 문서 안에서 `createElementNS`로 만든다.
  - 기하·진행 값은 CSSOM(`style.setProperty`, `style.left` 등)으로 갱신하며, 스타일 정책은 `'unsafe-inline'`을 유지한다.
  - `frame-ancestors`는 meta에서 무시되고 콘솔 경고를 내므로 넣지 않는다. 다른 사이트의 iframe 삽입은 Pages에서 막을 수 없다(헤더 필요).
- 메타데이터: `lang="ko"`, 승인 제목·설명, `og:title/description/type/locale/site_name`, `twitter:card=summary`, `favicon.svg`.
- 도메인이 정해지지 않아 `canonical`·`og:url`·`og:image`·CNAME을 두지 않는다. 검토용 `noindex`도 두지 않는다.

## 9. 강의 카드와 주제 상태

- **강의 카드(`#course-<id>`):** 시리즈·상태, 공식 강의명(변경 금지), 원제목, ‘대상’(원문), ‘배우는 것’(`goal`: 강의 안내 학습목표의 사실을 보존한 짧은 한 문장 요약), 원문 바로 열기(‘강의 안내 열기 · GitHub’, ‘교재 PDF 열기 · GitHub’, ‘실습 열기 · GitHub’), 분량·강사·로드맵, ‘강의 정보 더 보기’(상세 한 단계).
- 원문 학습목표 인용은 화면에 싣지 않고 `goalEvidence`에 둔다. 검사가 그 인용이 강의 안내의 ‘학습목표’ 줄에 그대로 있는지 확인하고, `goal`의 길이(60자 이내)와 보장·비용 표현(무료·비용 없이·보장 등)을 막는다. 요약이 원문 사실과 맞는지는 사람이 대조한다.
- **주제 상태 두 축:** 각 주제 제목 바로 아래 같은 줄·같은 크기로 ‘연결 자료: 공개 자료 있음 / 준비 중’과 ‘모듈 원문 상태: <원문값>’을 둔다. 담당·목적 작성 예정·모듈 문서 링크는 그 아래 보조 줄이다. 설명은 로드맵과 영역 본문 끝에 짧은 한 줄씩만 둔다: ‘연결 자료 — 지금 열어 볼 자료가 있는지(완성·실행 보장 아님)’, ‘모듈 원문 상태 — 주제 설명 문서의 작성 상태(강의·예제 상태 아님)’. ‘시드 모듈’ 등 원문값은 사이트에서 다시 정의하지 않는다.

## 10. 데이터 구조와 갱신

- 강의·공개 항목·주제는 `portal.json`에 항목을 추가하면 장면·카드·영역 펼침·상세·무대 조각 수가 데이터를 따라간다(`scripts/test.mjs`의 갱신 대응 시험).
- 영역 다섯 개와 확장 주제 두 개(하니스·임베디드)는 승인된 구조다. 영역 체계를 바꾸려면 기획·디자인 승인 후 검사와 배치를 함께 고친다.
- 원본 링크는 `sources.json`만 쓴다. 원문 상태·담당·라이선스는 원본 표기를 옮기며 사이트에서 바꾸지 않는다.
- 화면 보조 필드(모두 선택): `areas[].hint`(30자 이내 행동 설명), `courses[].goal`·`goalEvidence`(함께), `courses[].pick`(첫 화면 추천 이름, `goal` 필요). 없으면 해당 줄을 그리지 않는다.
