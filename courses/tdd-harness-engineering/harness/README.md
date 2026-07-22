# TDD 과정 제작 하니스 — 최소 실행안

> 이 폴더는 TDD 강의의 학습 내용이 아니라, 과정을 만드는 규칙·운영 상태·검사기를 담습니다. TDD 과정 산출물은 `01-planning/`부터 `06-deliveries/`에서 관리합니다.

## 목적

이 하니스는 문서 형식을 많이 만드는 것이 아니라, 앞 단계의 산출물이 다음 단계에서 실제로 사용되는지를 확인한다. 규칙은 샘플 제작과 리허설에서 효용이 확인된 것만 유지한다.

## 운영 기록

- [`production-intent.md`](production-intent.md): 과정 제작 방식에 대한 사용자 의도와 가정
- [`decisions.md`](decisions.md): 폴더, 저작 순서, gate와 아카이브에 관한 장기 결정
- [`terminology.md`](terminology.md): 개발 하니스와 과정 제작 하니스의 운영상 경계

하니스는 검사기만이 아니다. [`FACILITATION.md`](FACILITATION.md)의 대화 루프로 사용자의 의도를 발견·반영하고, [`STAGE-GUIDES.md`](STAGE-GUIDES.md)의 단계별 유도 질문과 승인 계약으로 작업을 진행한다.

```text
Planning → Research → Design → Manuscript → Materials → Deliveries
```

## 각 층의 책임

| 층 | 책임 | 다음 층에 넘기는 것 |
|---|---|---|
| Planning | 과정 문제, 대상과 조사 질문 정의 | brief와 open question |
| Research | 원문 수집, Wiki 정규화와 횡단 종합 | 출처가 있는 정보와 적용 가능한 지식 |
| Design | 기관 중립 거시 설계와 Unit 설계 | blueprint, outline과 평가 계약 |
| Manuscript | 자기완결적인 장문 교재 작성 | 출처·사례·한계가 있는 원고 |
| Materials | 교재를 실제 수업 활동으로 투영 | 슬라이드·데모·실습·평가 |
| Deliveries | 대상·시간·환경에 맞게 명시적으로 변형 | 요구 프로파일과 adaptation decision |

## 다섯 개의 필수 게이트

### G1 Research usability

- 주요 claim에 1차 출처 또는 직접 관찰이 있다.
- 확인일과 기준 버전이 있다.
- 프로젝트 측 주장과 독립적으로 확인한 사실을 구분한다.
- 다음 단계에서 참조할 안정적인 Source·Claim ID가 있다.

### G2 Knowledge usability

- 종합 지식은 적어도 하나의 Source 또는 Claim ID를 사용한다.
- 정보 재진술이 아니라 관계, 적용 조건, 한계 또는 절차를 제공한다.
- “그래서 어떤 판단이나 행동이 달라지는가”에 답한다.

### G3 Design alignment

- Unit은 측정 가능한 수행목표를 가진다.
- 평가는 목표와 같은 행동을 요구한다.
- 필수 지식 ID가 명시돼 있다.
- 거시 설계는 내용 목록이 아니라 수행의 진행과 의존관계를 설명한다.

### G4 Adaptation integrity

- 기관별 변경은 표준설계를 덮어쓰지 않는다.
- 모든 변경에 요구사항, 변경 이유와 유지해야 할 학습성과가 있다.
- 시간 단축 시 무엇을 삭제했는지뿐 아니라 평가가 여전히 유효한지 기록한다.

### G5 Materials usability

- 학습자가 수행할 입력, 절차, 산출물과 완료 기준이 있다.
- 강사가 예상 결과와 대표 실패를 재현할 수 있다.
- 평가 루브릭이 학습목표를 직접 측정한다.
- `classroom-ready`는 실제 리허설 증거가 있을 때만 허용한다.

## 의도적으로 넣지 않은 규칙

- LO마다 동일한 슬라이드 수
- 모든 단원에 동일한 8단계 구성
- 문서 길이만으로 판단하는 밀도 기준
- 폴더와 섹션의 존재만 확인하는 완료 판정
- 특정 기관용 자료를 표준본으로 역병합하는 자동 규칙

이 항목들은 형식적 준수를 늘릴 수 있지만 실제 교육 품질을 직접 증명하지 못한다. 필요성이 샘플과 리허설에서 확인되면 이후 추가한다.

## 실행

```bash
node courses/tdd-harness-engineering/harness/validate.mjs
```

검증기는 `manifest.json`의 ID, 참조 관계, 필수 파일과 상태 전이의 최소 조건을 검사한다. 내용의 정확성과 교육적 완성도는 사람이 `review-checklist.md`로 검토한다.

실패 감지 자체를 확인하는 fixture는 다음처럼 실행한다. 이 명령은 성공이 아니라 exit code 1과 누락 파일·알 수 없는 Source 오류를 내야 한다.

```bash
node courses/tdd-harness-engineering/harness/validate.mjs \
  courses/tdd-harness-engineering/harness/fixtures/invalid-manifest.json
```

## 승격 원칙

이 하니스를 공통 방법론이나 스킬로 승격하려면 최소 두 개의 서로 다른 과정에서 사용해야 한다. 두 과정에서 공통으로 필요했던 규칙만 core로 남기고, TDD 과정에만 필요한 규칙은 course profile로 분리한다.
