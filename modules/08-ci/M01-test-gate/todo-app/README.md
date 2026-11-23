# todo-app — 모듈 08 단원 M01의 실습 출발점

[모듈 06 단원 M02](../../../06-coding-tdd/M02-tdd-rules/README.md)를 마친 상태입니다. 인수조건 네 개가 모두 구현되어 있고 테스트 네 개가 통과합니다.

| 파일 | 내용 |
|---|---|
| `docs/05-acceptance.feature` | 인수조건 네 개 |
| `test/todo.test.ts` | 네 시나리오의 테스트 |
| `src/todo.ts` | 네 시나리오의 구현 |

이 폴더를 강의 자료 저장소 밖으로 복사해서 씁니다.

```bash
pnpm install --frozen-lockfile
pnpm test        # Tests  4 passed (4)
pnpm typecheck   # 오류 없이 끝난다
```
