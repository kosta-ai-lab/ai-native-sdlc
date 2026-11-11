# 모듈 — OpenWiki — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

OpenWiki로 코드 저장소의 위키를 만들고, Claude Code가 그 위키를 저장소의 기억 장치로 검색·갱신하게 하는 방법을 배워본다.

## 개념

OpenWiki는 **코드 저장소를 읽고, 서로 링크된 마크다운 위키를 만들어 주고, 코드가 바뀌면 그 위키를 갱신해 주는 CLI 도구**입니다.
LangChain 팀이 만든 무료 오픈소스(MIT 라이선스)이며 npm 패키지 `openwiki`로 배포됩니다.

README가 "사람이 처음 읽는 소개글"이라면, OpenWiki가 만드는 위키는
**코딩 에이전트(Claude Code 등)가 저장소를 이해하려고 꺼내 읽는 기억 장치**에 가깝습니다.
위키는 저장소 안 `openwiki/` 폴더에 일반 마크다운 파일로 저장되므로 사람도 그대로 읽고, git으로 버전 관리할 수 있습니다.

> 이 가이드는 OpenWiki 0.7.1 (2026-10 기준) 을 기준으로 작성했습니다. 버전이 올라가면 화면과 출력이 조금 달라질 수 있습니다.

### 핵심 개념 5가지

#### 1. Wiki (위키)
저장소 루트의 `openwiki/` 폴더에 생기는 마크다운 문서 묶음입니다.
`openwiki/quickstart.md`가 입구 역할을 하고, 여기서 아키텍처·개념·워크플로 등 주제별 페이지로 링크가 뻗어 나갑니다.

#### 2. Integration (코딩 에이전트 통합)
OpenWiki를 Claude Code 같은 코딩 에이전트 안에서 쓰게 해 주는 연결입니다.
설치하면 에이전트에 **스킬 1개**와 **MCP 서버 1개**가 추가됩니다.
이 방식에서는 에이전트가 이미 로그인한 모델을 그대로 쓰기 때문에 **별도 API 키가 필요 없습니다.** 이 가이드는 이 방식을 사용합니다.

#### 3. Page job (페이지 작업)
위키 생성은 "페이지 계획 → 한 페이지씩 작성 → 마무리" 순서로 진행됩니다.
조사와 글쓰기는 에이전트가 맡고, 작업 대기열·검증·색인·마무리는 OpenWiki가 맡습니다.
페이지가 하나 끝날 때마다 진행 상황이 저장되므로 중간에 끊겨도 이어서 할 수 있습니다.

#### 4. Grounded Claim (근거 있는 주장)
위키에 적힌 사실 하나하나를 **Claim**이라 부르고, 각 Claim은 `repo://src/todo.js#L2-L9`처럼 근거가 된 소스 위치를 기록합니다.
이 정보는 `openwiki/.claims/` 폴더에 JSON으로 저장됩니다.
나중에 그 소스가 바뀌면 OpenWiki가 "이 사실은 다시 확인해야 한다"고 알아챕니다.

#### 5. Update (업데이트)
코드를 고친 뒤 위키를 갱신하는 작업입니다. 전체를 다시 쓰지 않고 **바뀐 코드와 관련된 페이지만** 고칩니다.
바뀐 것이 없으면 모델을 쓰지 않고 "갱신할 것 없음"으로 끝납니다.

### 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **Search / Read** | 에이전트가 위키에서 답을 찾을 때 쓰는 MCP 도구(`openwiki_search`, `openwiki_read`). 로컬에서만 동작하고 모델을 호출하지 않습니다. |
| **Visualizer** | `openwiki visualize`. 위키를 노드 그래프와 마크다운 뷰어로 브라우저에 띄워 줍니다. |
| **AGENTS.md** | OpenWiki가 저장소 루트에 관리하는 파일. 에이전트에게 "위키를 이렇게 참고하라"고 알려 줍니다. `<!-- OPENWIKI:START -->`와 `<!-- OPENWIKI:END -->` 사이만 OpenWiki가 고칩니다. |
| **INSTRUCTIONS.md** | `openwiki/INSTRUCTIONS.md`. 위키의 범위와 우선순위를 사용자가 직접 적는 파일. OpenWiki가 읽기만 하고 덮어쓰지 않습니다. |
| **.openwikiignore** | 위키 작성 때 읽지 말아야 할 경로를 적는 파일. 문법은 `.gitignore`와 비슷합니다. |
| **Standalone CLI** | 에이전트 없이 `openwiki --init`으로 직접 실행하는 방식. 모델 제공자와 API 키 설정이 필요합니다. 이 가이드에서는 다루지 않습니다. |

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (OpenWiki가 `AGENTS.md`에 관리 블록을 자동 생성)
- [x] 자동화 — OpenWiki 스킬·MCP 서버 (`openwiki integrations install claude`)
- [x] 샘플 — `todo-cli/` 예제 저장소 + SAMPLE.md 예제 소스 이해·실행 안내

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 참고 링크
- OpenWiki 저장소: https://github.com/langchain-ai/openwiki
- npm 패키지: https://www.npmjs.com/package/openwiki
- OpenWiki가 자기 자신을 문서화한 위키(결과물 예시): https://github.com/langchain-ai/openwiki/tree/main/openwiki
- 예약 업데이트 워크플로 예시: https://github.com/langchain-ai/openwiki/tree/main/examples
