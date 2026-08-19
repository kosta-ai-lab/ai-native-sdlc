# Step 2 — orders and change management: Spec Kit 다중 feature

feature 002(order-management)와 003(order-stock-cancellation)으로 "주문"과 "변경(재고·취소)"을 다룬다. 태그: `speckit-order-management`, `speckit-order-stock-cancellation`.

## 002 order-management
- `create-new-feature.sh` → `specs/002-order-management/`
- spec: User Story(주문·조회), FR-001~006, **서버가 총액 계산**
- Phase 산출물: plan · research · data-model · contracts · quickstart · tasks
- 구현: `store.ts`에 `Order`/`OrderStore`, `orders.ts` 신설, `index.ts`에서 product store 공유 주입. **28 tests**.

## 003 order-stock-cancellation — 변경 관리의 핵심 대조

003은 002의 `POST /orders` **동작을 바꾼다**(재고 차감 추가) + `POST /orders/:id/cancel` 추가. **Spec Kit에는 delta가 없다:**
- **새 feature 003**을 만들고, 그 spec은 재고·취소의 **전체 명세**다.
- **002 spec은 그대로 남는다**(pre-stock 버전의 역사적 기록).
- 코드는 `store.ts`·`orders.ts`를 수정하며 진화한다. **34 tests**.

### OpenSpec MODIFIED delta와 정면 대조

| | OpenSpec | Spec Kit |
|---|---|---|
| 변경 표현 | order-management capability의 `Create Order`를 **MODIFIED delta**로 재작성 → archive 시 **main spec 하나**를 갱신 | **새 feature 003**의 전체 spec 작성, 002 spec은 불변 |
| 스펙 이력 | `openspec/specs/`는 항상 **최신 상태 하나(living)**; 변경 이력은 `changes/archive/`에 | `specs/001/002/003/…` 폴더가 버전처럼 **누적**, 각자 전체 spec |
| "지금의 진실" | 병합된 main spec 하나를 보면 됨 | 여러 feature spec을 종합해야 현재 동작을 앎 |

→ **OpenSpec = 연속성**(하나의 living spec을 델타로 진화), **Spec Kit = feature별 스냅샷 누적**. 이것이 "델타 vs 개별 파일" 대비의 실무적 귀결이다. 브라운필드 증분 변경이 잦으면 OpenSpec의 델타가, 기능별 완결 문서·거버넌스가 중요하면 Spec Kit의 feature 폴더가 유리하다.

## 재현
```bash
git checkout speckit-order-management            # 002 완료
git checkout speckit-order-stock-cancellation    # 003 완료(재고·취소)
```
