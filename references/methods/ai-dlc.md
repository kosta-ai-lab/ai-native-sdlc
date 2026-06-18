# AI-DLC (AI-Driven Development Life Cycle)

> 유형: 프로세스 · 출처: AWS(2025.8, DevSphere 2025)

## 핵심 개념

AI를 개발 보조 도구가 아니라 **개발 전체 주기의 중심 실행자**로 놓는 방법론이다. 두 축 위에 선다 — **AI가 실행하고 사람이 감독한다(AI Powered Execution with Human Oversight)**, 그리고 **동적 팀 협업(Dynamic Team Collaboration)**. AWS가 오픈 방법론으로 공개했다.

## 절차·단계

세 단계로 구성된다.

| 단계 | 핵심 활동 | AI 역할 | 사람 역할 |
|------|----------|---------|----------|
| Inception | Mob Elaboration | 요구를 Stories·Units of Work로 변환 | 검토·명확화 |
| Construction | Mob Construction | 아키텍처·코드·테스트 생성 | 검증·피드백 |
| Operation | 운영 | 모니터링 자동화 | 의사결정 |

용어 재정의: Sprint를 **Bolt**(시간·일 단위), Epic을 **Units of Work**(AI가 처리 가능한 단위), Stand-up을 **Mob Session**(실시간 협업), Code Review를 **Real-time Validation**으로 바꾼다. 모든 Mob 세션은 **Plan-Execute-Validate** 사이클을 따른다. 팀 구성은 **Taxi Team**(4~6명 교차기능).

## 적용 시점·조건·한계

- **적합**: 프로덕션급 엔터프라이즈 개발, 실시간 협업이 가능한 소규모 교차기능팀.
- **한계(균형 시각)**: 2025년 8월 발표로 장기·대규모 검증이 부족하다. 학습·성찰 메커니즘이 약하고, Amazon Q·Kiro 등 특정 도구 의존이 있다. AI 생성 코드의 기술부채(GitClear 2024: 수정률 41% 상승, 복제 4배)에 주의해야 한다.
- **부적합**: 고규제 산업(감사 가능성), 복잡한 레거시, 소규모 단순 프로젝트, 비동기·분산팀.

## 우리 라이프사이클 매핑

- **전주기 골격**으로 채택한다. 우리 단계(분석→설계→개발→테스트→배포→운영)는 AI-DLC의 Inception·Construction·Operation에 대응한다.
- **협업 운영 방식**으로 Mob 세션·Plan-Execute-Validate·Taxi Team을 가져온다.
- 단, AI-DLC의 한계를 보완하기 위해 우리는 **SDD·BDD·TDD·CI/CD 규율**(아래 다른 카드)을 각 단계에 결합한다.

## 출처

- AWS AI-DLC 블로그 — aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/
- AWS DevSphere 2025
- 비판적 분석 — buildwithdc.substack.com / medium 등 (균형 시각)
- 대표님 정리: education LO "AI-DLC 방법론"
