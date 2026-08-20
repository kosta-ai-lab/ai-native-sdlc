# 스펙 주도 개발 실전 — OpenSpec과 Spec Kit

> **AI Native 개발 실무 3부작 · 2편.** 방법론을 세우고 두 구현체를 손에 익히는 날입니다.
> 1편 [바이브 코딩 첫걸음](../vibe-coding-with-claude-code/) · 3편 [Spec Kit으로 실전 소프트웨어 설계](../software-design-with-spec-kit/)

## 강의 개요

| 항목 | 내용 |
|------|------|
| 제목 | 스펙 주도 개발 실전 — OpenSpec과 Spec Kit |
| 대상 | 개발 경력 2년 이상, AI 코딩 도구 입문~중급 |
| 선수지식 | TypeScript와 REST API 기초. 1편 수준의 Claude Code 사용 경험 |
| 학습목표 | 의도를 스펙에 먼저 고정하고, 두 SDD 도구로 같은 API를 만들어 비교·선택한다 |
| 분량 | 1일 8블록 (50분 × 8 + 휴식) |
| 강사 | 윤성열 (프렌티스 · KOSTA AI Lab 운영위원) |

## 왜 이 과정인가

1편에서 바이브 코딩으로 앱을 만들어 보면 곧 한계에 부딪힙니다. 의도를 붙잡아 둘 곳이 없어서, 대화가 길어질수록 결과가 흔들립니다.

이 과정은 그 한계를 방법론으로 넘습니다. AI-DLC를 상위 방법론으로 세운 뒤, 그 구현체인 **OpenSpec**과 **GitHub Spec Kit**을 같은 예제에 각각 적용합니다. 도구 사용법이 아니라 "왜 스펙이 먼저인가"를 먼저 세우기 때문에, 도구가 바뀌어도 남습니다.

핵심 자산은 **재현 가능한 살아있는 교재**입니다. 같은 e-커머스 상품·주문 API를 두 도구로 각각 개발하며 단계마다 git 스냅샷을 남겼습니다. 학습자는 어느 단계든 `git checkout`으로 그 시점을 그대로 되살려 따라갑니다.

## 학습 목표

1. AI-DLC 생명주기와 인간·AI의 역할 분담을 설명한다
2. SDD 원리("의도가 진실의 원천")를 실제 산출물에 적용한다
3. OpenSpec으로 스펙 → 코드 사이클과 delta 변경 관리를 수행한다
4. Spec Kit으로 constitution → specify → plan → tasks → implement 워크플로우를 수행한다
5. 두 구현체를 비교해 우리 조직·프로젝트에 맞는 선택과 도입 계획을 세운다

## 커리큘럼 (1일 8블록)

| 블록 | 내용 |
|---:|------|
| 1 | 오프닝 · 개발 방법론 스펙트럼 (바이브 → AI-DLC → SDD) |
| 2 | AI-DLC 생명주기와 인간·AI 역할 |
| 3 | SDD 원리: 의도가 진실의 원천 · SDD 산출물 지도 |
| 4 | OpenSpec 기초 — 관통 실습 착수 (상품 CRUD) |
| 5 | OpenSpec 심화 — delta 변경 관리 (주문·재고) |
| 6 | Spec Kit 기초 — 같은 상품 CRUD를 Spec Kit으로 |
| 7 | Spec Kit 심화 (다중 feature) · 두 구현체 정면 비교 |
| 8 | 조직 도입 로드맵과 거버넌스 · 회고 |

## 관통 실습

상품·주문 e-커머스 REST API(TypeScript + Hono)를 두 트랙으로 개발합니다.

| 트랙 | 실습 폴더 | 재현 방법 |
|------|-----------|-----------|
| OpenSpec | `labs/openspec-ecommerce-api/` | `docs/steps/`의 단계별 나레이션을 따라갑니다 |
| Spec Kit | `labs/speckit-ecommerce-api/` | 같은 요구사항을 Spec Kit 워크플로우로 다시 만듭니다 |

두 트랙의 차이를 정리한 비교 문서가 `labs/speckit-ecommerce-api/docs/openspec-vs-speckit.md`에 있습니다.

두 도구가 생성하는 파일(슬래시 커맨드·스킬·템플릿·스크립트)은 사본을 두지 않았습니다. 실습 첫 단계에서 `openspec init`과 `specify init`을 직접 실행하시면 됩니다. 절차는 `labs/README.md`에 있습니다.

## 도구 버전

OpenSpec 1.5.0 · Spec Kit(specify) 0.12.8 · Node 20.19 이상 (2026년 7월 실측 기준)

> 슬라이드의 명령어와 출력은 위 버전에서 실제로 실행해 확인한 것입니다. 도구가 빠르게 바뀌므로, 실습 전에 최신 버전의 변경점을 확인하십시오.

## 폴더 구성

- `slides/` — 발표 슬라이드 PDF (149장)
- `labs/` — 두 트랙의 실습 저장소 스냅샷
- `resources/` — 참고 링크

## 이력

2026년 기업 교육에서 1일 과정으로 진행한 자료를 공개판으로 다시 편집했습니다.
