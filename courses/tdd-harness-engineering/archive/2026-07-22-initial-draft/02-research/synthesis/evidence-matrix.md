# 주장·근거·검증 매트릭스

> 강의에서 사실, 도구 자체 주장, 연구 결과와 과정 가설을 섞지 않기 위한 관리표입니다.

| ID | 강의에서 사용할 주장 | 근거 유형 | 현재 근거 | 강의 전 추가 검증 |
|----|----------------------|-----------|-----------|-------------------|
| E-01 | BDD는 Discovery, Formulation, Automation으로 구성된다 | 공식 문서 | Cucumber 공식 BDD 문서 | 없음 |
| E-02 | BDD는 단순 테스트 자동화가 아니다 | 공식 문서 | Cucumber 문서·공식 블로그 | 사례 표현 검토 |
| E-03 | BDD 예제는 자동화된 테스트로 구현을 안내한다 | 공식 문서 | Cucumber 공식 BDD 문서 | 샘플 앱 매핑 |
| E-04 | 현재 저장소는 03~06 요구–명세–BDD–TDD 흐름을 갖는다 | 소스 확인 | `samples/web-task-system` | 추적 ID 보강 여부 검토 |
| E-05 | 프롬프트만으로 TDD 준수를 보장할 수 없다 | 연구 결과·과정 가설 | TDAD 연구, 하니스 실패 패턴 | 동일 과제 반복 실험 |
| E-06 | 코드–테스트 영향 정보가 회귀 감소에 도움될 수 있다 | 연구 결과 | TDAD 2026 사전 연구 | 다른 모델·언어로 재현 |
| E-07 | 역할 분리와 hidden/mutation test가 스펙 게이밍 완화에 쓰일 수 있다 | 연구 결과 | Test-Driven AI Agent Definition | 최소 실습으로 재현 |
| E-08 | MoAI는 SPEC-first TDD workflow를 제공한다 | 공식 문서·소스 확인 | 공식 README, TDD 스킬 | 버전 고정 실행 |
| E-09 | MoAI는 신규 TDD와 레거시 보존 workflow를 구분한다 | 공식 문서·소스 확인 | TDD/DDD 스킬, manager-develop | 자동 선택 조건 실행 확인 |
| E-10 | MoAI는 Red 누락 신호와 완료 체크리스트를 정의한다 | 소스 확인 | TDD SKILL의 red flags·verification | 실제 보고서 생성 확인 |
| E-11 | MoAI는 Hook으로 완료·상태 전이를 관리한다 | 소스 확인 | `.claude/settings.json`, hook scripts | 실패 조건 동적 검사 |
| E-12 | Hook은 존재해도 실제 차단되지 않을 수 있다 | 소스 확인·일반 원리 | MoAI 자체 Hook 개선 보고서 | 특정 릴리스에서 재현 |
| E-13 | 커버리지 수치만으로 테스트 강도를 보장할 수 없다 | 과정 가설·테스트 원리 | mutation 사례 | 샘플 mutation 실험 |
| E-14 | 신규 기능과 레거시는 다른 테스트 출발점이 필요하다 | 공식 사례·과정 원칙 | MoAI 분기, 기존 LO | 샘플 앱 양쪽 실습 |
| E-15 | Superpowers는 실패 테스트 확인과 최신 완료 증거를 명시적으로 요구한다 | 소스 확인 | TDD·verification-before-completion 스킬 | 동일 과제 실행 관찰 |
| E-16 | OpenSpec은 scenario coverage를 검증하지만 기본 apply가 TDD를 강제하지는 않는다 | 소스 확인 | apply-change·verify-change template | 실제 change workflow 실행 |
| E-17 | Spec Kit의 기본 test task는 명세에서 요청된 경우에만 포함되는 선택 사항이다 | 소스 확인 | tasks-template·implement command | Test-First constitution 전후 비교 |
| E-18 | BMAD TEA는 ATDD, 추적성과 release gate를 제공한다 | 공식 문서 | BMAD TEA 공식 문서 | 샘플 project workflow 실행 |

## 표현 규칙

### 공식 문서

“Cucumber는 …라고 정의한다”, “MoAI 공식 문서는 …를 제공한다고 설명한다”처럼 주체를 밝힌다.

### 소스 확인

“조사한 2026-07-22 저장소 스냅샷에서 파일과 설정을 확인했다”고 표현한다. 모든 환경에서의 동작을 보장한다고 확대하지 않는다.

### 연구 결과

표본, 모델, 연구 상태를 함께 언급한다. 사전 공개 논문 결과를 일반 법칙으로 말하지 않는다.

### 과정 가설

강의 실험으로 비교하고 결과를 기록한다. 예상과 다르면 자료를 수정한다.

## 수집이 더 필요한 자료

- 실제 팀에서 TDD 하니스를 적용한 전후 PR 사례
- 테스트를 약화하거나 삭제한 에이전트 실패 사례
- Hook이 빌드 시간을 과도하게 늘린 사례와 계층형 실행 대안
- Java/Spring, Python, TypeScript 각각의 최소 하니스 예제
- Windows/WSL에서의 Hook·권한 차이
- BDD 예제가 비개발자와 개발자 합의를 개선한 실제 워크숍 기록
- MoAI 특정 버전의 Plan → Run → Sync 전체 실행 로그
