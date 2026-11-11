# kosta-ai-lab 공개 포털 — 화면 명세

> 정본 기획: [LEARNING_SITE_PLAN.md](LEARNING_SITE_PLAN.md) · 운영: [LEARNING_SITE_OPERATIONS.md](LEARNING_SITE_OPERATIONS.md)
> 이 문서는 승인된 통합 디자인(스크롤 스토리 + 영역 펼침 + 자료 상세)을 `site/`에 옮긴 구현 명세다. 배포·병합 승인을 뜻하지 않는다.

## 0. 개요

- **역할:** 학습 플랫폼이 아니라 공식 입구다. 취지를 소개하고, 로드맵을 보여 주고, 지금 열람할 수 있는 공개 자료(프로젝트·강의·코드 예제)로 연결하고, 참여 방법을 안내한다.
- **화면 흐름:** 첫 화면(취지) → 01 소개 → 02 로드맵(영역별 장면, 확장 주제) → 03 서비스·자료(공개 항목, 강의, 코드 예제) → 04 참여 → 하단.
- **목차:** 취지 · 소개 · 개발 영역 · 공개 자료 · 참여, 상단 오른쪽 ‘바로 자료’.
- **세 가지 동작**
  1. **스크롤 스토리:** 왼쪽 본문을 일반 문서 스크롤로 읽는다. 오른쪽 sticky 무대(자체 SVG)의 도형 조각이 스크롤 거리에 선형으로 연동되어 흩어진 상태 → 개발 영역 지도 → 영역별 확대 → 공개 자료 형상으로 바뀐다. 스크롤을 가로채거나 관성을 넣지 않는다.
  2. **영역 펼침:** 로드맵에서 영역을 고르면 무대에 조립된 영역 도형 위치에서 공간이 커진다. 선택한 영역은 넓어지고 나머지는 가장자리로 압축된다. 그 안에서 주제·원문 상태·담당·관련 자료를 본다.
  3. **자료 상세:** 자료·강의 카드에서 같은 상세 시트가 카드 위치에서 펼쳐진다. 상세 안에서 다른 상세(예: 강의 모음 → 강의)를 겹쳐 열 수 있다.
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
- 장면 기준점 `a_i = max(0, docTop(step_i) − refY)`, 장면 값 `f = i + (scrollY − a_i)/(a_{i+1} − a_i)`. refY는 데스크톱 `0.5·innerHeight`, 모바일은 무대 아래 남은 화면의 30% 지점이다.
- 무대 조각: 영역·주제·확장 주제마다 하나씩(현재 18개). 장면 0 흩어짐 → 장면 2 지도 조립 → 영역 장면마다 카메라 1.8배 확대 → 마지막 장면에서 프로젝트 틀·강의 책등·예제 사슬로 재조립된다.
- 무대는 장식(`aria-hidden`)이다. 같은 정보가 본문에 모두 있다.
- 관측 지점: `#story[data-progress|data-scene|data-scene-progress]`, `#cam[transform]`, `#cam [data-piece]`, `#hud-label`, `#toc a[aria-current]`.

## 4. 영역 펼침 (`#explore.xl`)

- 여는 곳: 로드맵 장면의 영역 목록 버튼(`#area-index [data-open-area]`), 각 영역 장면의 ‘이 영역 펼쳐 보기’.
- 시작 기하는 무대 영역 도형의 실제 화면 rect다. 끝 배치는 다음과 같다.
  - 넓은 화면(필드 폭 720px 이상): 선택 공간이 넓어지고, 나머지 영역은 76px 세로 기둥으로 압축된다.
  - 좁은 화면: 선택 공간이 전체 폭으로, 나머지 영역은 상단 한 줄 탭으로 압축된다.
- 압축된 공간을 누르면 그 영역으로 전환한다(history replace).
- 닫으면 각 공간이 무대 도형 위치로 돌아가고, 스크롤 위치·무대 상태·연 버튼 초점이 복원된다.
- 상태: `#explore[data-state]` = `closed | opening | open | switching | closing`, `[data-area]`, `[data-t]`, `[data-frames]`, 공간 `.zone[data-zone][data-geom="x,y,w,h"]`.
- 배치는 승인된 다섯 영역을 전제로 한다(넓은 화면 압축 기둥 4개, 좁은 화면 상단 4칸). 영역 수를 바꾸려면 디자인 승인과 `layers.js` 배치 수정이 함께 필요하다.

## 5. 자료 상세 (`.dl[role=dialog]`)

- 여는 곳: 공개 항목 카드의 ‘자료 살펴보기’, 강의 카드의 ‘강의 살펴보기’, 영역 장면·영역 펼침의 관련 자료(`[data-open-item="res:<id>|course:<id>"]`).
- 카드 rect에서 시트가 clip-path inset 보간으로 펼쳐지고, 표지가 제자리로 이동한 뒤 본문이 나타난다. 닫으면 카드 위치로 접힌다.
- 내용
  - 프로젝트: 함께 읽는 원본
  - 강의 모음: 강의 목록과 각 강의 상세(중첩)
  - 예제: 단계별 원본·볼 곳·경로·실행 안내
  - 강의: 시리즈·전체 제목·대상·분량·강사·로드맵·원본 링크
- 카드의 원문·실행 링크는 카드에도 그대로 있다. 상세 안의 `#roadmap`·`#courses`·`#example` 링크는 겹 화면을 모두 닫고 이동한다.
- 상태: `.dl[data-item][data-state][data-t][data-frames]`, `.dl__sheet[data-clip]`.

## 6. 겹 화면 상태 관리 (`layers.js`)

- **스택 하나:** 예) `area:spec` → `detail:res:courses` → `detail:course:sdd`(최대 4). `html[data-layers]`, `html.is-layered`, `#layers[data-stack]`.
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

## 9. 데이터 구조와 갱신

- 강의·공개 항목·주제는 `portal.json`에 항목을 추가하면 장면·카드·영역 펼침·상세·무대 조각 수가 데이터를 따라간다(`scripts/test.mjs`의 갱신 대응 시험).
- 영역 다섯 개와 확장 주제 두 개(하니스·임베디드)는 승인된 구조다. 영역 체계를 바꾸려면 기획·디자인 승인 후 검사와 배치를 함께 고친다.
- 원본 링크는 `sources.json`만 쓴다. 원문 상태·담당·라이선스는 원본 표기를 옮기며 사이트에서 바꾸지 않는다.
