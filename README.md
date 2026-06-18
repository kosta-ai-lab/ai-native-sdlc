# AI-Native SDLC

> AI 에이전트로 실제 제품 수준의 소프트웨어를 만드는 전주기 방법론과 실행 자산.
> **코딩 전에 청사진, 코딩 후에 검증.**

KOSTA AI 에이전트 코딩 전문가 워크숍에서 출발한 오픈소스 프로젝트입니다.
현재 비공개(private) 준비 단계입니다.

## 무엇인가

- 에이전트 코딩의 전주기(분석, 설계, 개발, 검증, 배포, 운영)를 **방법론(프로세스 표준)**으로 정의합니다.
- 각 단계에 **바로 복사해 쓰는 실행 자산**을 제공합니다. Claude Code 설정(CLAUDE.md·스킬·훅·서브에이전트)과 동작하는 샘플 코드입니다.
- 구현체는 각 사가 자율적으로 만듭니다. 이 프로젝트는 표준·패턴·레퍼런스를 제공합니다.

## 왜인가

스펙 주도 개발 도구(GitHub Spec-Kit, BMAD-METHOD 등)는 "스펙에서 코드까지"를 다루지만, 그 뒤의 **검증·CI/CD·보안·운영을 공학 규율로 묶는 부분**은 비어 있습니다. AI-Native SDLC는 그 전주기를 채웁니다.

## 구조

```
modules/        라이프사이클 단계별 모듈 (각 모듈은 산출물 4종)
  01-business-reinvention/   비즈니스 리인벤션
  02-semantic-model/         시맨틱 모델 (온톨로지)
  03-requirements/           유즈케이스·요구사항
  04-sdd/                    명세 기반 개발
  05-bdd/                    행위 기반 개발 (인수조건)
  06-coding-tdd/             코딩 + TDD  (시드 모듈)
  07-object-design/          객체설계 (SOLID·API)
  08-ci/                     지속 통합 (테스트 게이트)
  09-cd-architecture/        지속 배포·아키텍처 검증
  10-security/               보안·규제·윤리
  ext-embedded/              임베디드 환경 구축 (특화)
  ext-harness/               하니스 엔지니어링 (특화)
rfcs/           큰 변경 제안·합의 (상태머신 + 템플릿)
decisions/      결정 기록 ADR
references/methods/  참조 방법론 카탈로그
samples/        참조 앱 (레퍼런스 구현)
docs/           심화 가이드·교육 매핑
BACKLOG.md      앞으로 채울 항목
```

## 각 모듈의 산출물 4종

| 산출물 | 내용 |
|--------|------|
| 가이드 | 단계의 목적·입력·산출물·체크리스트 |
| 규칙 | CLAUDE.md 조각, 이 단계에서 AI가 지킬 규칙 |
| 자동화 | 스킬·훅·서브에이전트 (바로 불러 쓰는 것) |
| 샘플 | 동작하는 참조 코드·프롬프트 |

## 플랫폼

표준 플랫폼은 **Claude Code**입니다. 자산은 포터블하므로 추후 다른 도구로 옮길 수 있습니다.

## 라이선스

- 코어: Apache License 2.0 (예정)
- 문서: CC BY 4.0 (예정)

## 상태

**비공개(private) 준비 단계입니다.** 코어 모듈 5~6개, 동작 레퍼런스 앱 1개, "따라 하면 되는" 문서가 갖춰지면 코어를 공개(public)로 전환합니다.

자세한 내용은 [METHODOLOGY.md](METHODOLOGY.md), [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md)를 참고하세요.
