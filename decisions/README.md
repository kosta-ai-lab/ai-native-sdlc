# 결정 기록 (ADR — Architecture Decision Records)

> 중요한 결정을 "왜 그렇게 정했는지"와 함께 한 파일씩 누적한다. 시간이 지나 사람이 바뀌어도 결정의 맥락이 남는다. 기존 결정은 지우지 않고, 바뀌면 새 ADR로 대체(supersede)한다.

## 양식

```
# ADR NNNN — 제목
- 상태: Proposed | Accepted | Superseded(→ ADR MMMM)
- 날짜: YYYY-MM-DD

## 맥락        무엇을 정해야 했나, 어떤 제약이 있었나
## 결정        무엇으로 정했나
## 근거        왜 그렇게 정했나 (대안과 비교)
## 결과        이 결정으로 무엇이 따라오나 (장점·비용)
```

## 기록된 결정

| # | 제목 | 상태 |
|---|------|------|
| [0001](0001-platform-claude-code.md) | 플랫폼을 Claude Code로 통일 | Accepted |
| [0002](0002-open-core-private-start.md) | 오픈코어 + 비공개 인큐베이션으로 시작 | Accepted |
| [0003](0003-spec-first-implementation-as-extension.md) | 명세 우선, 구현은 확장으로 | Accepted |

> 새 결정은 위 양식으로 `decisions/NNNN-제목.md`를 추가하고 이 표에 등재한다. 프로젝트 전반에 영향을 주는 결정은 보통 RFC를 거쳐 ADR로 남는다.
