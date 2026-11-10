# AI-Native SDLC

**AI와 함께 소프트웨어를 만드는 방법을 배우고, 실습하고, 발전시키는 교육 프로젝트입니다.**

> 코딩 전에 청사진, 코딩 후에 검증.

AI가 코드를 작성해 주더라도 무엇을 만들지 정하고, 설계를 검토하고, 결과를 검증하는 일은 필요합니다. 이 저장소는 요구사항부터 명세·설계·구현·테스트·배포까지 이어지는 개발 과정을 강의자료와 실행 예제로 다룹니다.

KOSTA AI 에이전트 코딩 전문가 워크숍에서 출발했으며, 강사와 개발자가 자료·사례·실습을 함께 보완합니다. Claude Code 중심의 예제를 포함하고, 특정 도구의 사용법뿐 아니라 다른 환경에도 적용할 수 있는 개발 원칙을 탐구합니다.

[시작 가이드](docs/GETTING_STARTED.md) · [강의자료](courses/README.md) · [방법론](METHODOLOGY.md) · [기여하기](CONTRIBUTING.md)

## 무엇을 배울 수 있나요?

- **요구사항과 명세:** 만들 기능과 완료 기준을 정하고, 구현과 연결합니다.
- **설계와 모델링:** 도메인·API·객체 구조를 검토하고 설계 의도를 남깁니다.
- **AI와 구현하기:** 작업 규칙·스킬·에이전트 구성을 활용해 개발 과정을 나눕니다.
- **테스트와 검증:** BDD·TDD로 기대 동작을 명확히 하고 구현 결과를 확인합니다.
- **배포와 운영:** CI/CD·아키텍처·보안 관점에서 개발 이후의 과정을 살펴봅니다.

## 어디서 시작하면 좋을까요?

- **전체 흐름부터 이해하려면:** [방법론](METHODOLOGY.md)과 [시작 가이드](docs/GETTING_STARTED.md)를 읽어 보세요.
- **작은 코드로 확인하려면:** [할 일 생성 예제](samples/web-task-system/README.md)에서 요구사항 → 명세 → 인수조건 → 테스트의 연결을 따라가세요.
- **강의를 따라 실습하려면:** 아래 과정에서 관심 있는 주제를 선택하세요.
- **교육자료를 보완하려면:** [기여 가이드](CONTRIBUTING.md)를 확인하고 문서 수정이나 작은 실습부터 제안해 주세요.

### 강의와 실습

- [Claude Code로 시작하는 바이브 코딩](courses/vibe-coding-with-claude-code/README.md)
- [명세 기반 개발 실습](courses/spec-driven-development-practice/README.md) — OpenSpec·Spec Kit 예제
- [Spec Kit을 활용한 소프트웨어 설계](courses/software-design-with-spec-kit/README.md)
- [Claude Code Cloud 앱 개발](courses/Agentic%20Coding%20using%20Claude%20Code/README.md) — 골프 스코어카드 앱 만들기

과정별 설명과 교재·실습 파일은 각 폴더에서 확인할 수 있습니다. 도구 계정·설치 환경·이용 비용은 과정마다 다르므로 해당 안내를 먼저 읽어 주세요.

## 빠른 시작: 작은 TDD 예제

Node.js와 pnpm이 설치된 환경에서 실행합니다.

```bash
git clone https://github.com/kosta-ai-lab/ai-native-sdlc.git
cd ai-native-sdlc/samples/web-task-system
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm exec tsc --noEmit
```

이 예제는 **‘할 일 생성’ 기능을 테스트로 확인하는 작은 코드 샘플**입니다. 웹 서버를 실행하거나 AI API를 호출하지 않습니다. 패키지 설치에는 인터넷 연결이 필요합니다.

실행 후 다음 자료를 순서대로 읽으면 명세가 구현으로 이어지는 과정을 볼 수 있습니다.

1. [요구사항](samples/web-task-system/docs/03-requirements.md)
2. [명세](samples/web-task-system/docs/04-spec.md)
3. [인수조건](samples/web-task-system/docs/05-acceptance.feature)
4. [테스트](samples/web-task-system/test/todo.test.ts)와 [구현](samples/web-task-system/src/todo.ts)

## 저장소 둘러보기

```text
courses/              과정별 소개·교재·실습·참고자료
modules/              개발 단계별 가이드와 실행 자산
  01~10               비즈니스·요구사항·설계·구현·검증·배포·보안
  ext-harness/        에이전트 하니스와 개발 도구 활용
  ext-embedded/       임베디드 분야 확장
samples/              요구사항부터 코드까지 연결하는 작은 예제
references/methods/   관련 방법론과 참고자료
rfcs/                 큰 변경에 대한 제안
decisions/            설계·운영 결정 기록
docs/                 시작 안내와 상세 정책
```

개발 단계별 자료는 [모듈 폴더](modules/)에서, 앞으로 보완할 주제는 [백로그](BACKLOG.md)에서 확인하세요.

## 자료의 상태

이 프로젝트는 계속 발전하는 교육 자료 모음입니다. **모든 모듈이 완성된 것은 아니며**, 개요·초안·실행 가능한 실습이 함께 있습니다. 각 과정과 모듈의 README를 기준으로 필요한 자료를 선택해 주세요. 예제는 학습용이며 운영 서비스에 그대로 적용하기 전에 별도 검토가 필요합니다.

검증 환경·실행 범위·미실행 항목은 [검증 기록](docs/RELEASE_VERIFICATION_20261104.md)에서 확인할 수 있습니다. 과거의 테스트 통과가 이후 모든 변경이나 모든 도구·환경의 동작을 보장하지는 않습니다.

## 함께 기여하기

오탈자 수정, 설명 보강, 실습 오류 제보, 새로운 사례 제안을 환영합니다.

1. 질문이나 개선 사항은 GitHub Issues에 남겨 주세요.
2. 작은 변경은 별도 브랜치에서 수정한 뒤 Pull Request로 제안해 주세요.
3. 큰 구조·방법론 변경은 [RFC](rfcs/)로 목적과 영향을 먼저 설명해 주세요.
4. 사용한 자료의 출처와 기여 권한, 실제 실행한 검증 결과를 함께 적어 주세요.

자세한 절차는 [기여 가이드](CONTRIBUTING.md), 협업 원칙은 [행동 기준](CODE_OF_CONDUCT.md)을 따릅니다. API 키·개인정보·고객 자료·비공개 로그는 올리지 마세요. 보안 문제는 공개 이슈에 상세를 남기지 말고 [보안 안내](SECURITY.md)를 확인해 주세요.

## 라이선스

자료의 용도에 따라 라이선스를 구분합니다.

- **교재·설명 문서·슬라이드·설계 설명:** CC BY-NC 4.0
- **실습 코드·테스트·실행용 설정·AI 작업 규칙 및 스킬:** Apache License 2.0
- **제3자 자료:** 해당 자료의 원래 라이선스와 별도 고지를 따릅니다.

세부 적용 범위와 예외는 [LICENSE](LICENSE), [라이선스 정책](docs/LICENSING_POLICY.md), [제3자 자료 고지](THIRD_PARTY_NOTICES.md)를 확인해 주세요.
