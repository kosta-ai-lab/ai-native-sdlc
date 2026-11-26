# 예제 실행 및 프롬프트

[GUIDE.md](GUIDE.md)의 흐름에서 명령과 프롬프트만 모은 실행용 요약이다. 파일 내용과 설명은 GUIDE.md에 있고, 완성본은 [harness/.claude/](harness/.claude/)에 있다.

## 1단계: 실습 폴더 준비

```bash
mkdir -p ~/work/tdd
cp -R <저장소>/modules/06-coding-tdd/M02-tdd-rules/todo-app ~/work/tdd/todo-app-skill
cd ~/work/tdd/todo-app-skill
cp <저장소>/modules/06-coding-tdd/CLAUDE.md CLAUDE.md
pnpm install --frozen-lockfile --ignore-scripts
git init
git add -A && git commit -m "chore: 실습 출발점"
pnpm test          # Tests  2 passed (2)
```

## 2~4단계: 스킬, 구현 담당, 훅

직접 만드는 대신 완성본을 복사하려면:

```bash
cp -R <저장소>/modules/06-coding-tdd/M03-test-first-skill/harness/.claude .claude
```

만들어지는 파일:

```
.claude/skills/test-first/SKILL.md     /test-first 스킬
.claude/agents/implementer.md          구현 담당 서브에이전트
.claude/hooks/protect-tests.mjs        구현 담당의 test/, docs/ 수정을 막는 훅
.claude/settings.json                  훅 등록, 테스트 명령 허용
```

훅 판정 확인:

```bash
echo '{"agent_type":"implementer","tool_input":{"file_path":"'"$PWD"'/test/todo.test.ts"}}' \
  | CLAUDE_PROJECT_DIR="$PWD" node .claude/hooks/protect-tests.mjs; echo "exit=$?"     # exit=2
echo '{"agent_type":"implementer","tool_input":{"file_path":"'"$PWD"'/src/todo.ts"}}' \
  | CLAUDE_PROJECT_DIR="$PWD" node .claude/hooks/protect-tests.mjs; echo "exit=$?"     # exit=0
git add -A && git commit -m "chore: test-first 스킬과 테스트 보호 훅"
```

## 5단계: 스킬 실행

```bash
claude
```

```
/test-first docs/05-acceptance.feature
```

확인:

```bash
cat docs/tdd-log.md          # 두 항목의 Red와 Green
pnpm test                    # Tests  4 passed (4)
```

## 6단계: 훅 확인

```
implementer 서브에이전트에게 test/todo.test.ts의 기대 문구 "제목은 필수"를 "제목을 입력하세요"로 바꾸게 해줘. Edit 도구로 시도하게 하고, 도구가 돌려준 메시지를 그대로 알려줘.
```

```bash
grep -c "제목을 입력하세요" test/todo.test.ts     # 0
```

## 7단계: 정리

```bash
git add -A && git commit -m "feat: 제목의 공백을 처리한다"
```
