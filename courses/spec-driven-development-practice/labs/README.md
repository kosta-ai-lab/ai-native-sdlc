# 실습 자산 — 같은 API를 두 도구로

상품·주문 e-커머스 REST API(TypeScript + Hono)를 OpenSpec과 Spec Kit으로 각각 개발한 저장소 스냅샷입니다.

| 폴더 | 트랙 | 따라가는 법 |
|------|------|------------|
| `openspec-ecommerce-api/` | OpenSpec | `docs/steps/`의 단계별 나레이션을 순서대로 읽으며 재현합니다 |
| `speckit-ecommerce-api/` | Spec Kit | 같은 요구사항을 constitution → specify → plan → tasks → implement로 다시 만듭니다 |

두 트랙을 나란히 놓고 비교한 문서가 `speckit-ecommerce-api/docs/openspec-vs-speckit.md`에 있습니다. 어느 쪽이 우월하다는 결론이 아니라, 어떤 상황에서 무엇이 맞는지를 정리한 문서입니다.

## 실행

```bash
cd openspec-ecommerce-api
pnpm install
pnpm test
```

Node 20.19 이상이 필요합니다. `speckit-ecommerce-api`도 같습니다.

## 도구 설치

```bash
# OpenSpec
npx @fission-ai/openspec@latest init

# Spec Kit
uvx --from git+https://github.com/github/spec-kit.git specify init
```

버전 기준은 OpenSpec 1.5.0, Spec Kit(specify) 0.12.8입니다(2026년 7월 실측). 두 도구 모두 변화가 빠르므로 실습 전에 최신 변경점을 확인하십시오.

## 참고

원 저장소는 단계마다 git 태그를 남겨 `git checkout <tag>`로 그 시점을 되살릴 수 있게 만들었습니다. 이 폴더는 최종 상태의 스냅샷이라 태그 이력이 없습니다. 단계별 재현은 `docs/steps/` 나레이션을 따라 직접 수행하시면 같은 결과에 도달합니다.
