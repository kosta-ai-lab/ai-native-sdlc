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

- 회사의 비유: **"프런티어급 지능을 가진 함수 호출"**. 코드 안의 `if` 조건을 사람이 규칙으로 적는 대신 Jev에게 묻는다.
- 위 성능 수치는 모두 TypeSafe AI의 자체 발표이며, 독립 검증된 값이 아니다.

## 왜 Jev인가 — LLM으로 판단할 때 생기는 3가지 문제

| 문제 | LLM에서의 증상 | Jev의 접근 |
|---|---|---|
| **1. 출력 형식이 흔들린다** | `"billing"`을 기대했는데 `"Billing team."`이나 긴 설명이 옴 → 파싱·검증 코드가 필요 | 선택지 중 하나만 나옴. **스키마를 항상 지킴** |
| **2. 얼마나 확실한지 모른다** | 틀려도 자신 있게 답함 | 모든 답에 **확률과 신뢰도**가 붙음 → 애매하면 사람에게 넘길 수 있음 |
| **3. 느리고 비싸다** | 판단 하나에 수 초, 출력 토큰 비용 | 호출당 70~500ms, 출력 무료 (회사 발표 수치) |

반대로 **채팅, 글쓰기, 코드 생성**처럼 자유로운 문장이 필요한 일에는 Jev를 쓸 수 없습니다. Jev는 LLM을 대체하는 게 아니라, 워크플로 안의 **"판단 단계"**를 맡는 도구입니다.

## 핵심 개념 5가지

### 1. System One (시스템 1)
심리학자 카너먼이 말한 두 가지 사고 방식에서 따온 이름입니다. **System 1**은 빠르고 직관적인 판단, **System 2**는 느리고 신중한 추론입니다. LLM의 긴 추론(chain-of-thought)이 System 2라면, Jev는 빠른 판단을 맡는 System 1입니다. 회사는 System 1도 **잘 보정(calibrated)**하면 믿을 만하게 만들 수 있다고 주장합니다.
**Jev**라는 이름은 경제학자 제번스(Jevons)에서 왔습니다. 증기기관이 효율적이 되자 석탄 사용량이 오히려 늘었듯, 판단 비용이 아주 싸지면 쓰임새가 폭발적으로 늘어난다는 뜻입니다.

### 2. State (상태)와 Question (질문)
Jev 호출은 딱 두 가지로 이루어집니다.
- **`state`**: Jev가 보고 판단할 입력입니다. 문자열, JSON 객체(dict), 배열(list) 모두 됩니다.
- **`questions`**: 묻고 싶은 질문들입니다. `{"내가 붙인 이름": 질문}` 형태의 dict이고, **여러 질문을 한 번에 보내면 병렬로 평가**됩니다. 결과도 내가 붙인 이름으로 꺼냅니다.

### 3. 질문의 종류 (Primitive)

| 종류 | 무엇을 묻나 | 입력 | 결과 필드 |
|---|---|---|---|
| **Choice** | 선택지 중 하나 고르기 | `criteria={"이름": "설명", ...}` (1~255개) | `choice`, `probabilities`, `confidence` |
| **Score** | 기준표의 몇 단계쯤인가 | `criteria=["0단계 설명", "1단계 설명", ...]` (최대 10단계) | `score`, `probabilities`, `confidence`, `legend` |
| **Noul** | 이 문장이 참인가 | `instructions="...문장..."` | `noul` (참일 확률 0~1) |
| **Box** | 이미지 속 위치 | 이미지 (이 모듈에서는 다루지 않음) | `box`, `confidence` |

> **Score 값은 0~1이 아닙니다.** 단계 번호(0, 1, 2, ...)를 확률로 가중 평균한 값이라 `0 ~ (단계 수 - 1)` 범위입니다. 3단계 기준표에서 `0.59`는 "0단계와 1단계 사이, 1단계에 가까움"이라는 뜻입니다. 0~1로 바꾸려면 `score / (단계 수 - 1)`로 나눕니다.

### 4. Probability (확률)와 Confidence (신뢰도)
- **probabilities**: 선택지(또는 단계)별 확률입니다. 합이 1입니다.
- **confidence**: 확률이 한쪽에 몰려 있으면 1, 고르게 퍼져 있으면 0인 값입니다. Choice의 경우 `(가장 큰 확률 - 1/n) / (1 - 1/n)`로 계산합니다 (n = 선택지 수).
- **Noul에는 confidence가 없습니다.** `noul` 값 자체가 "참일 확률"입니다.
- Jev는 **RLCD**(보정된 결정을 위한 강화학습)로 학습해서, "확률 0.9라고 답한 것들은 실제로 약 90% 맞도록" 맞췄다고 합니다. 그래서 확률을 **기준값(threshold)으로 바로 비교**해서 쓸 수 있습니다.

### 5. 똑똑한 if문 (Smart if-statement)
Jev를 쓰는 기본 패턴입니다. 사람이 키워드 규칙(`if "환불" in text`)을 적는 대신 Jev에게 묻고, **확률이 높으면 자동 처리, 애매하면 사람에게** 넘깁니다.

```python
if 팀_확률 >= 0.67:
    자동_배정(팀)
else:
    사람이_검토()
```

## 이 모듈의 흐름 (GUIDE.md 1~7단계)

```
1 준비하기 ─▶ 2 설치하기 ─▶ 3 키 등록·연결 확인 ─▶ 4 첫 질문(Choice)
                                                          │
        7 (선택) Raw HTTP로 직접 호출 ◀─ 6 똑똑한 if문 ◀─ 5 질문 3종(Choice·Score·Noul)
```

| 단계 | 파일 | 배우는 것 |
|---|---|---|
| 1 | — | 얼리 액세스, API 키, Python 확인 |
| 2 | `requirements.txt` | 가상환경과 SDK 설치 |
| 3 | `00_check_setup.py` | 키·SDK·서버 접속 확인 |
| 4 | `01_hello_choice.py` | `state` + `questions` 구조, Choice 결과 읽기 |
| 5 | `02_three_questions.py` | Choice·Score·Noul, Score 값의 범위 |
| 6 | `03_smart_if.py`, `tickets.json` | 확률·신뢰도로 분기하기 |
| 7 | — | SDK 없이 HTTP로 호출, JSON 응답 구조 |

## 문서 구성

- README.md (이 문서) — Jev 개념 설명과 모듈 전체 흐름
- [GUIDE.md](GUIDE.md) — 용어 요약 후 바로 1~7단계 따라하기 (단계별 규칙·산출물·체크리스트)
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
