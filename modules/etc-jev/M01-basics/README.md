# 모듈 — Jev 기초 — System One 모델로 "똑똑한 if문" 만들기

> 상태: 초안 · 담당: 이선아 교수

## 목적

TypeSafe AI의 **Jev**(첫 번째 "System One 모델")를 Python SDK로 호출해 본다. 고객 문의 티켓을 **분류(Choice)·점수(Score)·참/거짓(Noul)**로 판단하고, 함께 돌아오는 **확률과 신뢰도**로 "자동 처리할지, 사람에게 넘길지"를 분기하는 작은 라우터를 만든다. 이 과정을 통해 LLM과는 다른 "구조화된 결정 모델"을 코드 안에서 쓰는 방법을 배운다.

## Jev 한눈에 보기

| 구분 | 기존 LLM | Jev (System One 모델) |
|---|---|---|
| 하는 일 | 문장을 생성 (채팅·코드·요약) | **미리 정한 선택지 중에서 결정**하고 확률을 돌려줌 |
| 출력 | 문자열 → 파싱·검증 필요 | **타입이 정해진 값** (스키마를 항상 지킴) |
| 생성 방식 | 토큰을 하나씩 순차 생성 | 병렬 샘플러로 한 번에 생성 |
| 학습 | RLHF / RLVR | **RLCD** (Reinforcement Learning for Calibrated Decisions) |
| 속도·비용 (회사 주장) | 수 초 ~ 수십 초 | 호출당 70~500ms, 입력 100만 토큰당 $0.042, 출력 무료 |
| 맞지 않는 일 | — | 채팅, 코드 생성 같은 자유 텍스트 작업 |

- **System One**이라는 이름은 카너먼의 System 1(빠르고 직관적인 사고)에서, **Jev**라는 이름은 경제학자 제번스(Jevons)의 "효율이 오르면 수요가 오히려 늘어난다"는 역설에서 따왔다.
- 회사의 비유: **"프런티어급 지능을 가진 함수 호출"**. 코드 안의 `if` 조건을 사람이 규칙으로 적는 대신 Jev에게 묻는다.
- 위 성능 수치는 모두 TypeSafe AI의 자체 발표이며, 독립 검증된 값이 아니다.

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 준비 | 얼리 액세스 신청, API 키 발급, `typesafe-sdk` 설치 |
| 연결 확인 | `00_check_setup.py` — 키·SDK·네트워크 확인 |
| Choice | `01_hello_choice.py` — 문의 하나를 담당 팀으로 분류 |
| Choice + Score + Noul | `02_three_questions.py` — 공식 Quickstart 예제 재현 (결과를 문서와 비교) |
| 신뢰도 분기 | `03_smart_if.py` — 확률 기준으로 자동 처리 / 사람 검토 / 긴급 처리 분기 |
| Raw HTTP (선택) | PowerShell `Invoke-RestMethod`로 SDK 없이 API 직접 호출 |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념 설명과 1~7단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 명령어와 예상 출력만 모은 실행용 요약
- [ticket-router/](ticket-router/) — 실습 코드 (Python 3.10 이상, 의존성은 `typesafe-sdk` 하나)

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (이 모듈에서는 다루지 않음)
- [ ] 자동화 — 스킬·서브에이전트 (이 모듈에서는 다루지 않음)
- [x] 샘플 — SAMPLE.md 실행 스텝 + `ticket-router/` 예제 코드

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

> **주의:** Jev는 2026년 11월 현재 **얼리 액세스**다. 대기 목록 승인을 받아 API 키가 있어야 예제를 실행할 수 있다. 예제 코드는 공식 문서(docs.typesafe.ai)의 API를 기준으로 작성했고 문법 검사만 했으며, 실제 키로 실행해 검증하지는 못했다. 수업에 쓰기 전에 한 번 실행해 보고 출력 예시를 갱신할 것.

## 기준 버전

- 모델: `jev-latest` (문서 예시 응답의 실제 버전: `jev-1.14.0`)
- SDK: `typesafe-sdk` (Python), 문서 확인일 2026-11-25

## 참고 링크

- 소개 글: https://typesafe.ai/blog/introducing-system-one-models-and-jev
- 공식 문서: https://docs.typesafe.ai (Quickstart: `/introduction/quickstart`, 신뢰도: `/confidence`, API: `/api`)
- 콘솔 (API 키 발급): https://console.typesafe.ai
- 평가 결과: https://evals.typesafe.ai
- LLM으로 같은 인터페이스를 흉내 내는 어댑터 (비교용, Jev 아님): https://github.com/typesafe-ai/system-one-adapter-python
