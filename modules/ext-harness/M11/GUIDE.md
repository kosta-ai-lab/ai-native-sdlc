# 개념

Ralph는 **PRD(Product Requirements Document, 요구사항 문서)** 에 적힌 작업 목록을 하나씩 꺼내서, AI 코딩 툴(Amp 또는 Claude Code)에게 "이 작업 하나만 구현해"라고 시키고, 성공하면 커밋하고 다음 작업으로 넘어가는 걸 **모든 작업이 끝날 때까지 반복**하는 셸 스크립트 루프입니다.

핵심 아이디어는 이렇습니다.

- 매 반복(iteration)마다 **완전히 새로운 AI 인스턴스**가 실행됩니다 (이전 대화 맥락을 기억하지 못함).
- 대신 다음 세 가지로 "기억"을 이어갑니다.
  - `git` 커밋 히스토리
  - `progress.txt` (이전 반복에서 배운 점 기록)
  - `prd.json` (어떤 작업이 끝났는지 `passes: true/false`로 표시)
- 모든 작업이 `passes: true`가 되면 루프가 자동으로 멈춥니다.

이 튜토리얼에서는 아주 작은 예제(간단한 CLI 계산기에 기능 하나 추가하기)로 전체 흐름을 직접 경험해봅니다.

# 0단계: 사전 준비

다음이 미리 설치·인증되어 있어야 합니다.

| 항목 | 확인 방법 | 설치 방법 (macOS 기준) |
|---|---|---|
| Git | `git --version` | `brew install git` |
| jq (JSON 처리 도구) | `jq --version` | `brew install jq` |
| Claude Code CLI | `claude --version` | `npm install -g @anthropic-ai/claude-code` 후 `claude` 실행해 로그인 |

> 이 가이드는 Ralph가 지원하는 두 가지 AI 툴(Amp, Claude Code) 중 **Claude Code**를 기준으로 설명합니다. Amp를 쓰고 싶다면 뒤에서 명령어만 바꿔주면 됩니다.

# 1 단계: 예제 프로젝트 만들기

Ralph는 "이미 git 저장소인 프로젝트" 안에서 동작합니다. 연습용으로 아주 단순한 Node.js CLI 계산기를 하나 만들어 보겠습니다.

```bash
mkdir ralph-demo-calculator
cd ralph-demo-calculator
git init

cat > calc.js << 'EOF'
function add(a, b) {
  return a + b;
}

module.exports = { add };
EOF

cat > package.json << 'EOF'
{
  "name": "ralph-demo-calculator",
  "version": "1.0.0",
  "main": "calc.js",
  "scripts": {
    "test": "node test.js"
  }
}
EOF

cat > test.js << 'EOF'
const { add } = require('./calc');
console.assert(add(2, 3) === 5, 'add(2,3) should be 5');
console.log('All tests passed!');
EOF

git add .
git commit -m "Initial commit: simple calculator with add()"
```

지금 이 프로젝트에는 `add()` 함수 하나만 있습니다. 목표는 **Ralph를 시켜서 `subtract()` 함수를 자동으로 추가하고, 테스트까지 통과시키는 것**입니다. 일부러 아주 작은 작업으로 잡았습니다 — Ralph 공식 문서에서도 "PRD 항목은 한 번의 context window 안에 끝낼 수 있을 만큼 작아야 한다"고 강조합니다.

## 체크리스트
[ ] "git 저장소인 프로젝트"를 만들었는지 확인한다.

# 2 단계: Ralph 파일을 프로젝트에 복사하기

Ralph 저장소를 클론한 뒤, 필요한 파일만 내 프로젝트로 복사합니다.

```bash
# 별도 위치에 ralph 저장소를 클론
git clone https://github.com/snarktank/ralph.git /tmp/ralph

# 방금 만든 프로젝트로 돌아와서
cd ~/ralph-demo-calculator
mkdir -p scripts/ralph
cp /tmp/ralph/ralph.sh scripts/ralph/
cp /tmp/ralph/CLAUDE.md scripts/ralph/CLAUDE.md   # Claude Code용 프롬프트 템플릿

chmod +x scripts/ralph/ralph.sh
```

## 규칙
- `ralph.sh` : 반복 루프를 실제로 돌리는 셸 스크립트
- `CLAUDE.md` : Claude Code에게 매 반복마다 전달되는 지시사항 템플릿

## 체크리스트
[ ] 생성한 깃 프로젝트에서 ralph.sh를 실행할 수 있는지를 확인한다.

# 3 단계: PRD(작업 목록) 만들기

Ralph는 `prd.json`이라는 파일에서 "할 일 목록"을 읽습니다. 예제이므로 이번엔 스킬을 쓰지 않고 손으로 직접 작성해보겠습니다 (실제 프로젝트에서는 저장소의 `skills/prd`, `skills/ralph` 스킬을 사용해 PRD 작성 → JSON 변환을 자동화할 수 있습니다).

`prd.json` 파일을 프로젝트 루트에 만듭니다.

```bash
cat > prd.json << 'EOF'
{
  "branchName": "add-subtract-function",
  "userStories": [
    {
      "id": "1",
      "title": "Add subtract function",
      "description": "calc.js에 subtract(a, b) 함수를 추가한다. a에서 b를 뺀 값을 반환해야 한다. module.exports에도 포함시킨다.",
      "acceptanceCriteria": [
        "subtract(5, 3) 은 2를 반환한다",
        "test.js에 subtract 테스트 케이스를 추가하고 통과해야 한다",
        "npm test 실행 시 에러 없이 통과해야 한다"
      ],
      "passes": false,
      "priority": 1
    }
  ]
}
EOF
```

## 규칙
> 실제 프로젝트에서는 `prd.json.example` 파일(Ralph 저장소에 포함되어 있음)을 참고해서 형식을 맞추면 됩니다.

## 체크리스트
[ ] `prd.json` 파일을 프로젝트 루트에 있는지 확인한다.


# 4 단계: 

이제 실제로 루프를 돌립니다. 

```bash
./scripts/ralph/ralph.sh --tool claude 3
```

- `--tool claude` : Claude Code를 AI 엔진으로 사용
- `3` : 최대 3번까지만 반복 (기본값은 10)

실행하면 내부적으로 다음이 반복됩니다.

1. `prd.json`의 `branchName`으로 새 git 브랜치 생성
2. `passes: false`인 항목 중 우선순위가 가장 높은 것 선택 (여기선 subtract 함수)
3. Claude Code 인스턴스를 새로 띄워 해당 작업만 구현하도록 지시
4. 타입체크/테스트 등 품질 검사 실행 (`npm test`)
5. 통과하면 자동으로 git 커밋
6. `prd.json`에서 해당 항목을 `passes: true`로 변경
7. `progress.txt`에 배운 점 기록
8. 모든 항목이 끝났으면 `<promise>COMPLETE</promise>`를 출력하고 종료

## 규칙
작업이 1개뿐이므로 최대 반복 횟수를 작게 줘도 충분합니다.

## 체크리스트
[ ] `<promise>COMPLETE</promise>`이 나왔는지 확인한다.

# 5 단계: 결과 확인하기

루프가 끝나면 실제로 무엇이 바뀌었는지 확인해봅니다.

```bash
# 작업이 완료로 표시됐는지 확인
cat prd.json | jq '.userStories[] | {id, title, passes}'

# 커밋 히스토리 확인
git log --oneline -5

# 실제 코드 변경 확인
cat calc.js

# 이전 반복에서 남긴 학습 기록 확인
cat progress.txt

# 테스트가 실제로 통과하는지 재확인
npm test
```

## 체크리스트
[ ] `calc.js`에 `subtract` 함수가 추가되어 있고, `test.js`에도 테스트가 추가되어 있으며, `npm test`가 정상적으로 통과하면 성공입니다.


# 6 단계: 다음 단계로

작은 예제를 성공적으로 돌려봤다면, 다음을 시도해볼 수 있습니다.

- 저장소의 `skills/prd` 스킬을 설치해서 PRD 문서 작성 자체를 AI에게 맡기기
  ```bash
  cp -r /tmp/ralph/skills/prd ~/.claude/skills/
  cp -r /tmp/ralph/skills/ralph ~/.claude/skills/
  ```
- `prd.json`에 여러 개의 작업(user story)을 추가해서, Ralph가 우선순위 순서대로 여러 작업을 자동으로 처리하게 해보기
- **각 작업은 반드시 작게 쪼개기** — "대시보드 전체 만들기"처럼 크고 모호한 작업이 아니라, "리스트에 필터 드롭다운 추가" 같은 한 번에 끝낼 수 있는 작업 단위로 나누는 것이 Ralph를 성공적으로 쓰는 핵심입니다.

## 체크리스트
[ ] 여러개를 쪼개서 실행가능한지 확인한다.

# 자주 겪는 문제 (트러블슈팅)

| 증상 | 원인/해결 |
|---|---|
| `jq: command not found` | `brew install jq` (또는 리눅스는 `apt install jq`) |
| Ralph가 계속 반복해도 `passes`가 `false`로 남음 | `acceptanceCriteria`가 모호할 수 있습니다. 더 구체적인 문장으로 다시 작성해보세요 |
| 테스트/타입체크 명령이 프로젝트와 안 맞음 | `scripts/ralph/CLAUDE.md`를 열어 프로젝트에 맞는 품질 검사 명령(`npm test` 등)을 명시해주세요 |
| 루프가 중간에 멈춤 | `progress.txt`를 확인하면 마지막 반복이 무엇을 했는지 알 수 있습니다 |
