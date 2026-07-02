# 04 SDD 명세 — 할 일 생성

> 모듈 04(명세 기반 설계)의 산출물입니다. 03 요구사항(R-01~R-03)을 실행 가능한 명세로 구체화하며, 05 BDD의 입력이 됩니다.

## 데이터 모델

```
Todo {
  title: string                      // 할 일 제목 (필수, 비어 있을 수 없음)
  status: "할 일" | "진행" | "완료"   // 초기값 "할 일"
}
```

## 함수 명세

```
createTodo(input: { title: string }): Todo
```

- 입력: title (문자열)
- 출력: Todo 객체 (status는 "할 일")
- 규칙:
  - title이 빈 문자열이면 Error("제목은 필수")를 던집니다. (R-03)
  - 생성된 Todo의 status는 "할 일"입니다. (R-02)
  - 명세에 없는 필드는 추가하지 않습니다.

## 추적성

| 요구사항 | 명세 반영 |
|---------|----------|
| R-01 | createTodo가 title로 Todo를 생성 |
| R-02 | status 초기값 "할 일" |
| R-03 | 빈 title에 Error 발생 |

## 다음 단계

05 BDD에서 이 명세를 Given·When·Then 인수 조건으로 옮깁니다.
