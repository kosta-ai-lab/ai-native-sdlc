## Context

상품 카탈로그는 이 API의 첫 capability이며, 이후 주문·재고가 참조할 토대입니다. 저장은 1막 범위에서 인메모리로 두되, 이후 교체를 위해 인터페이스 뒤에 감춥니다. 프레임워크는 Hono, 검증은 외부 라이브러리 없이 수동으로 합니다.

## Goals / Non-Goals

**Goals:**
- 상품 CRUD 5개 라우트와 일관된 검증·에러 응답
- 저장소를 인터페이스(`ProductStore`)로 추상화해 구현 교체 가능
- 요청 수준 테스트로 모든 시나리오(성공·실패) 커버

**Non-Goals:**
- 주문·재고 로직, 영속 DB, 인증
- 검증 라이브러리(zod 등) 도입 — 1막에서는 수동 검증으로 충분

## Decisions

### 데이터 모델
```ts
interface Product { id: string; name: string; price: number; stock: number }
```
- `price`는 정수 cents(부동소수점 반올림 회피), `stock`은 0 이상 정수.
- `id`는 `crypto.randomUUID()`로 생성(외부 의존 없음).

### 라우트 테이블
| 메서드 | 경로 | 성공 | 실패 |
|---|---|---|---|
| POST | `/products` | 201 | 400 |
| GET | `/products` | 200 | — |
| GET | `/products/:id` | 200 | 404 |
| PATCH | `/products/:id` | 200 | 400 / 404 |
| DELETE | `/products/:id` | 204 | 404 |

### 에러 모델
- 검증 실패 `400`, 미존재 `404`. 본문 `{ "error": string }`.
- 검증은 순수 함수 `validateProductInput(input, { partial })`로 분리(생성=전체 필수, 수정=부분 허용).

### 저장소
- `src/store.ts`에 `ProductStore` 인터페이스(create/list/get/update/delete) + `InMemoryProductStore`(`Map` 기반).
- 라우트는 인터페이스에만 의존 → 후속 change에서 DB 구현으로 교체 가능.

### Rejected Alternatives
- **zod 검증**: 1막 스코프에 과하고 의존성이 늘어남. 수동 검증 함수로 시작하고 필요 시 도입.
- **클래스 기반 도메인 모델**: 순수 데이터 + 함수형 store로 충분. 과설계 회피.

## Risks / Trade-offs

- 인메모리 저장은 프로세스 재시작 시 데이터가 사라짐 → 1막 학습 목적상 수용하고, 인터페이스로 교체 경로를 확보.
- 단일 프로세스 가정이라 동시성 제어가 없음 → 교육 예제 범위에서 무시.
- 수동 검증은 스키마 문서화가 약함 → 스펙(spec.md)이 계약 역할을 대신함.
