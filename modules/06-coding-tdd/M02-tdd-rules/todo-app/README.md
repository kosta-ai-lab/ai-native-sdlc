# todo-app — 단원 M02와 M03의 실습 출발점

단원 M01을 마친 상태에 인수조건 두 개를 더한 출발점이다.

| 파일 | 내용 |
|---|---|
| `docs/05-acceptance.feature` | 인수조건 네 개. 앞의 두 개는 구현되어 있고, 뒤의 두 개(앞뒤 공백 제거, 공백만 있는 제목 거부)는 아직 구현되지 않았다 |
| `test/todo.test.ts` | 앞의 두 시나리오의 테스트 |
| `src/todo.ts` | 앞의 두 시나리오의 구현 |

이 폴더를 강의 자료 저장소 밖으로 복사해서 쓴다.

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test        # Tests  2 passed (2)
```
