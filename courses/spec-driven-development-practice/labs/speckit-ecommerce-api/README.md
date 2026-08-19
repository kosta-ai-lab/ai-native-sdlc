# speckit-ecommerce-api — 살아있는 교재 (Spec Kit 트랙)

OpenSpec 트랙(`openspec-ecommerce-api`)의 짝입니다. **같은 상품·주문 API를 GitHub Spec Kit으로** 개발해, 두 SDD 도구를 정면 비교합니다.

## 도구
Spec Kit(`specify`) 0.12.8 · TypeScript/Hono(예정)

## 워크플로우
`/speckit.constitution → /speckit.specify → (clarify) → /speckit.plan → (checklist) → /speckit.tasks → (analyze) → /speckit.implement`

## 현재 상태
- ✅ `specify init . --integration claude` 완료 — `.specify/`(templates·scripts·memory·workflows) + `.claude/skills/speckit-*` 설치
- ⬜ 개발 예정: product-catalog → order-management → (변경) 같은 시나리오로 OpenSpec 트랙과 대조

## 비교 문서
- [docs/openspec-vs-speckit.md](docs/openspec-vs-speckit.md) — 초기화 산출물·워크플로우·변경관리 실측 비교

## 짝 트랙
- OpenSpec: `../openspec-ecommerce-api` (완성: change 3개·47테스트·나레이션 5편)
