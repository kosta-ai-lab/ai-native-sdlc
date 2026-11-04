# AI-Native SDLC

> **2026-10-08 반영 상태:** 준비 문서 23개는 PR #5로 main에 병합되었습니다(병합 커밋 `9614297985689db627b8c303ee818f7ffb26f320`). 아래의 준비 브랜치·main 미반영 표기는 작성 당시 기록입니다. 현재 저장소는 PRIVATE이며 자료별 권리·내용 확인, 정식 라이선스 적용과 실제 공개 승인은 별도로 남아 있습니다.


> AI 에이전트로 실제 제품 수준의 소프트웨어를 만드는 전주기 방법론과 실행 자산.
> **코딩 전에 청사진, 코딩 후에 검증.**

KOSTA AI 에이전트 코딩 전문가 워크숍에서 출발한 공개 준비 프로젝트입니다.
**현재 저장소는 비공개(private)입니다.** 전체 공개와 초안 포함, 초기 운영 책임·리뷰·기여 확인 방식은 [준비 기준](docs/PUBLIC_RELEASE_DECISIONS.md)으로 정했습니다. 이 브랜치의 문서 반영과 실제 공개는 별개이며, 기존 자료의 권리·내용 확인과 최종 공개 승인만 필수 확인으로 남깁니다.

## 처음 오셨다면

1. [시작 가이드](docs/GETTING_STARTED.md)에서 읽기 전용 탐색, 작은 TDD 예제, SDD 실습 중 목적에 맞는 경로를 고릅니다.
2. 방법론은 [METHODOLOGY.md](METHODOLOGY.md), 교육 과정은 [courses/README.md](courses/README.md)에서 살펴봅니다.
3. 가장 작은 코드 예제는 [web-task-system](samples/web-task-system/README.md)입니다. 실행 명령과 검증 한계는 시작 가이드에 명시했습니다.
4. 질문·문서 수정·버그 제안은 [기여 가이드](CONTRIBUTING.md)를 읽어 주세요. 현재 비공개이므로 저장소 접근 권한이 필요합니다. 공개 후에는 같은 GitHub Issues·PR 경로로 참여하며, 외부 접근을 실제 확인합니다.

API 키·고객 자료·개인정보·비공개 로그는 이슈나 PR에 올리지 않습니다. [보안 안내](SECURITY.md)을 먼저 확인하세요.

## 무엇인가

- 에이전트 코딩의 전주기(분석, 설계, 개발, 검증, 배포, 운영)를 **방법론(프로세스 표준)**으로 정의합니다.
- 각 단계에 실행 자산을 쌓습니다. Claude Code 설정(CLAUDE.md·스킬·훅·서브에이전트)과 샘플 코드가 포함되며, 완성도와 검증 상태는 경로별로 다릅니다.
- 구현체는 각 사가 자율적으로 만듭니다. 이 프로젝트는 표준·패턴·레퍼런스를 제공합니다.

## 왜인가

명세와 구현을 **검증·CI/CD·보안·운영의 공학 규율**로 연결하는 것이 이 프로젝트의 목표입니다. 각 단계의 방법론과 실행 자산을 함께 발전시킵니다.

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
courses/        강의 개요·슬라이드·실습·참고자료
docs/           심화 가이드·교육 매핑
BACKLOG.md      앞으로 채울 항목
```

## 각 모듈의 산출물 4종 (목표 형식)

아래는 목표 형식이며, 모든 모듈이 네 종류를 완성했다는 뜻은 아닙니다. 실제 파일과 상태는 각 모듈의 README를 확인하세요.

| 산출물 | 내용 |
|--------|------|
| 가이드 | 단계의 목적·입력·산출물·체크리스트 |
| 규칙 | CLAUDE.md 조각, 이 단계에서 AI가 지킬 규칙 |
| 자동화 | 스킬·훅·서브에이전트 (바로 불러 쓰는 것) |
| 샘플 | 동작하는 참조 코드·프롬프트 |

## 플랫폼

표준 플랫폼은 **Claude Code**입니다. 자산은 포터블하므로 추후 다른 도구로 옮길 수 있습니다.

## 라이선스

**교육자료는 CC BY-NC 4.0(저작자표시-비영리)을 적용하는 것으로 합의되었습니다.** 2026-10-29 윤성열(Andy)이 전달한 회의 합의를 반영합니다. **코드·실행용 자료는 Apache 2.0으로 분리 적용하는 것으로 선택·확정했습니다.** 이는 정책 결정이며 파일별 실제 권리자의 적용 허락·귀속·고지 완료를 뜻하지 않습니다. 제3자 자료는 원 조건을 유지합니다. 과거 React 공식 영어 문서는 [CC BY 4.0 예외](THIRD_PARTY_NOTICES.md)이며 교재 NC로 덮지 않습니다.

[LICENSE](LICENSE) · [적용 정책과 예외](docs/LICENSING_POLICY.md) · [공식 전문](docs/license-texts/CC-BY-NC-4.0.txt) · [표시 양식](docs/ATTRIBUTION_TEMPLATE.md)

비상업적 이용 범위에서 복제·공유·수정을 허용하고 저작자·라이선스·변경 사항을 표시합니다. 상업적 이용은 해당 권리자의 별도 허락을 확인합니다. 자료별 권리·노출 검수가 확인되지 않은 파일을 정책 합의만으로 공개하지 않습니다.

## 상태

**2026-11-04 공개 전 점검:** 기준 커밋은 317개 파일입니다. [검증 결과와 남은 판단](docs/RELEASE_VERIFICATION_20261104.md) · [기준 명세](docs/distribution-manifest-d698f205.csv). 대표 앱 시험 163건 통과, harness 12건 미실행. 현재·과거 미디어 검사 후 과거 강의의 연락처·계정 식별 표시와 일부 이미지의 공개 근거 확인이 남아 있어 비공개를 유지합니다.

**비공개(private) 공개 준비 단계입니다.** 라이선스 합의 반영과 자료별 공개 준비를 진행합니다. 과거 2026-10-14/16 목표일은 경과했으며 새로운 공개일은 확정하지 않았습니다. [현재 검증 현황](docs/RELEASE_VERIFICATION_20261104.md)의 남은 항목과 최종 배포 SHA와 남은 공개 조건을 확인한 뒤 이미 승인된 공개 전환을 진행합니다.

[GOVERNANCE.md](GOVERNANCE.md)와 [기여 안내](CONTRIBUTING.md)는 같은 준비 기준으로 맞췄습니다. 기존 오픈코어 [ADR 0002](decisions/0002-open-core-private-start.md)는 역사로 보존하고, 전체 공개 준비 방향은 [ADR 0004](decisions/0004-public-release-preparation.md)에 기록합니다.

- [공개 준비 체크리스트](docs/PUBLIC_RELEASE_CHECKLIST.md): 완료·미검증·승인 대기 구분
- [릴리스 노트 초안](docs/RELEASE_NOTES_DRAFT.md): 아직 릴리스가 아님
- [행동 기준](CODE_OF_CONDUCT.md) · [보안 안내](SECURITY.md): 초기 총괄 Andy, 비공개 요약 연락 경로 지정

자세한 내용은 [METHODOLOGY.md](METHODOLOGY.md), [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md)를 참고하세요.
