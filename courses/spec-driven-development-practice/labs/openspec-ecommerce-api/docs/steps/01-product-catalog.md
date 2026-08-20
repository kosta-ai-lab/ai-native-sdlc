# Step 1 — product-catalog: 상품 카탈로그 한 사이클

OpenSpec 1.5의 artifact-guided 워크플로우(propose → apply → verify → archive)를 상품 CRUD API로 한 바퀴 돈다. 모든 명령·산출물·커밋은 실제 실행 결과이며, `git checkout <hash|tag>`로 어느 단계든 재현할 수 있다.

## 배우는 것
- artifact-guided 워크플로우: `status`/`instructions` CLI로 무엇을·어떤 순서로 만들지 결정
- delta spec 작성 규칙과 함정(4-hashtag, SHALL, 실패 시나리오)
- TDD 무브 단위 구현과 그에 대응하는 커밋 히스토리
- verify의 3C와 archive 시 delta→main spec 병합

---

## 0. 프로젝트 규칙 — `openspec/config.yaml`  (커밋 `2d186c6`)

1.5에서 "Constitution"은 `openspec/config.yaml`의 `context`/`rules`로 통합됐다(구버전 `project.md` 아님).
- `context`: 기술 스택·도메인·컨벤션. **AI에게 제약으로 주입되지만 산출물 파일에는 들어가지 않는다.**
- `rules`: artifact별 규칙(`proposal`/`specs`/`design`/`tasks`). 예: "specs는 실패 시나리오 포함".

> 함정 ①: `openspec instructions` 응답의 `context`/`rules`를 artifact 파일에 그대로 복붙하는 것. 이것은 "두뇌를 위한 것이지 파일을 위한 것이 아니다."

## 1. Propose — 의도를 세운다  (커밋 `5894739`)

```bash
openspec new change "product-catalog"
openspec status --change product-catalog --json        # artifact DAG, applyRequires
openspec instructions proposal --change product-catalog --json   # template/instruction/context/rules
```
- artifact 의존성(DAG): `proposal → (specs, design) → tasks`. 부모 없이 자식을 만들 수 없다.
- `applyRequires: ["tasks"]` — 구현하려면 tasks까지 done이어야 한다.
- proposal.md 구성: Why / What Changes / Capabilities(New·Modified) / Impact / Non-goals.

## 2. Specs — delta로 계약을 쓴다  (커밋 `769f95c`)

```bash
openspec instructions specs --change product-catalog --json
openspec validate product-catalog --strict
```
- capability당 파일 하나: `specs/product-catalog/spec.md`.
- delta 헤더 `## ADDED Requirements`, `### Requirement: <name>`(SHALL/MUST), `#### Scenario:`.
- **함정 ②: Scenario는 정확히 `####`(4 hashtag). 3개나 불릿이면 조용히 무시된다.**
- rules 반영: 성공뿐 아니라 실패 시나리오(400 검증, 404 미존재)를 모든 requirement에.
- 5개 requirement: Create / List / Get By Id / Update / Delete.

## 3. Design — 결정과 기각을 남긴다  (커밋 `8d4f6d3`)

data model(`price`는 정수 cents), 라우트 테이블, 에러 모델(`{error}`), `ProductStore` 인터페이스.
기각한 대안까지 명시: zod(1막 과함), 클래스 도메인 모델(과설계).

## 4. Tasks — TDD 순서로 쪼갠다  (커밋 `2c25cd9`)

store → validation → routes(test-first) → wire-up. 각 task는 대략 커밋 하나 크기.
→ `openspec status`가 **4/4 complete, apply ready**. 여기가 **propose와 apply 사이의 사람 리뷰 지점**이다("의도서에 서명하기 전에 읽어라").

## 5. Apply — 무브 단위로 구현한다

tasks 체크박스를 갱신하며 작은 커밋으로 쌓는다(사람 개발 흐름).

| 무브 | 커밋 | 내용 |
|---|---|---|
| A | `a03ed2c` | `store.ts` — 인메모리 리포지토리(인터페이스 뒤) |
| B | `7676d4b` | `validateProductInput` — create/partial, 실패 케이스 테스트 |
| C | `61ccad0` | `POST`·`GET` 라우트 + 요청 테스트 |
| D | `0bf4c6b` | `PATCH`·`DELETE` 라우트 + 테스트 |
| E | `5e9b32c` | `index.ts` 마운트 + 통합 테스트 |

- **함정 ③: PATCH에서 body를 그대로 `spread`하면 `id`가 오염된다** → `pickProductFields`로 허용 필드만 추출.
- **결정: 검증(400)을 존재 확인(404)보다 먼저 한다** → 무효 입력이 store를 건드리지 못하게(“400 leaves product unchanged” 시나리오 보장).

## 6. Verify — 3C  (E2E smoke)

- Completeness: tasks 전부 `[x]`, 모든 spec requirement 구현.
- Correctness: 각 scenario가 테스트로 존재(33개).
- Coherence: design 결정(인터페이스·에러 모델)이 코드에 반영.
- 실제 서버 기동 후: `POST /products`→201, `GET /products`→200, invalid→400, missing→404.

## 7. Archive — 계약을 본류에 합친다  (커밋 `774e76c`, 태그 `act1-product-catalog`)

```bash
openspec archive product-catalog --yes
```
- delta 5 requirements → `openspec/specs/product-catalog/spec.md` 로 병합(`+5 added`).
- change 폴더 → `openspec/changes/archive/2026-07-08-product-catalog/`.
- 이후 `openspec list`는 활성 변경 없음, `openspec list --specs`는 product-catalog(5 requirements).

## 재현

```bash
git checkout act1-product-catalog   # change 1 완료 시점 전체
git checkout a03ed2c                 # store 무브 시점
git checkout 769f95c                 # spec 작성 직후(구현 전)
```

## 난이도 상 포인트 (KOSTA 입문 대비 심화)
1. delta 형식(ADDED/MODIFIED/REMOVED)과 `validate --strict`를 실제로 통과시킨다.
2. 검증 순서(400 vs 404)가 만드는 관찰 가능한 차이를 스펙 시나리오로 못박는다.
3. 방어적 입력 처리(`pickProductFields`)로 실무 결함(id 오염)을 예방한다.
4. partial 검증 모드로 생성/수정 규칙을 하나의 순수 함수로 통합한다.
5. 다음 단계(change 2 `order-management`)에서 **다중 change**와 **MODIFIED delta**, brownfield 변경으로 확장한다.
