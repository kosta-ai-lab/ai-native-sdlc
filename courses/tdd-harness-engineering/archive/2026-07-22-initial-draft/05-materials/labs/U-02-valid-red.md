# 실습 — 세 개의 빨간 결과

## 목표

세 테스트 실행 사례를 보고 유효한 Red인지 판정한다. 빨간색 출력이나 exit code만 보지 않고 실행 가능성, 관찰 타당성과 원인 일치를 근거로 사용한다.

## 예상 시간

개인 판정 8분, 짝 토론 5분, 전체 피드백 7분이다.

## 제출 형식

각 사례에 다음 네 항목을 작성한다.

```text
판정:
실행 가능성:
관찰 타당성:
원인 일치:
다음 행동:
```

## 사례 A

테스트 코드는 공백 제목을 거부하는 행동을 검사한다.

```typescript
it('rejects a blank title', () => {
  expect(() => createTodo('   ')).toThrow('TITLE_REQUIRED');
});
```

실행 결과:

```text
FAIL tests/todo.test.ts
Error: Cannot find module '../src/todo-service'
Tests: no tests
Process exited with code 1
```

## 사례 B

```typescript
it('rejects a blank title', () => {
  expect(() => createTodo('   ')).toThrow('TITLE_REQUIRED');
});
```

실행 결과:

```text
FAIL tests/todo.test.ts > rejects a blank title
AssertionError: expected function to throw an error
Tests: 1 failed
Process exited with code 1
```

구현에는 아직 제목 검증이 없다.

## 사례 C

```typescript
it('rejects a blank title', () => {
  expect(() => createTodo('   ')).toThrow();
});
```

실행 결과:

```text
PASS tests/todo.test.ts > rejects a blank title
Tests: 1 passed
Process exited with code 0
```

기존 구현은 모든 입력에서 `NETWORK_ERROR`를 던지고 있다.

## 완료 기준

- A를 `INVALID_EXECUTION_ERROR`로 판정한다.
- B를 `VALID_RED`로 판정한다.
- C를 `INVALID_ALREADY_GREEN`으로 판정하고 assertion이 원하는 오류를 관찰하지 못한다고 설명한다.
- 각 유효하지 않은 사례의 다음 행동을 제안한다.

## 강사용 해설

### A

테스트가 대상 코드까지 도달하지 못했다. 모듈 경로 또는 최소 골격을 바로잡은 뒤 assertion failure가 나올 때까지 다시 실행해야 한다.

### B

테스트가 실행됐고 원하는 오류가 발생하지 않아 예상한 assertion이 실패했다. 구현에 제목 검증이 없다는 관찰과도 일치하므로 유효한 Red다.

### C

초록이지만 원하는 행동을 증명하지 않는다. 오류 종류를 확인하지 않는 약한 assertion이 무관한 `NETWORK_ERROR`를 성공으로 받아들였다. `toThrow('TITLE_REQUIRED')`처럼 관찰을 강화한 뒤 다시 실행해야 한다.

## 실습 한계

이 실습은 로그 판정 능력을 평가한다. 실제 test-first 순서를 수행하거나 completion gate를 구현하는 능력은 후속 학습경험에서 별도로 평가해야 한다.
