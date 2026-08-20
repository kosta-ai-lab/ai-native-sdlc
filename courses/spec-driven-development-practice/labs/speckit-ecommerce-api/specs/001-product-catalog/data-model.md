# Data Model: Product Catalog (Phase 1)

## Product

| field | type | rules |
|---|---|---|
| id | string | server-generated (uuid), immutable |
| name | string | required, non-empty |
| price | integer | cents, >= 0 |
| stock | integer | >= 0 |

- 관계: 없음(1막). 이후 `Order`가 `Product`를 참조한다.
- 검증 모드: 생성 = 전체 필드 필수, 수정 = 부분(제공된 필드만 검증).
