# speckit-ecommerce-fullscale — 멀티셀러 마켓플레이스 설계 완성본

강의 [Spec Kit으로 실전 소프트웨어 설계](../../README.md)의 관통 예제입니다. 상품·주문·재고까지 만든 e-커머스 API를 **멀티셀러 마켓플레이스**로 확장하면서, 설계 산출물을 단계마다 남겼습니다.

## 스택

TypeScript · Hono · Vitest · Spec Kit(specify) 0.12.8

## 관통 요구사항 여섯 가지

| # | 요구사항 | 관련 ADR |
|---|---------|---------|
| R1 | 한 주문을 판매자별 하위주문으로 분할한다 | ADR-001 |
| R2 | 결제 전에 재고를 선점한다 | ADR-002 |
| R3 | 결제는 멱등키로 중복을 막는다 | ADR-003 |
| R4 | 배송은 판매자별 하위주문 단위로 진행한다 | ADR-001 |
| R5 | 배송 완료를 트리거로 수수료를 공제해 정산한다 | ADR-004 |
| R6 | 환불은 정산을 역산해 되돌린다 | ADR-004 |

## 설계 산출물

| 경로 | 내용 |
|------|------|
| `design/diagrams/` | 유스케이스·도메인 모델·ERD·시퀀스·상태머신·컴포넌트 (PlantUML 소스 + PNG) |
| `design/adr/ADR.md` | ADR-001~005 — 결정·근거·기각한 대안·결과 |
| `design/traceability.md` | 요구사항 ↔ 설계 ↔ 작업 추적성 매트릭스 |
| `.specify/memory/constitution.md` | 프로젝트 원칙 아홉 가지 (I~V 계승 + VI~IX 멀티셀러) |
| `specs/001`~`008` | 기능 스펙 — 상품·주문·재고 3종 + 멀티셀러 5종 |

## 워크플로우

```
/speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.implement
```

각 단계에서 어떤 프롬프트로 어떤 산출물을 얻었는지는 강의 슬라이드의 「실습」 장표에 그대로 실려 있습니다.

## 실행

```bash
pnpm install
pnpm test          # 92개 통과
pnpm tsc --noEmit
```

다이어그램을 다시 그리려면 PlantUML이 필요합니다.

```bash
plantuml -tpng -Sdpi=200 design/diagrams/*.puml
```

## 앞선 트랙

상품·주문·재고까지의 기초 구현은 2편 [스펙 주도 개발 실전](../../../spec-driven-development-practice/)의 `labs/speckit-ecommerce-api`에 있습니다.
