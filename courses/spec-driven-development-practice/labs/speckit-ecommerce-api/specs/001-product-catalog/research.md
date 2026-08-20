# Research: Product Catalog (Phase 0)

## 기술 결정

- **웹 프레임워크 = Hono**: 경량·TypeScript 퍼스트, `app.request()`로 서버 없이 요청 테스트가 쉽다. (대안 Express는 타입이 약하고, Nest는 예제에 과중.)
- **검증 = 수동 순수 함수**: zod 도입은 1막 스코프에 과하고 의존성이 는다. `validateProductInput`으로 시작하고 필요 시 도입.
- **저장 = 인메모리 `Map` + 인터페이스**: 영속 DB는 이후. `ProductStore` 인터페이스로 교체 경로 확보.
- **price = 정수 cents**: 부동소수점 반올림 회피.
- **id = `crypto.randomUUID()`**: 외부 의존 없음.

## NEEDS CLARIFICATION 해소

- 통화: 단일, cents 단위. 인증: 범위 밖. 페이지네이션/검색: v1 제외.
