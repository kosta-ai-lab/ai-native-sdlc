# 모듈 — — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

이 튜토리얼은 GitHub의 `loop-engineering` 저장소를 기반으로, AI 코딩 에이전트(Claude Code, Grok, Codex 등)를 "매번 프롬프트로 지시하는 방식"이 아니라 **"에이전트를 반복적으로 실행시키는 시스템(루프)"** 로 설계하는 방법을 따라 할 수 있게 정리한다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — 루프 엔지니어링 실행 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (이 단계에서 AI가 지킬 규칙)
- [ ] 자동화 — 없음
- [x] 샘플 — 루프 엔지니어링 5분만에 해보기

## 샘플과 가이드를 실횅한 다음 단계

| 시점 | 할 일 |
|---|---|
| 1주차 마지막 | `loop audit . --suggest` 재실행 → L1(점수 40+대) 목표 |
| 2주차 | 검증(verifier) 스킬 추가, 워크트리에서 보조 수정(L2) 한 번 시도 |
| 무인 실행(L3) 전 | `loop-budget.md`, `loop-run-log.md` 채우기 + `LOOP.md`에 휴먼 게이트 명시 + 검증된 실행 이력 확보 |
| 패턴 선택이 고민될 때 | [pattern-picker.md](https://github.com/cobusgreyling/loop-engineering/blob/main/docs/pattern-picker.md), [loop-design-checklist.md](https://github.com/cobusgreyling/loop-engineering/blob/main/docs/loop-design-checklist.md) 참고 |
| 뭔가 잘못됐을 때 | [failure-modes.md](https://github.com/cobusgreyling/loop-engineering/blob/main/docs/failure-modes.md), [stories/](https://github.com/cobusgreyling/loop-engineering/blob/main/stories) 참고 |

## 안전 관련 유의사항 (반드시 읽기)
루프 엔지니어링은 여러분의 판단력을 "증폭"시킵니다. 좋은 판단도, 나쁜 판단도 그대로 확대됩니다.

- **토큰 비용이 폭증할 수 있습니다.** 서브에이전트와 장시간 루프를 쓸수록 비용이 커집니다.
- **검증은 여전히 사람의 몫입니다.** 무인(unattended) 루프는 무인 상태로 실수도 저지릅니다.
- **이해 부채(comprehension debt)** 가 빠르게 쌓입니다 — 루프가 만든 결과물을 읽지 않으면 무슨 일이 벌어졌는지 모르게 됩니다.
- 같은 루프를 두 사람이 돌려도 정반대 결과가 나올 수 있습니다. 루프는 그 차이를 모릅니다. **여러분이 알아야 합니다.**

> "Build the loop. But build it like someone who intends to stay the engineer, not just the person who presses go." — Addy Osmani

## 참고 자료

- 원본 저장소: [github.com/cobusgreyling/loop-engineering](https://github.com/cobusgreyling/loop-engineering)
- 공식 5분 퀵스타트: [docs/QUICKSTART.md](https://github.com/cobusgreyling/loop-engineering/blob/main/docs/QUICKSTART.md)
- 개념 원문 에세이: [Cobus Greyling – Loop Engineering (Substack)](https://cobusgreyling.substack.com/p/loop-engineering)
- [Addy Osmani – Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- 인터랙티브 패턴 선택기: [쇼케이스 사이트](https://cobusgreyling.github.io/loop-engineering/#interactive)
