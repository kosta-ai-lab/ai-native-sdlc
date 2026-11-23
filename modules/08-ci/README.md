# 모듈 08 — CI 테스트 게이트

> 상태: 단원 1개 초안 · 담당: 윤성열·최성웅
> 한 줄: **테스트를 PR마다 다시 실행하고, 통과하지 못한 변경은 병합하지 않는다.**

## 목적

[모듈 06](../06-coding-tdd/README.md)에서 만든 테스트는 로컬에서 실행됩니다. 이 모듈은 같은 테스트를 PR마다 깨끗한 환경에서 다시 실행하고, 그 통과를 병합의 조건으로 겁니다. AI가 만든 변경도 사람의 변경과 같은 관문을 지나게 합니다.

## 단원 구성

| 단원 | 내용 | 만드는 것 | 만든 사람 |
|---|---|---|---|
| [M01 — 테스트를 PR의 관문으로 걸기](M01-test-gate/) | GitHub Actions 워크플로를 쓰고, PR에서 검사를 확인하고, 일부러 실패시켜 본 뒤 필수 검사로 지정합니다 | `.github/workflows/test.yml` | 윤성열 |

## 입력과 다음 단계

- 입력: [모듈 06](../06-coding-tdd/README.md)의 테스트와 구현
- 다음 단계: [모듈 09(CD·아키텍처 검증)](../09-cd-architecture/README.md)

## 산출물 4종 (체크리스트)

- [x] 가이드 — [M01의 GUIDE.md](M01-test-gate/GUIDE.md)
- [ ] 규칙 — 아직 없습니다.
- [x] 자동화 — [워크플로 완성본](M01-test-gate/harness/.github/workflows/test.yml)
- [x] 샘플 — [M01의 SAMPLE.md](M01-test-gate/SAMPLE.md)와 [실습 출발점](M01-test-gate/todo-app/)

## 품질 기준

동작하는 샘플이나 재현할 수 있는 프롬프트를 반드시 붙이고, 문서는 따라 하면 되는 수준으로 씁니다.

## 검증 기록

단원 README에 검증 기록이 있습니다. 워크플로는 이 저장소의 PR에서 실제로 실행했습니다(2026-11-24). 이 저장소의 `.github/workflows/practice-examples.yml`은 단원 M01의 예제 폴더나 그 워크플로 파일이 바뀐 PR에서 예제를 검사합니다.
