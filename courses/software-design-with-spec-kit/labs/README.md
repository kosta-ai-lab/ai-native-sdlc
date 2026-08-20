# 실습 자산 — 멀티셀러 마켓플레이스 완성본

강의에서 읽고 해석하는 설계 산출물이 모두 이 저장소에서 나왔습니다.

## 먼저 init을 실행하십시오

**이 폴더에는 Spec Kit이 생성하는 파일이 들어 있지 않습니다.** 템플릿·스크립트·워크플로우·스킬은 GitHub Spec Kit(MIT)의 저작물이라 사본을 두지 않고, 실습 첫 단계에서 직접 받도록 했습니다.

```bash
cd speckit-ecommerce-fullscale
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai claude
pnpm install
```

init이 `.specify/templates·scripts·workflows`와 `.claude/skills/speckit-*`를 만들어 주면, 이 폴더의 설계 산출물·스펙·코드와 합쳐져 완전한 프로젝트가 됩니다.

> `.specify/memory/constitution.md`는 우리가 쓴 아홉 가지 원칙이라 그대로 두었습니다. init이 덮어쓰지 않도록 주의하십시오.

## 무엇이 들어 있나

| 경로 | 내용 |
|------|------|
| `speckit-ecommerce-fullscale/design/diagrams/` | PlantUML 소스와 렌더 이미지 — 유스케이스·도메인 모델·ERD·시퀀스·상태머신·컴포넌트 |
| `speckit-ecommerce-fullscale/design/adr/ADR.md` | 아키텍처 결정 기록 ADR-001~005 |
| `speckit-ecommerce-fullscale/design/traceability.md` | 요구사항 R1~R6 ↔ 설계 ↔ 작업 추적성 매트릭스 |
| `speckit-ecommerce-fullscale/specs/` | Spec Kit 기능 스펙 8종 |
| `speckit-ecommerce-fullscale/src/` | TypeScript + Hono 구현 |
| `speckit-ecommerce-fullscale/.specify/memory/constitution.md` | 프로젝트 원칙 아홉 가지 |

## 실행

```bash
pnpm install
pnpm test          # 92개 통과
pnpm tsc --noEmit
```

## 다이어그램 다시 그리기

```bash
plantuml -tpng -Sdpi=200 design/diagrams/*.puml
```

## 강의와 함께 보는 법

슬라이드는 각 설계 산출물을 **개념 → 실습(어떤 프롬프트로 얻었나) → 산출물 → 해석** 순으로 다룹니다. 실습 장표에 실제로 사용한 프롬프트가 그대로 실려 있으므로, `design/`과 `specs/`를 지우고 처음부터 다시 만들어 보는 방식으로도 따라올 수 있습니다.

## 참고

원 저장소에는 이슈 → 브랜치 → PR → 머지로 이어지는 커밋 이력이 남아 있고, 강의 마지막 블록에서 그 흐름을 실물로 봅니다. 이 폴더는 최종 상태라 이력이 없습니다.
