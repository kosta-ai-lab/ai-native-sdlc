# SDD (Spec-Driven Development, 명세 기반 개발)

> 유형: 프로세스 · 출처: GitHub·AWS 등(2025)

## 핵심 개념

**구조화된 명세(스펙)를 단일 진실(source of truth)로 삼고, 코드를 그 명세의 산출물로 본다.** 모호한 프롬프트가 아니라 명확한 스펙으로 AI와 소통한다. 프로젝트가 커질수록 스펙의 가치가 커진다.

## 절차·단계

- **Constitution(프로젝트 헌법)**: 프로젝트의 불변 원칙을 먼저 명시한다.
- **ACME 프레임워크**로 스펙을 구조화한다 — 가정(Assumptions)·제약(Constraints)·지표(Metrics)·예시(Examples).
- 스펙 작성 → AI 구현 요청 → 스펙 대비 검증의 사이클을 돈다.
- 도구: GitHub Spec-Kit, OpenSpec 등(스펙을 워크플로우로 실행).

## 적용 시점·조건·한계

- **적합**: 요구가 복잡하고 일관성·추적성이 중요한 프로젝트. 여러 사람·여러 AI가 같은 기준을 공유해야 할 때.
- **한계**: 스펙 작성에 초기 비용이 든다. 스펙과 구현의 동기화를 유지하는 규율이 필요하다. 스펙이 과하게 무거우면 오히려 속도를 떨어뜨린다.

## 우리 라이프사이클 매핑

- **분석·명세 단계**의 중심 방법론으로 채택한다. 요구를 실행 가능한 스펙으로 만들고, Constitution을 우리의 프로젝트 규칙서(CLAUDE.md)로 삼는다.
- 다음 단계로 **BDD**(인수 조건)와 **TDD**(테스트 우선)에 연결한다 — 스펙이 인수 조건과 테스트의 원천이 된다.

## 출처

- GitHub Spec-Kit 블로그 — github.blog
- OpenSpec — github.com/Fission-AI/OpenSpec
- 대표님 정리: education LO "Spec-Driven Development"
