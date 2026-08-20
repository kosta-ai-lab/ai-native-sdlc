# 실습 자산 — 같은 API를 두 도구로

상품·주문 e-커머스 REST API(TypeScript + Hono)를 OpenSpec과 Spec Kit으로 각각 개발한 저장소입니다.

| 폴더 | 트랙 | 따라가는 법 |
|------|------|------------|
| `openspec-ecommerce-api/` | OpenSpec | `docs/steps/`의 단계별 나레이션을 순서대로 읽으며 재현합니다 |
| `speckit-ecommerce-api/` | Spec Kit | 같은 요구사항을 constitution → specify → plan → tasks → implement로 다시 만듭니다 |

두 트랙을 나란히 놓고 비교한 문서가 `speckit-ecommerce-api/docs/openspec-vs-speckit.md`에 있습니다. 어느 쪽이 우월하다는 결론이 아니라, 어떤 상황에서 무엇이 맞는지를 정리한 문서입니다.

## 먼저 init을 실행하십시오

**이 폴더에는 도구가 생성하는 파일이 들어 있지 않습니다.** OpenSpec의 슬래시 커맨드·스킬, Spec Kit의 템플릿·스크립트·스킬은 각 프로젝트(모두 MIT)의 저작물이라 사본을 두지 않고, 실습 첫 단계에서 직접 받도록 했습니다. 도구가 빠르게 바뀌기 때문에 사본보다 그때그때 최신 버전을 받는 편이 정확합니다.

```bash
# OpenSpec 트랙
cd openspec-ecommerce-api
npx @fission-ai/openspec@latest init      # openspec/ 골격 + .claude/commands·skills 생성
pnpm install

# Spec Kit 트랙
cd ../speckit-ecommerce-api
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai claude
pnpm install
```

init을 돌리면 `.claude/`와 `.specify/templates·scripts·workflows`가 만들어지고, 이 폴더에 든 우리 산출물과 합쳐져 완전한 프로젝트가 됩니다.

> `openspec/config.yaml`과 `.specify/memory/constitution.md`는 우리가 이 프로젝트에 맞게 쓴 내용이라 그대로 두었습니다. init이 같은 파일을 만들려 하면 덮어쓰지 마십시오.

## 이 폴더에 있는 것

- `openspec/specs/`·`openspec/changes/` — 우리가 작성한 스펙과 변경 이력(archive 3건)
- `specs/` — Spec Kit 기능 스펙
- `src/` — 구현과 테스트
- `docs/steps/` — 단계별 나레이션
- `harness/` — 재현·회귀 검증용 러너 (OpenSpec 트랙)

## 실행

```bash
pnpm install
pnpm test
```

Node 20.19 이상이 필요합니다.

## 도구 버전

OpenSpec 1.5.0 · Spec Kit(specify) 0.12.8 (2026년 7월 실측). 슬라이드의 명령어와 출력은 이 버전에서 실제로 실행해 확인한 것입니다. 최신 버전에서는 커맨드 이름이 달라졌을 수 있으니 init 후 `--help`로 확인하십시오.

## 참고

원 저장소는 단계마다 git 태그를 남겨 `git checkout <tag>`로 그 시점을 되살릴 수 있게 만들었습니다. 이 폴더는 최종 상태라 태그 이력이 없습니다. 단계별 재현은 `docs/steps/` 나레이션을 따라 직접 수행하시면 같은 결과에 도달합니다.
