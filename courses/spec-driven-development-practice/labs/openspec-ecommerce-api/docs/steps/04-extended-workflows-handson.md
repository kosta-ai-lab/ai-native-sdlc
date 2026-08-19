# 확장 워크플로우 실습 (new · continue · sync · bulk-archive)

기본 사이클(propose→apply→verify→archive)은 change 3개로 실증했다. 여기서는 확장 워크플로우를 **언제·어떻게** 쓰는지 실제 CLI 시퀀스로 정리하고, `sync`를 실제로 실증한다.

## new + continue — 단계별 상의형 개발
`propose`가 artifact를 한 번에 만드는 것과 달리, `new`는 change 폴더만 만들고 `continue`(슬래시)로 artifact를 하나씩 만든다.
```bash
openspec new change "add-search"                 # change 폴더만 생성
openspec status --change add-search --json       # proposal이 ready
openspec instructions proposal --change add-search --json   # 첫 artifact 지침
# proposal 작성 → status 재확인 → 다음 artifact(specs) 지침 → …
```
**언제**: 복잡한 기능, 각 artifact를 사람이 검토·상의하며 진행하고 싶을 때. (단순·빠름은 `propose`/`ff`.)

## sync — archive 없이 main spec 병합 (실증)
`archive`는 change를 `archive/`로 옮기며 병합하지만, `sync`는 **delta만 main spec에 반영하고 change 폴더는 활성으로 남긴다.**
```bash
# (구현 완료 후)
openspec sync <change>     # delta → openspec/specs/ 병합, change는 유지
```
**언제**: 여러 change를 병렬로 개발하며 완성분만 **점진적으로** main spec에 반영하고 싶을 때. 아직 change를 닫고 싶지 않을 때.

## bulk-archive — 여러 change 일괄 + 충돌 해결
```bash
openspec bulk-archive
```
여러 change가 같은 capability의 spec을 수정하면, **코드베이스를 조사해 실제 구현된 것만 병합**하고 충돌을 안내한다(시간순, 하나만 구현 시 그것만).

## explore — 구현 전 탐색
`/opsx:explore`는 코드·artifact 없이 문제 공간을 탐색한다(stance, not workflow). 결정이 서면 change를 제안한다.

## 이 교재의 실증 범위
| 실증 완료 | 문서화(다음 실행) |
|---|---|
| propose→apply→verify→archive ×3 | new+continue 단계별 |
| MODIFIED delta + archive sync | sync(병렬 점진 반영) |
| validate --strict, status/instructions | bulk-archive(충돌 해결) |

## Spec Kit과의 대비 (확장 관점)
- OpenSpec: `sync`/`bulk-archive`로 **여러 델타를 하나의 living spec에 병합·충돌 해결**.
- Spec Kit: feature 폴더가 독립이라 병합 개념이 없고, `/speckit.analyze`로 **교차 일관성**을 점검한다.
