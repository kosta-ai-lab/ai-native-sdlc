# RFC 프로세스 — 방법론을 함께 바꾸는 방법

> 방법론·단계·산출물 양식 등 **프로젝트 전반에 영향을 주는 변경**은 코드(또는 명세)를 바꾸기 전에 RFC로 제안하고 합의한다. Rust·React·Kubernetes(KEP)·Python(PEP)에서 검증된 방식이다.

## 언제 RFC가 필요한가

- 새 단계·새 산출물 타입을 추가하거나 라이프사이클을 바꿀 때
- 참조 방법론 카탈로그의 양식·구조를 바꿀 때
- 거버넌스·기여 규칙·공개 정책을 바꿀 때

> 오타 수정, 한 방법론 카드 채우기 같은 작은 변경은 RFC 없이 바로 PR.

## 상태머신

```
Draft  →  Proposed  →  Accepted   →  Implemented
                    ↘  Rejected
   (구현 후 대체되면)  →  Deprecated / Superseded
```

| 상태 | 의미 |
|------|------|
| Draft | 초안. 작성 중, 이른 피드백 수집 |
| Proposed | 정식 제안. 멤버와 합의 진행 |
| Accepted | 합의됨. 구현 대기 |
| Rejected | 채택하지 않음(사유 기록) |
| Implemented | 명세·자산에 반영 완료 |
| Deprecated | 이후 RFC로 대체됨 |

## 절차

1. `rfcs/0000-template.md`를 복사해 `rfcs/NNNN-제목.md`로 작성(번호는 PR 번호 사용 권장).
2. PR을 올린다(상태: Draft 또는 Proposed).
3. 멤버가 토론한다. 작성자는 피드백을 반영해 수정한다.
4. 주요 쟁점이 정리되면, 메인테이너가 잠정 Accepted/Rejected를 표시하고 **최종 코멘트 기간**을 둔다.
5. 합의되면 머지하고, 구현 후 상태를 Implemented로 바꾼다.

> 원칙: RFC는 허락 요청이 아니다. 로드맵을 따르며, 결정의 **근거와 대안**을 기록해 모두가 보게 한다.

## 참고 (배운 곳)

- Rust RFCs, React RFCs, Kubernetes Enhancements(KEP), Python PEP, TC39 proposals
