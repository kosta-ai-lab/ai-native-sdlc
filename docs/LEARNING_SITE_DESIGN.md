# kosta-ai-lab 공개 포털 — 화면 명세

> 정본 기획: [LEARNING_SITE_PLAN.md](LEARNING_SITE_PLAN.md). 이 문서는 승인된 포털 초안을 실제 화면으로 옮기기 위한 구현 명세다. 배포나 병합 승인을 뜻하지 않는다. 구현은 `site/`에 있다.

## 0. 개요

- **역할:** 학습 플랫폼이 아니라 공식 입구다. kosta-ai-lab의 취지를 소개하고, 전체 로드맵을 보여 주고, 지금 열람할 수 있는 공개 자료(프로젝트·강의·코드 예제)로 연결하고, 참여 방법을 안내한다.
- **대상:** 개발 경험자를 중심으로 하되 비개발자도 포함한다.
- **화면 흐름:** 첫 화면(취지) → 1 소개 → 2 로드맵 → 3 서비스·자료 → 4 참여하기 → 하단.
- **메뉴:** 소개 · 로드맵 · 서비스·자료 · 참여하기.
- **분위기:** 명료함, 전문성, 탐색.
- **시그니처:** 큰 영역 다섯 개가 한 줄의 레일로 이어지고, 확장 주제가 점선 가지로 관련 영역에 붙는 자체 SVG 지도다. 영역을 누르면 아래 패널이 주제 → 자료 순서로 열린다(관찰 표본에서 확인한 "큰 영역 → 주제 → 자료" 연결을 포털 목적에 맞게 바꾼 것). 히어로의 줄기 그림이 같은 시각 언어로 지도를 예고한다.
- **하지 않는 것:** 새 교재, LMS, 회원, DB, CMS, 진도·완료 표시, AI 튜터, 확인되지 않은 운영 서비스 표시, 고정 학습 순서 확정.

### 참고 근거

- **MotionSites 원문:** SKILL.md, references/craft.md, spec-template.md, review.md, examples/INDEX.md, 예시 3개를 실제로 읽었다.
  - interactive-discovery: 두 줄 헤드라인 진입 시차 .25/.42s
  - network-hero: 원 궤도형 시각화, 진입 0.8–1.2s
  - modern-agency: 번호 원 + 알약 라벨 구역 배지, 비대칭 소개 그리드, h2 `clamp(1.5rem,4vw,3.2rem)`
  - 빌려 온 것은 숫자 명세 방식, 작은 인덱스와 대형 타이포의 대비, 강조색 사용 제한, 정지 상태가 늘 보이는 진입 원칙뿐이다. 브랜드·문구·이미지·영상·레이아웃은 통째로 복제하지 않았다. CDN·원격 폰트·외부 미디어·광고 블록도 쓰지 않는다.
- **roadmap.sh 관찰 표본**(`planning/roadmap-*.txt/png`): 디렉터리 → AI Engineer 지도 → 노드 패널(유형별 자료 목록) → Projects 탭을 확인했다. 전체 제품 벤치마크가 아니다. 진도 표시(Learning/Done/Skip), AI Tutor, 유료 자료, 가입 유도는 이 포털 범위가 아니므로 가져오지 않았다.

## 1. 파일

| 파일 | 역할 |
|---|---|
| `site/src/index.html` | 소개 문구(승인 초안 원문)와 구역 골격. 데이터가 없어도 소개와 대체 링크가 보인다 |
| `site/src/styles.css` | 토큰, 레이아웃, 상태, 모션, reduced-motion 분기 |
| `site/src/lib.js` | DOM 없는 순수 함수: 해시 해석과 이전 링크 변환, 영역별 연결 계산, 레일·가지선 경로 |
| `site/src/app.js` | 데이터 로드, 렌더, 선택, 키보드, 해시 동기화 |
| `site/data/portal.json` | 영역·주제·확장 주제·공개 항목·강의 연결 데이터 |
| `site/data/sources.json` | 원본 링크 manifest(path·url·status·type·evidence·verify) |

## 2. 글꼴

원격 폰트 없이 시스템 글꼴을 쓴다.

| 역할 | 스택 | 굵기 |
|---|---|---|
| 본문·제목 | `"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif` | 400 / 500 / 600 / 700 |
| 라벨·워드마크 | `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace` | 400 / 500 / 600 |

한글은 `word-break: keep-all; overflow-wrap: anywhere`로 끊는다. 한글 헤드라인 line-height는 1.2 이상이다.

## 3. 색 토큰

```css
--ink:#132923; --paper:#f4f3ec; --lime:#d4ee70;
--ink-80/.66/.38 (글자 위계), --ink-line:.18 (1px 선), --ink-grid:.06 (도화지 격자)
--paper-80/.64 (어두운 바탕 글자), --paper-line:.18
html,body{background:#132923}   /* 첫 규칙: 깜빡임 방지 */
```

lime은 세 곳에만 쓴다: ① 주 버튼 바탕, ② 선택 노드의 점과 메타 글자, ③ 히어로 핵심어 밑줄과 줄기의 시작점. 상태 칩은 색을 늘리지 않고 테두리로 구분한다. "공개 자료 있음/공개됨"은 실선 ink, "준비 중"은 점선이다.

## 4. 공통 규칙

- 컨테이너: `max-width:1200px`, 거터 48 / 32 / 20px(≥1024 / 640–1023 / <640).
- 선은 1px. 모서리는 버튼·칩 4px, 구역 배지 알약만 999px.
- 포커스: paper 바탕은 `3px solid ink, offset 3px`, ink 바탕은 lime.
- 본문 건너뛰기 링크(`#main`)를 둔다. 모든 탭 대상은 44px 이상이다.
- 구역 배지(modern-agency 패턴 변형): 26px 원(ink 바탕, mono 12px 번호) + 알약 라벨(13px/600, 1px 선, 패딩 4×12px).

## 5. 첫 화면 `header.hero` (ink 바탕)

| 요소 | 문구(승인 초안 그대로) | 크기·스타일 | 모션 |
|---|---|---|---|
| 상단 바 | 워드마크 `kosta-ai-lab`(mono 16px/600, 20px 자체 SVG 마크) · 메뉴 4개 | 높이 72px, 아래 1px paper-line. 메뉴 14.5px/500 paper-80, hover 180ms에 밑줄 `scaleX 0→1` | 없음 |
| 눈썹 | `kosta-ai-lab · AI-Native SDLC` | mono 12px, +0.12em, paper-64 | rise 0ms |
| H1 1행 | AI와 함께 만드는 소프트웨어, | `clamp(2.25rem, .9rem + 5.4vw, 5.75rem)`, 700, lh 1.2, -0.035em | rise 40ms |
| H1 2행 | 함께 발전시키는 **개발 방식** | 같음. "개발 방식"에 lime 밑줄(80–91% 띠) | rise 90ms |
| 본문 두 문단 | AI가 코드를 작성하는 시대에도 … / 우리는 AI-Native 소프트웨어 개발의 … | `clamp(1rem,.92rem+.35vw,1.1875rem)`/1.75. 첫 문단 paper, 둘째 paper-80, max 38rem | rise 120ms |
| 버튼 | **로드맵 둘러보기 →** / 공개 자료 보기 | 48px 높이, 패딩 12×22px. 주 버튼 lime, 보조는 1px paper-line | rise 120ms |
| 줄기 그림 | 큰 영역 5개 라벨 + "확장 주제 · 에이전트 하니스 · 임베디드" | 높이 96px(아래 여백 28px). 선은 CSS 1px로 `left:10%; right:10%; top:56px`. 점 12px의 중심도 같은 백분율(10/30/50/70/90%)과 y=56px라 끝점이 첫·마지막 점 중심과 정확히 맞는다. 라벨은 선 위 14px. 가지선은 50%에서 28px 내려가 62%까지 점선(모서리 10px) | 선 `scaleX 0→1` 600ms |

배치: 본문 행은 `grid 7fr / 5fr`, 버튼은 아래쪽 오른쪽 정렬이다. ≤760px에서는 한 열로 쌓고 버튼을 가로 전체로 늘리며, 줄기 그림은 숨긴다(장식이며 로드맵 구역이 곧 이어진다). 첫 화면에는 "시안·초안·검수·감사·미확정·TODO" 같은 내부 용어를 쓰지 않는다(`check.mjs`가 막는다).

## 6. 구역

### 6.1 소개 `#about` (paper)

`grid 5fr / 6fr`, 간격 `clamp(32px,6vw,96px)`. 왼쪽에 배지 1, H2 "왜 함께 공개하나요?", 리드를 둔다. 오른쪽에 프로젝트 문단과 원칙 3개를 1px 선 목록으로 둔다(굵은 제목 19px/700 + 설명 17px ink-80). H2는 `clamp(1.875rem, 1.1rem + 2.8vw, 3.25rem)`/1.22/-0.03em이다.

### 6.2 로드맵 `#roadmap`

- **머리:** 배지 2, H2 "무엇을 다루고, 어디로 이어질까요?", 흐름 줄(`문제·요구사항 → … → 배포·운영`, 600, 화살표는 ink-38에 `aria-hidden`), 안내 문단 두 개(둘째 "고정 학습 순서는 아닙니다"는 15.5px ink-66).
- **보드:** 1px 테두리, 패딩 48/32/32px, 24px 격자 배경(정적).
- **영역 노드 5개:** `repeat(5,1fr)`, 간격 16px. 버튼 최소 높이 172px, 패딩 22/18/18px. 내용은 제목 19px/700, 요약 13.5px ink-66(3줄 넘으면 생략), 메타 mono 11.5px "주제 N · 연결 자료 M"이다. 점(14px, 2px ink)은 카드 위 31px 바깥에 놓고, 레일이 점 중심을 잇는다.
- **확장 주제 2개:** 라벨 "확장 주제"(mono 12px, 왼쪽 44px 들여씀) 아래 같은 5열 그리드의 3·4열에 놓는다. 카드는 점선 테두리, 최소 높이 132px, 내용은 "확장 주제" 키커, 제목, "연결 영역 · AI와 구현", 제공 상태 칩이다. 'AI와 구현' 카드 아래 중앙에서 내려온 점선 가지선(반경 10px)이 확장 주제 점으로 이어진다.
- **선택 상태:** `aria-pressed=true`이면 ink 바탕, paper 글자, lime 점과 메타로 바뀌고 이웃 레일 구간은 `stroke 3px ink`가 된다.
- **반응형:** 640–1023px는 2열로 놓고, 행이 바뀌는 곳은 오른쪽 여백을 도는 직각 레일로 잇는다. <640px는 1열로 놓고, 점을 카드 왼쪽 31px 바깥에 두어 수직 레일을 만든다. 영역이 한 줄이 아닐 때는 가지선을 그리지 않고 카드의 "연결 영역" 문구로 관계를 보여 준다.
- **선택 패널**(보드에 1px 붙음, `role=region`, 패딩 `clamp(28px,4vw,48px)`):
  - 윗줄 왼쪽에 키커 "로드맵 영역"/"확장 주제", 오른쪽에 "로드맵으로 돌아가기 ↑"(14px/600 밑줄 텍스트 버튼, 44px)를 둔다. 이 버튼은 선택된 노드로 초점과 스크롤(가운데 정렬)을 되돌린다. 그 아래 H3(`clamp(1.75rem,1.2rem+2vw,2.75rem)`, tabindex -1), 요약 17.5px.
  - `grid 7fr / 5fr`, 간격 48px:
    - **주요 주제:** 주제마다 제목 18px/700과 제공 상태 칩(연결된 공개 자료 유무)을 둔다. mono 12px 줄에 "모듈 원문 상태 초안 · 담당 윤성열 · 목적 작성 예정 · 모듈 문서 ↗"(모듈 완성도는 따로 표시)를 적고, 그 아래에 연결된 공개 자료 링크(유형 라벨 + 제목 ↗)를 둔다. 연결 자료가 없으면 "아직 연결된 공개 자료가 없습니다."를 표시한다.
    - **연결할 자료:** 항목마다 유형·상태 라벨과 제목을 두고, 제목은 사이트 안 `#course-…`·`#res-…`로 이동한다. 그 아래 "관련 자료 보기 ↓" 버튼(ink 바탕)을 두고, 해당 영역에 확장 주제가 있으면 "연결되는 확장 주제" 버튼을 붙인다.
  - **확장 주제 패널:** 세부 주제 2열 링크(하니스 12개), 연결 영역 버튼, 모듈 폴더·문서 버튼으로 구성한다.
- **범례:** "‘공개 자료 있음 / 준비 중’은 그 주제에 연결된 공개 자료가 있는지를 나타냅니다. 모듈 자체의 완성도는 각 주제에 함께 적은 ‘모듈 원문 상태’를 참고하세요…"(13.5px ink-66).

### 6.3 서비스·자료 `#resources`

- 배지 3, H2 "지금 살펴볼 수 있는 것". 위쪽 1px ink 선 아래에 3열 목록을 두고 열 사이를 1px 선으로 나눈다(≤1023px에서는 1열).
- 각 항목은 유형 mono 12px와 상태 칩(공개됨), 제목 `clamp(1.25rem,1rem+.8vw,1.625rem)`/700, 요약 16px, "로드맵 · 영역들" mono 12px, 행동 버튼(첫 번째는 ink 바탕)으로 구성한다.
  1. AI-Native SDLC: 프로젝트 살펴보기(`#roadmap`) / GitHub에서 보기(저장소)
  2. 강의자료와 실습(공개 강의 4개): 강의자료 보기(`#courses`)
  3. 요구사항부터 테스트까지 연결하는 예제: 예제 살펴보기(`#example`)
- **`#courses`:** 강의 행은 `grid 1.3fr / 1fr / 180px`이다. 칸 구성은 시리즈·상태·README 표기 제목(20px/700)·원제목·관련 영역 / 대상·분량·강사 / 강의 안내·교재 PDF·실습 링크다.
- **`#example`:** 세로 노선(1px 선과 9px 사각 점)으로 요구사항 → 명세 → 인수조건 → 테스트 → 구현을 보여 준다. 각 단계는 영역 라벨, 원본 링크, 볼 곳, 경로로 구성한다. 이어서 "웹 서버를 실행하거나 AI API를 호출하는 서비스가 아니라…" 문구와 실행 준비물 안내를 둔다.
- **편집 원칙:** 운영 서비스가 확인되면 같은 목록에 `kind: service`로 추가한다. `status: operating`은 `verified.date`와 `verified.url`이 없으면 검사를 통과하지 못한다.

### 6.4 참여하기 `#join` (ink)

배지 4(lime 번호), H2 "작은 수정부터 새로운 사례까지", 리드, 버튼 세 개(기여 방법 보기 → / 오류·개선 제안 / GitHub 조직 방문)를 둔다. 그 아래 라이선스 요약 4칸(교재 CC BY-NC 4.0 / 실습 코드 Apache-2.0 / 이 사이트 코드 Apache-2.0 / 제3자 자료)이 온다.

### 6.5 하단

워드마크와 링크 네 개(GitHub · 기여 안내 · 라이선스 · 보안 안내)를 둔다. 링크는 44px 높이, 14px paper-80이다.

## 7. 모션

| 요소 | 트리거 | 지연 | 길이 | 변화 |
|---|---|---|---|---|
| 눈썹·H1 두 줄·본문·버튼 | 로드 | 0 / 40 / 90 / 120 / 120ms | 480ms `cubic-bezier(.22,1,.36,1)` | `opacity .35, translateY(10px)` → 정지(fill backwards) |
| 히어로 줄기 선 | 로드 | 0 | 600ms | `scaleX 0→1`(왼쪽 기준) |
| 메뉴·버튼·노드 hover | hover | 0 | 180ms | 색·테두리, 노드 `translateY(-2px)` |
| 레일 강조 | 선택 | 0 | 200ms | stroke·두께 |
| 선택 패널 | 선택 | 0 | 200ms `cubic-bezier(.4,0,.2,1)` | `opacity .5, translateY(6px)` → 정지 |

진입 모션은 600ms 안에 끝난다. 어떤 첫 콘텐츠도 opacity 0으로 숨기지 않는다. `prefers-reduced-motion: reduce`에서는 animation·transition·smooth scroll·Web Animations를 모두 끄고 정지 상태를 그대로 보인다.

## 8. 데이터 구조와 갱신

- `areas[]`: id, title, summary, legacyStages(이전 `#stage/NN` 연결). 선후관계 필드(`prerequisites`, `order`, `next` 등)는 두지 않는다. 검사가 막는다.
- `topics[]`: id, area, title, availability(available|preparing), module, sourceStatus, owner, statusSources?, related[].
- `extensions[]`: topics와 같은 필드 + relatedAreas[], summary.
- `resources[]`: id, kind(project|collection|example|service), title, type, status, summary, areas?, actions[{label, href|url|source}], steps?.
- `courses[]`: id, title(README 표기), fullTitle(강의 README 원제목), series, status, instructor, instructorSource, duration, audience, areas[], links[].
- 항목에 `areas`만 적으면 로드맵 패널의 "연결할 자료"와 노드 메타 수에 함께 반영된다(`lib.js relatedItems`).
- **상태 두 가지를 분리한다.**
  - `availability`(칩 "공개 자료 있음 / 준비 중"): 그 주제에 연결된 실제 공개 자료가 있는지를 뜻한다. git에 있는 `related` 자료가 있거나 목적이 작성된 모듈 문서가 있으면 available이고, 둘 다 없으면 preparing이다. 목적이 빈 README만으로는 available이 되지 않는다.
  - `sourceStatus`·`modulePending`: 모듈 원문 상태(초안·시드 모듈)와 목적이 "(작성 예정)"인지를 뜻한다. 모듈의 완성도를 원문 그대로 보여 준다.
  - 예: 유즈케이스·요구사항, 객체설계, BDD 인수조건은 모듈은 초안이고 목적도 작성 예정이지만, 할 일 예제·ADR 같은 실제 자료가 연결되어 있어 "공개 자료 있음"이다. `check.mjs`가 두 상태를 원문과 연결 자료로 대조한다.

## 9. 해시와 키보드

- 새 형식은 `#area/spec`, `#ext/harness`, `#topic/tdd`다. 이전 형식 `#stage/01`~`#stage/10`과 `#stage/harness|embedded`는 해당 영역·확장 주제로, `#path/todo`는 `#example`로 보낸다.
- 선택하면 `history.replaceState`로 해시만 갱신하고, 새로고침하면 복원한다. 같은 해시 링크를 다시 눌러도 다시 이동한다.
- 노드는 네이티브 버튼이다(Tab, Enter, Space). ←/→/↑/↓와 Home/End는 포커스 이동만 하고 선택하지 않는다.
- **선택 후 상세 찾기:**
  - Enter·Space·클릭으로 선택하면, 1열 모바일(≤639px)이거나 상세 윗부분이 화면 밖일 때(패널 top < 0 또는 > 창 높이 − 160px) 상세 제목으로 초점과 스크롤을 옮긴다.
  - 상세가 이미 보이는 넓은 화면에서는 초점을 노드에 두고 `#area-live`(polite)로 알린다.
  - 패널 안 이동 버튼은 항상 상세 제목으로 초점을 옮긴다.
- **해시로 열기·새로고침**(`#area/…`, `#ext/…`, 이전 `#stage/…`):
  - 넓은 화면에서 지도와 상세 윗부분이 한 화면에 들어오면 지도부터 보이고, 아니면 상세로 스크롤한다. 1열 모바일은 항상 상세로 스크롤한다.
  - 어느 경우든 상세 제목에 초점을 둔다. `#topic/…`은 해당 주제로 스크롤한다.

## 10. 합격 기준(첫 화면)

ink 바탕 왼쪽 위에 `kosta-ai-lab` 워드마크, 오른쪽에 메뉴 네 개가 있다. 그 아래 mono 눈썹과 두 줄 헤드라인 "AI와 함께 만드는 소프트웨어, / 함께 발전시키는 개발 방식"(‘개발 방식’에 lime 밑줄)이 화면 폭 대부분을 채운다. 헤드라인 아래 왼쪽에는 두 문단, 오른쪽에는 lime "로드맵 둘러보기"와 테두리 "공개 자료 보기" 버튼이 있다. 데스크톱에서는 그 아래로 다섯 영역 줄기와 확장 주제 점선 가지가 지나간다. 내부 제작 용어는 보이지 않는다.
