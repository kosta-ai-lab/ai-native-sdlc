# todo-app — 단원 M01의 실습 출발점

할 일 생성 기능을 TDD로 만들기 위한 출발점이다. 인수조건만 있고 테스트와 구현은 없다.

| 파일 | 내용 |
|---|---|
| `docs/05-acceptance.feature` | 할 일 생성의 인수조건 두 개 (Gherkin 한국어 키워드) |
| `package.json` | `pnpm test`(Vitest), `pnpm typecheck`(tsc) |
| `tsconfig.json` | `src`, `test` 폴더를 검사한다 |

이 폴더를 강의 자료 저장소 밖으로 복사해서 쓴다. 순서는 [GUIDE.md](../GUIDE.md)를 따른다.

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test        # 아직 테스트가 없어 "No test files found"가 나온다
```
