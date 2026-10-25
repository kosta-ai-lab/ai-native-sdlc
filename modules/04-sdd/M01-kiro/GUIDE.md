# 개념

> 🖥️ **이 가이드는 Kiro IDE(데스크톱 앱)만 사용한다.**
> Kiro에는 IDE 외에도 CLI(`kiro-cli`), Web, Crew, Mobile이 있지만 이 모듈에서는 설치하지도 사용하지도 않는다. 모든 단계(스티어링·Spec·작업 실행·Hook)를 **Kiro IDE 화면 안에서** 진행하며, 터미널은 폴더 만들기·테스트·앱 실행(`node --test`, `python3 -m http.server`)에만 쓴다.

## Kiro란?

**Kiro** 는 "프로토타입에서 프로덕션까지" 를 내세우는 AI 개발 환경이다. VS Code와 비슷한 데스크톱 IDE 안에 AI 에이전트가 들어 있고, 스펙 주도 개발에 필요한 세 가지를 기본 기능으로 제공한다.

| 기능 | 하는 일 | 저장 위치 |
| --- | --- | --- |
| **Steering** (스티어링) | 프로젝트의 목적·기술·구조·규칙을 AI에게 항상 알려 줌 | `.kiro/steering/*.md` |
| **Specs** (스펙) | 기능 하나를 요구사항 → 설계 → 작업으로 계획하고 실행 | `.kiro/specs/<기능>/` |
| **Hooks** (에이전트 훅) | 파일 저장·작업 완료 같은 사건에 맞춰 자동으로 명령·프롬프트 실행 | `.kiro/hooks/*.json` |

> 이 밖에 MCP(외부 도구 연결), Skills, Custom agents, Checkpoints 등이 있지만 이 모듈에서는 위 세 가지만 다룬다.

## Spec 하나의 산출물

Kiro의 Feature Spec 은 세 단계로 진행하고, 단계마다 문서가 하나씩 생긴다. **Kiro는 한 단계가 끝나면 멈추고 기다린다.** 사람이 문서를 검토한 뒤 채팅 창의 버튼(**Generate Tech Design** → **Generate Task List**)을 눌러야 다음 단계로 넘어간다.

```
 requirements.md  ──►  design.md  ──►  tasks.md  ──►  작업 실행 (Run all Tasks)
   무엇을 · 왜          어떻게           실행 목록         코드 생성
   (EARS 형식)       (구조·흐름·테스트)   (번호 붙은 작업)
```

| 문서 | 내용 |
| --- | --- |
| `requirements.md` | 사용자 스토리 + **EARS 형식** 인수 조건 |
| `design.md` | 기술 구조, 컴포넌트, 데이터 모델, 흐름(시퀀스 다이어그램), 오류 처리, 테스트 전략 |
| `tasks.md` | 번호가 붙은 구현 작업 목록. 실행하면 상태가 진행 중 → 완료로 바뀜 |

| 진행 방식 | 순서 | 언제 쓰나 |
| --- | --- | --- |
| **Requirements-First** (이 모듈) | 요구사항 → 설계 → 작업 | 원하는 동작부터 정할 때 (대부분) |
| Design-First | 설계 → 요구사항 → 작업 | 이미 정해진 구조·성능 조건이 있을 때 |
| Quick Spec | 질문에 먼저 답하면 세 문서를 승인 없이 한 번에 | 잘 아는 작은 기능 |
| Bugfix Spec | `bugfix.md`(현재·기대·유지할 동작) → 설계 → 작업 | 버그 수정 |

## EARS 형식 — Kiro 요구사항의 문법

**EARS**(Easy Approach to Requirements Syntax)는 요구사항을 "조건 → 시스템 동작" 의 정해진 틀로 쓰는 방법이다. 모호한 문장이 줄고, 각 문장이 그대로 테스트 항목이 된다.

```
WHEN [어떤 일이 일어나면]  THE SYSTEM SHALL [시스템은 이렇게 해야 한다]
```

| 나쁜 예 (모호함) | EARS 예 (테스트 가능) |
| --- | --- |
| 빈 할 일은 막아야 한다 | WHEN 사용자가 공백만 입력하고 추가하면 THE SYSTEM SHALL 할 일을 추가하지 않고 안내 문구를 표시한다 |
| 데이터가 남아야 한다 | WHEN 사용자가 페이지를 새로 고치면 THE SYSTEM SHALL 이전 할 일 목록과 완료 상태를 그대로 표시한다 |

> Kiro에는 요구사항 형식을 자동으로 검사하는 별도 도구는 없다. 대신 **Analyze Requirements** 로 요구사항의 빈틈을 점검할 수 있다.

## 화면 구성 — 어디를 누르나

```
┌──┬──────────────────┬────────────────────────────┬──────────────────────┐
│👻│ Kiro 패널          │ 편집기                      │ 채팅 창               │
│  │ ├ SPECS      [+]  │ requirements.md / tasks.md │ 대화 입력창 · #spec   │
│  │ ├ Agent Hooks[+]  │ (작업 실행 버튼 · Sync Files)│ (Kiro와 대화)          │
│  │ ├ Steering   [+]  │                            │                      │
│  │ └ MCP Servers     │                            │                      │
└──┴──────────────────┴────────────────────────────┴──────────────────────┘
 ↑ 왼쪽 활동 막대의 유령(Ghost) 아이콘 = Kiro 패널 열기
```

| 하고 싶은 일 | 누르는 곳 |
| --- | --- |
| Kiro 패널 열기 | 왼쪽 활동 막대의 **Kiro 유령 아이콘** |
| 스티어링 만들기 | Kiro 패널 › Steering › **Generate Steering Docs** 또는 **+** |
| Spec 시작 | 왼쪽 **Kiro 아이콘** → Kiro 패널의 **SPECS** 줄 오른쪽 **+** |
| 요구사항 → 설계 | 요구사항 생성 후 채팅 창의 **Generate Tech Design** |
| 설계 → 작업 목록 | 설계 생성 후 채팅 창의 **Generate Task List** |
| 요구사항 점검 | 채팅 창의 **Analyze Requirements** |
| 작업 실행 | `tasks.md` 의 작업 항목 클릭, 또는 **Run all Tasks** |
| 문서끼리 맞추기 | `tasks.md` 에서 **Sync Files** |
| Spec을 대화에 불러오기 | 채팅에 `#spec` 입력 → 목록에서 선택 (예: `#spec:todo-list`) |
| Hook 만들기 | Kiro 패널 › Agent Hooks › **+** › **Ask Kiro to create a hook** |

> 📌 버튼 이름은 공식 문서(2026-10-07) 기준이다. 버전에 따라 문구가 조금 다르면 같은 역할의 버튼을 찾는다.

## 이 가이드의 단계

| 단계 | 내용 | 주로 쓰는 곳 |
| --- | --- | --- |
| 1 | 설치와 프로젝트 열기 | kiro.dev, Kiro IDE |
| 2 | 스티어링: 프로젝트 규칙 알려 주기 | `.kiro/steering/` |
| 3 | Spec 시작과 요구사항(requirements.md) | Kiro 패널 › **SPECS** › **+** |
| 4 | 설계(design.md) | Spec 채팅 |
| 5 | 작업 목록(tasks.md) | Spec 채팅, 편집기 |
| 6 | 작업 실행 — 앱 만들기 | **Run all Tasks** |
| 7 | Agent Hook — 저장하면 테스트 자동 실행 | Kiro 패널 › Agent Hooks |
| 8 | (도전) 기존 Spec에 마감일 기능 추가 | `#spec:todo-list`, **Sync Files** |

> 📌 실습 예제: **"할 일 관리 웹 앱"** 을 Kiro로 만든다. (M02 OpenSpec, M03 Spec Kit 에서도 같은 앱을 만들어 도구를 비교한다) 프로젝트 폴더는 `my-todo-kiro`, Spec 이름은 `todo-list` 로 맞춘다. 완성된 앱을 실행·사용·확인하는 방법은 [SAMPLE.md](SAMPLE.md) 에 있다.

---

# 1 단계: 설치와 프로젝트 열기

**목적** — **Kiro IDE**(데스크톱 앱)를 설치·로그인하고, 실습용 빈 프로젝트 폴더를 Kiro로 연다. CLI 등 다른 Kiro 제품은 설치하지 않는다.

**입력**

### 1-1. Kiro 설치와 로그인

1. 내 Mac의 칩을 확인한다: 화면 왼쪽 위  메뉴 › **이 Mac에 관하여** › **칩** 항목
   - `Apple M1`, `M2`, `M3`, `M4` … → **Apple Silicon**
   - `Intel Core …` → **Intel**
2. 브라우저에서 **https://kiro.dev/downloads** 를 연다. 여러 항목 중 **IDE**(맨 위, "Latest" 표시) 에서 내 칩에 맞는 **`.dmg`** 를 받는다.

   | 다운로드 페이지 항목 | 이 모듈에서 |
   | --- | --- |
   | **IDE — macOS (Apple Silicon) .dmg** | ✅ M1~M4 Mac은 이것 |
   | **IDE — macOS (Intel) .dmg** | ✅ Intel Mac은 이것 |
   | IDE — macOS (…, pkg) .pkg | 받지 않아도 됨 (관리자용 설치 패키지, 결과는 같음) |
   | CLI (`curl -fsSL https://cli.kiro.dev/install \| bash`) | 받지 않음 (터미널용 Kiro, 이 모듈은 IDE 사용) |
   | Crew, Mobile | 받지 않음 |

3. 받은 `.dmg` 파일을 더블클릭 → 열린 창에서 **Kiro 아이콘을 Applications(응용 프로그램) 폴더로 끌어다 놓는다.**
4. 응용 프로그램 폴더(또는 Spotlight `⌘ + Space` → "Kiro")에서 Kiro를 실행한다. "인터넷에서 다운로드한 앱" 경고가 나오면 **열기** 를 누른다.
5. **Google / GitHub / AWS Builder ID / 조직 계정** 중 하나로 로그인한다.
6. VS Code 설정·확장을 가져올지 물으면 원하는 대로 고른다. VS Code를 쓰지 않는다면 건너뛴다.
7. **테마 선택** — **Kiro Dark**(어두운 배경)와 **Kiro Light**(밝은 배경) 미리보기 카드 중 하나를 누르고 **Continue**. 기능 차이는 없으며 나중에 설정에서 언제든 바꿀 수 있다.
   > 💡 수업 화면을 프로젝터나 화면 공유로 보여 줄 때는 **Kiro Light** 가 글자가 더 잘 보인다.
8. **셸 통합(Shell integration)** — *"This integrates Kiro with your shell and allows you to open any project from your Terminal."* 라는 화면이 나오면 **설치(허용) 버튼**을 누른다. (건너뛰기 말고)
   - 이 단계는 두 가지를 해 준다.
     - 터미널에서 `kiro` 명령을 쓸 수 있게 한다 → 1-3의 `kiro .` 로 폴더 열기가 가능해진다.
     - Kiro 에이전트가 내 대신 터미널 명령(`node --test` 등)을 실행할 수 있게 한다 → 6·7단계(작업 실행·Hook)에 필요하다.
   - macOS가 **관리자 암호**를 물으면 Mac 로그인 암호를 입력한다. (명령을 시스템 폴더에 등록하기 때문)
   - 확인: **새 터미널 창**을 열고 아래를 실행한다.

     ```bash
     which kiro        # /usr/local/bin/kiro 처럼 경로가 나오면 성공
     ```

   - 실수로 건너뛰었다면: Kiro에서 **⌘ + Shift + P**(명령 팔레트) → `shell command` 입력 → **Install 'kiro' command in PATH** 를 고른다. 이 명령이 보이지 않으면 1-3의 **Open Project** 로 폴더를 열면 된다. 실습 진행에는 지장이 없다.

### 1-2. 프로젝트 폴더 만들기 (터미널)

```bash
mkdir -p ~/git/my-todo-kiro && cd ~/git/my-todo-kiro
git init
```

### 1-3. Kiro로 폴더 열기

아래 셋 중 하나:

- Kiro 시작 화면(또는 File 메뉴)의 **Open Project** → `my-todo-kiro` 폴더 선택
- Finder에서 `my-todo-kiro` 폴더를 Kiro 창으로 끌어다 놓기
- 터미널에서 `cd ~/git/my-todo-kiro` 후 `kiro .` (1-1의 8번 셸 통합을 한 경우)

그다음 왼쪽 활동 막대의 **Kiro 유령 아이콘**을 눌러 Kiro 패널을 연다. 채팅 창이 함께 열린다.

## 규칙

- 설치하는 것은 **Kiro IDE 하나뿐**이다. 인터넷 글에서 `kiro-cli` 명령이나 CLI 설치 스크립트가 보여도 이 모듈에서는 따라 하지 않는다.
- 반드시 **프로젝트 폴더를 연 상태**에서 작업한다. Kiro는 연 폴더 안에 `.kiro/` 를 만든다.
- 폴더를 열 때 "이 폴더의 작성자를 신뢰하는가" 를 물으면 내가 만든 폴더이므로 신뢰를 선택한다.
- Kiro 안의 터미널은 메뉴 **Terminal › New Terminal** (또는 **⌃ + `**)로 연다. 이후 터미널 명령은 여기서 해도 된다.

## 산출물

```
my-todo-kiro/
└── .git/          ← 아직 .kiro/ 는 없다 (2단계에서 생김)
```

## 체크리스트

- [ ] 응용 프로그램 폴더에 **Kiro** 앱(IDE)이 설치되어 있다. (CLI는 설치하지 않았다)
- [ ] Kiro에 로그인되어 있다.
- [ ] 새 터미널에서 `which kiro` 가 경로를 출력한다. (셸 통합 완료)
- [ ] Kiro 창 제목·탐색기에 `my-todo-kiro` 가 보인다.
- [ ] Kiro 패널에 **Specs**, **Agent Hooks**, **Steering** 영역이 보인다.
- [ ] 왼쪽 Kiro 아이콘을 누르면 Kiro 패널에 **SPECS** 항목이 보인다.

---

# 2 단계: 스티어링(Steering) — 프로젝트 규칙 알려 주기

**목적** — AI가 모든 대화와 Spec에서 참고할 **제품 목적(product)·기술 스택(tech)·폴더 구조(structure)** 를 파일로 적는다.

**입력** — 두 가지 방법 중 하나

**방법 A (권장, 빈 프로젝트): 파일을 직접 만든다** — Kiro 터미널에 아래 블록을 통째로 붙여 넣는다.

```bash
mkdir -p .kiro/steering

cat > .kiro/steering/product.md <<'EOF'
# 제품 (Product)

- 이름: 할 일 목록 (my-todo-kiro)
- 대상: 혼자 쓰는 개인 사용자. 초보자 학습용 예제
- 핵심 기능: 할 일 추가·완료·삭제, 전체/진행 중/완료 필터, 남은 개수 표시, 새로 고침 후에도 유지
- 범위 밖: 로그인, 여러 사용자, 서버 저장, 알림
- 문서·화면 문구·커밋 메시지는 모두 한국어로 쓴다
EOF

cat > .kiro/steering/tech.md <<'EOF'
# 기술 (Tech)

- 빌드 도구·프레임워크 없이 순수 HTML / CSS / JavaScript(ES 모듈)
- 저장: 브라우저 localStorage 만 사용. 외부로 데이터를 보내지 않는다
- 테스트: Node.js 내장 테스트 러너 `node --test`. 외부 테스트 라이브러리 금지
- package.json 에는 "type": "module" 만 두고 의존성은 없다 (npm install 불필요)
- 로컬 실행: `python3 -m http.server 8000` 후 http://localhost:8000
- 접근성: 모든 기능은 키보드만으로 사용 가능, 초점 테두리가 보여야 한다
EOF

cat > .kiro/steering/structure.md <<'EOF'
# 구조 (Structure)

- index.html            : 화면
- src/todo.js           : 할 일 데이터 처리 순수 함수 (DOM·localStorage 사용 금지, 테스트 대상)
- src/storage.js        : localStorage 읽기·쓰기 (localStorage 를 쓰는 유일한 파일)
- src/app.js            : 화면 그리기와 이벤트 처리
- src/style.css         : 스타일
- tests/todo.test.js    : src/todo.js 단위 테스트
- 새 로직은 먼저 src/todo.js 에 순수 함수로 만들고 테스트를 함께 추가한다
EOF
```

**방법 B: Kiro가 만들게 한다** — Kiro 패널 › **Steering** › **Generate Steering Docs** (또는 **+** › **Foundation steering files**). 코드가 이미 있는 프로젝트에서 유용하다. 빈 폴더에서는 내용이 거의 없으므로, 생성된 세 파일을 위 방법 A의 내용으로 고친다.

## 규칙

- 스티어링에는 **AI가 코드만 봐서는 알 수 없는 것**(목적, 범위 밖, 기술 제약, 규칙)을 적는다.
- 파일 맨 위에 front matter가 없으면 기본값 `inclusion: always` — **모든 대화에 자동 포함**된다.
- 특정 파일을 다룰 때만 쓰는 규칙은 front matter로 범위를 좁힐 수 있다.

```markdown
---
inclusion: fileMatch
fileMatchPattern: "tests/**/*.js"
---
# 테스트 작성 규칙
- 테스트 이름은 "함수명: 기대 동작" 형식의 한국어로 쓴다
```

| inclusion | 언제 포함되나 |
| --- | --- |
| `always` (기본) | 항상 |
| `fileMatch` | `fileMatchPattern` 에 맞는 파일을 다룰 때 |
| `manual` | 채팅에서 `#파일이름` 으로 부를 때만 |
| `auto` | 요청 내용이 `description` 과 맞을 때 (`name`, `description` 필수) |

- 모든 프로젝트에 공통인 규칙은 `~/.kiro/steering/`(전역)에 둘 수 있다. 전역과 프로젝트가 충돌하면 **프로젝트 규칙이 우선**한다.

## 산출물

```
my-todo-kiro/
└── .kiro/
    └── steering/
        ├── product.md
        ├── tech.md
        └── structure.md
```

## 체크리스트

- [ ] Kiro 패널 › **Steering** 에 `product`, `tech`, `structure` 세 파일이 보인다.
- [ ] 각 파일에 목적·범위 밖, 기술 제약·테스트·실행 방법, 폴더 구조가 적혀 있다.
- [ ] "문서·화면 문구는 한국어" 규칙이 들어 있다.
- [ ] 🖥️ `git add -A && git commit -m "chore: add Kiro steering"` 로 커밋했다.

---

# 3 단계: Spec 시작과 요구사항 (requirements.md)

**목적** — 만들 기능을 자연어로 설명해 Spec을 시작하고, Kiro가 만든 **요구사항(사용자 스토리 + EARS 인수 조건)** 을 검토·수정한다.

**입력**

1. Spec 만들기 화면을 연다.
   1. 화면 **맨 왼쪽 세로 아이콘 줄(활동 막대)** 에서 **Kiro 아이콘(유령 모양)** 을 누른다.
   2. 바로 오른쪽에 열린 **Kiro 패널**에서 **SPECS** 항목을 찾는다.
   3. **SPECS** 아래의 **+ Create New Spec** 버튼(또는 SPECS 줄 오른쪽 끝의 **+**)을 누른다.

   ```
   ┌──┬────────────────────┐
   │👻│ KIRO               │
   │  │ ▾ SPECS        [+] │
   │  │   + Create New Spec│ ← 여기를 누른다
   │  │ ▸ AGENT HOOKS  [+] │
   │  │ ▸ STEERING     [+] │
   │  │ ▸ MCP SERVERS      │
   └──┴────────────────────┘
    ↑ Kiro 아이콘
   ```

   > 오른쪽 채팅 창에서 Spec으로 시작하는 방법도 있지만, 처음에는 위 경로가 가장 찾기 쉽다.
2. 만들 기능을 설명하는 입력란이 나오면 아래 내용을 **그대로 붙여 넣고 Enter**. 입력한 내용이 오른쪽 **채팅 창**에 표시되며 Spec 대화가 시작된다.

```text
Spec 이름은 todo-list 로 해 줘. 혼자 쓰는 간단한 할 일 관리 웹 앱의 첫 버전이다.
- 사용자는 할 일을 입력해 목록 끝에 추가할 수 있다. Enter 키와 추가 버튼 모두 된다.
- 빈 값이나 공백만 입력하면 추가하지 않고 안내 문구를 보여 준다. 할 일은 최대 200자다.
- 할 일의 완료 여부를 체크하거나 해제할 수 있고, 필요 없는 할 일은 확인 창 없이 바로 삭제한다.
- 목록은 '전체 / 진행 중 / 완료' 로 걸러 볼 수 있고, 남은(완료하지 않은) 할 일 개수가 항상 보인다.
- 페이지를 새로 고치거나 브라우저를 다시 열어도 목록과 완료 상태가 그대로 남아 있어야 한다.
- 모든 기능은 키보드만으로 쓸 수 있어야 한다.
- 로그인, 여러 사용자, 마감일은 이번 범위가 아니다.
요구사항은 한국어로 쓰고, 인수 조건은 EARS 형식(WHEN … THE SYSTEM SHALL …)으로 써 줘.
```

3. Kiro가 채팅 창에서 새 기능을 만들지, 버그를 고칠지 물어본다. → **Build a feature** 를 고른다.
4. 이어서 진행 방식을 물으면 **Requirements-First**(요구사항부터)를 고른다. 묻지 않고 바로 요구사항을 만들기 시작하면 그대로 둔다.

   ```
   채팅 창 흐름
   나   : (위 기능 설명)
   Kiro : 새 기능인가요, 버그 수정인가요?      → [Build a feature] 선택
   Kiro : 요구사항부터? 설계부터?             → [Requirements-First] 선택 (묻는 경우만)
   Kiro : 파일 접근(읽기·쓰기)을 허용할까요?   → [허용] 선택
   Kiro : requirements.md 작성 … 완료
   Kiro : [Generate Tech Design] [Generate Task List] [Analyze Requirements]  ← 여기서 멈추고 기다린다
   ```

5. 진행하다 Kiro가 **파일 접근 권한**(프로젝트 파일을 읽거나 `.kiro/specs/todo-list/` 에 문서를 만들어도 되는지)을 물으면 **허용**한다.
   - Kiro는 허락 없이 파일을 만들거나 고치지 않기 때문에 묻는 것이다. 허용하지 않으면 `requirements.md` 가 만들어지지 않는다.
   - "이번만 허용" 과 "항상 허용(이 프로젝트 신뢰)" 같은 선택지가 있으면, 실습 폴더(`my-todo-kiro`)이므로 **항상 허용**을 골라도 된다. 그러면 이후 단계에서 같은 질문이 줄어든다.
   - 내용을 꼭 읽어 보고, 실습 폴더 **밖**의 파일(예: 홈 폴더의 다른 파일)에 접근하려 하면 거절한다.

6. `requirements.md` 가 열리면 읽어 본다. 고칠 점은 채팅으로 요청하거나 파일을 직접 고친다.

```text
요구사항 3번에 "같은 내용의 할 일이 이미 있으면 그대로 추가하되 안내 문구를 보여 준다" 를 추가해 줘.
```

7. 요구사항이 만들어지면 Kiro는 **자동으로 다음 단계로 넘어가지 않고** 채팅 창에 세 가지 선택지를 보여 준 채 기다린다.

   | 선택지 | 하는 일 | 이 실습에서 |
   | --- | --- | --- |
   | **Analyze Requirements** | 요구사항의 빠진 경우·모순·모호한 표현을 점검 | (선택) 먼저 한 번 실행해 본다 |
   | **Generate Tech Design** | 요구사항을 바탕으로 `design.md` 생성 | ✅ 검토가 끝나면 **이것**을 누른다 → 4단계 |
   | Generate Task List | 설계를 건너뛰고 바로 `tasks.md` 생성 | 누르지 않는다 (설계 단계를 거쳐야 함) |

   - **Analyze Requirements** 를 눌렀다면 결과를 읽고, 고칠 점이 있으면 채팅으로 반영을 요청한다. 다시 세 선택지가 나오면 다음으로 진행한다.
8. 요구사항 검토가 끝나면 **Generate Tech Design** 을 누른다. → 4단계로

## 규칙

- Kiro가 파일 접근·명령 실행 권한을 물으면 **무엇을 하려는지 읽고** 허용한다. 실습 폴더 안의 작업이면 허용, 폴더 밖이면 거절이 원칙이다.
- 이 단계에서는 **무엇을·왜** 만 다룬다. 파일 이름·라이브러리 같은 기술 얘기는 4단계(설계)와 스티어링이 맡는다.
- 인수 조건 하나는 **테스트 하나로 확인할 수 있을 만큼** 구체적이어야 한다. "적절히", "빠르게" 같은 말이 있으면 숫자나 관찰 가능한 결과로 바꿔 달라고 한다.
- 요구사항을 승인하기 전에 범위 밖(로그인·여러 사용자·마감일)이 빠졌는지 확인한다.
- Spec 이름은 Kiro가 정할 수 있다. 다르게 만들어지면 그 이름으로 진행해도 되지만, 이 문서와 맞추려면 `todo-list` 로 바꿔 달라고 한다.

## 산출물

```
.kiro/specs/todo-list/
└── requirements.md
```

예시(발췌, 실제 출력은 매번 조금씩 다르다):

```markdown
### 요구사항 1: 할 일 추가

**사용자 스토리:** 사용자로서, 해야 할 일을 빠르게 적어 두고 싶다. 잊지 않기 위해서다.

#### 인수 조건

1. WHEN 사용자가 내용을 입력하고 Enter 키를 누르면 THE SYSTEM SHALL 목록 끝에 미완료 할 일로 추가한다
2. WHEN 사용자가 공백만 입력하고 추가하면 THE SYSTEM SHALL 할 일을 추가하지 않고 "할 일 내용을 입력해 주세요" 를 표시한다
3. WHEN 입력 내용이 200자를 넘으면 THE SYSTEM SHALL 추가하지 않고 글자 수 초과 안내를 표시한다
```

## 체크리스트

- [ ] `.kiro/specs/todo-list/requirements.md` 가 생겼다.
- [ ] 요구사항마다 **사용자 스토리**와 **EARS 형식 인수 조건**이 있다.
- [ ] 입력 규칙(빈 값·200자·중복), 완료, 즉시 삭제, 필터, 남은 개수, 새로 고침 유지, 키보드 사용이 모두 들어 있다.
- [ ] 범위 밖 항목이 요구사항에 섞여 있지 않다.
- [ ] 문서가 한국어다 (2단계 스티어링이 반영됨).

---

# 4 단계: 설계 (design.md)

**목적** — 승인한 요구사항을 바탕으로 Kiro가 만든 **기술 설계**를 검토한다. 스티어링(tech·structure)이 그대로 반영되었는지가 핵심이다.

**입력** — `design.md` 는 직접 만드는 것이 아니라, **요구사항을 승인하면 Kiro가 만든다.**

1. **design.md 만들기** — 3단계 마지막에 채팅 창에 나온 선택지 중 **Generate Tech Design** 을 누른다.
   - 파일 접근 권한을 물으면 3단계처럼 허용한다. → 편집기에 `.kiro/specs/todo-list/design.md` 가 열린다.
   - 선택지가 사라져 보이지 않으면 채팅 입력창에 `#spec:todo-list 요구사항은 이대로 확정할게. design.md 를 만들어 줘.` 라고 입력해도 된다.

2. **design.md 검토** — 아래 "규칙"의 순서로 읽어 본다.

3. **(필요할 때만) 고치기** — 고칠 점이 있으면 **같은 채팅 창**에 요청한다. 아래는 예시이며, 이미 그렇게 되어 있으면 보내지 않아도 된다.

   ```text
   design.md 의 데이터 모델에서 할 일 id 는 문자열 대신 1부터 증가하는 정수로 바꿔 줘. 저장된 데이터가 깨졌을 때는 앱이 멈추지 않고 빈 목록으로 시작하도록 오류 처리에 추가해 줘.
   ```

4. **다음 단계로** — `design.md` 가 만들어져도 Kiro는 **작업 목록을 자동으로 만들지 않는다.** 채팅 창에 **Generate Task List** 버튼이 나타나고, 이 버튼을 눌러야 5단계(`tasks.md`)로 넘어간다.

   ```
   채팅 창 흐름
   나   : [Generate Tech Design] 클릭
   Kiro : design.md 작성 … 완료
   Kiro : [Generate Task List]           ← 설계 검토가 끝나면 이 버튼을 누른다
   ```

   - 설계를 고칠 점이 있으면 버튼을 누르기 전에 먼저 채팅으로 수정을 요청하고, 수정이 다 끝난 뒤 누른다.
   - 버튼이 화면에서 사라졌다면 `#spec:todo-list 설계는 이대로 확정할게. tasks.md 를 만들어 줘.` 라고 입력한다.

> 💡 채팅 창을 닫았거나 새 대화를 열었다면, 입력 맨 앞에 `#spec:todo-list` 를 붙이면 이 Spec을 이어서 다룬다. 예: `#spec:todo-list 설계 단계로 진행해 줘`

## 규칙

- 검토 순서: **구조(파일 나눔) → 데이터 모델 → 흐름 → 오류 처리 → 테스트 전략**
- 스티어링과 다른 기술(React, 외부 라이브러리, 서버 등)이 나오면 **Generate Task List 를 누르기 전에** 바로 지적한다. Kiro가 스티어링을 어긴 것이다.
- ⚠️ **실제로 자주 생기는 일**: `tech.md` 에 "`node --test`, 외부 테스트 라이브러리 금지" 라고 적어도 Kiro가 설계에서 **Vitest·fast-check·jsdom** 같은 npm 패키지를 고르는 경우가 있다. `design.md` 에서 `vitest`, `jest`, `fast-check`, `npm install` 이 보이면 아래처럼 요청한다.

  ```text
  #spec:todo-list design.md 가 tech.md 와 다르게 Vitest·fast-check·jsdom 을 쓰고 있어. tech.md 대로 Node.js 내장 테스트 러너(node --test)만 쓰고 외부 의존성이 없는 구성으로 design.md 를 고쳐 줘. 파일 구조도 structure.md 에 맞춰 줘.
  ```

  > 그대로 진행하면 `package.json` 에 의존성이 생기고 `npm install` 이 필요해지며, 테스트 명령도 `node --test` 대신 `npm test` 가 된다. (7단계 Hook과 SAMPLE의 테스트 명령도 그에 맞게 바꿔야 한다)
- 설계를 바꾸다 **요구사항 자체가 바뀌면** 3단계 문서도 함께 고쳐 달라고 한다.

## 산출물

```
.kiro/specs/todo-list/
├── requirements.md
└── design.md          ← 개요, 아키텍처, 컴포넌트와 인터페이스, 데이터 모델,
                          (시퀀스 다이어그램), 오류 처리, 테스트 전략
```

## 체크리스트

- [ ] `design.md` 의 파일 구조가 스티어링 `structure.md` 와 같다 (`src/todo.js`, `src/storage.js`, `src/app.js`, `tests/todo.test.js`).
- [ ] 저장 방식이 localStorage, 테스트가 `node --test` 다. `vitest`·`jest`·`fast-check`·`npm install` 같은 외부 패키지가 **없다**.
- [ ] 데이터 모델(예: `{ id, text, completed }`)이 정의되어 있다.
- [ ] 저장 실패·데이터 손상 같은 오류 처리가 있다.
- [ ] 요구사항의 각 항목을 어떤 테스트로 확인할지 테스트 전략이 있다.

---

# 5 단계: 작업 목록 (tasks.md)

**목적** — **Generate Task List** 로 설계를 **번호 붙은 실행 단위 작업**으로 쪼갠 `tasks.md` 를 만들고 검토한다.

**입력** — 4단계 마지막에 채팅 창의 **Generate Task List** 버튼을 누른다. (이 버튼을 누르기 전에는 `tasks.md` 가 만들어지지 않는다) 파일 접근 권한을 물으면 허용하고, 만들어진 `tasks.md` 에 고칠 점이 있으면 같은 채팅 창에 요청한다.

```text
tasks.md 에서 각 기능 작업 바로 앞에 해당 순수 함수의 단위 테스트 작업이 오도록 순서를 바꿔 줘.
```

## 규칙

- 작업마다 **어떤 요구사항을 만족시키는지**(요구사항 번호)가 적혀 있는지 본다. 없는 요구사항이 있으면 작업이 빠진 것이다.
- 테스트 작업이 기능 작업과 함께 있는지 확인한다 (스티어링: 새 로직은 테스트와 함께).
- 문서를 직접 고쳤거나 요구사항·설계를 바꿨다면 `tasks.md` 의 **Sync Files** 로 작업 목록을 다시 맞춘다.

## 산출물

```
.kiro/specs/todo-list/
├── requirements.md
├── design.md
└── tasks.md
```

예시(발췌):

```markdown
- [ ] 1. 프로젝트 기본 구조 만들기
  - index.html, src/, tests/, package.json("type": "module") 생성
  - _요구사항: 전체_

- [ ] 2. 할 일 추가 로직
- [ ] 2.1 addTodo 단위 테스트 작성 (빈 값·공백·200자·중복)
  - _요구사항: 1.1, 1.2, 1.3_
- [ ] 2.2 src/todo.js 에 addTodo 구현
  - _요구사항: 1.1, 1.2, 1.3_
```

## 체크리스트

- [ ] `tasks.md` 의 모든 작업에 번호가 있고, 요구사항 번호가 연결되어 있다.
- [ ] 요구사항 문서의 모든 항목이 어떤 작업엔가 연결되어 있다.
- [ ] 테스트 작업이 포함되어 있다.
- [ ] 🖥️ `git add -A && git commit -m "docs: todo-list spec"` 로 구현 전 상태를 커밋했다.

---

# 6 단계: 작업 실행 — 앱 만들기

**목적** — `tasks.md` 의 작업을 실행해 코드를 만들고, 작업 상태를 완료로 바꾼다.

## 6-1. 작업 실행

**입력** — 작업 실행은 채팅에 글을 쓰는 것이 아니라 **`tasks.md` 파일을 연 편집기 화면의 버튼**으로 한다.

1. `tasks.md` 를 연다. (5단계에서 열려 있으면 그대로, 닫았다면 Kiro 패널 › **SPECS** › `todo-list` › `tasks.md`)
2. 편집기에서 작업 목록 위·옆에 나타나는 버튼을 누른다.

   ```
   ┌─ tasks.md ─────────────────────── [Run all Tasks] ┐ ← ② 한꺼번에 실행
   │                                                  │
   │  ▶ Start task                   ← ① 이 작업만 실행  │
   │  - [ ] 1. 프로젝트 기본 구조 만들기                    │
   │  ▶ Start task                                     │
   │  - [ ] 2.1 addTodo 단위 테스트 작성                   │
   │  …                                               │
   └──────────────────────────────────────────────────┘
   ```

   | 방법 | 누르는 곳 | 동작 |
   | --- | --- | --- |
   | ① **하나씩** (처음엔 이것 권장) | 각 작업 줄 바로 위(또는 옆)의 실행 버튼 | 그 작업만 실행 → 결과를 확인하고 다음 작업 |
   | ② **한꺼번에** | `tasks.md` 편집기 **위쪽 오른쪽**의 **Run all Tasks** | 남은 작업을 모두 실행. 서로 의존하지 않는 작업은 묶어서(wave) 동시에, 의존하는 작업은 순서대로 |

3. 실행이 시작되면 오른쪽 **채팅 창**에 Kiro가 하는 일(파일 생성, 명령 실행)이 표시된다. 권한을 물으면 내용을 확인하고 허용한다.
4. 작업 상태가 진행 중 → 완료로 바뀌고 체크 표시가 된다.

> 버튼 대신 **채팅으로** 시킬 수도 있다. 이때는 Spec을 불러오도록 앞에 `#spec:todo-list` 를 붙인다.
>
> ```text
> #spec:todo-list 작업 2.1 과 2.2 를 진행해 줘.
> ```
>
> ```text
> #spec:todo-list 남은 작업을 모두 순서대로 진행해 줘.
> ```

## 규칙

- 처음이라면 **하나씩** 실행하며 무엇이 만들어지는지 본다. 익숙해지면 Run all Tasks 를 쓴다.
- Kiro가 명령 실행(`node --test` 등)이나 파일 변경 승인을 물으면 내용을 확인하고 허용한다.
- 작업 상태는 `tasks.md` 의 체크 칸으로 표시된다.

  | 표시 | 뜻 |
  | --- | --- |
  | `- [x]` | 완료 |
  | `- [-]` | 진행 중 |
  | `- [~]` | 실행 대기 (Run all Tasks 가 순서를 기다리는 중) |
  | `- [ ]` | 아직 시작 안 함 |
  | `- [ ]*` | **선택 작업**(`*` 표시) — Run all Tasks 에서 건너뛸 수 있는 작업(주로 추가 테스트) |

- **Checkpoint** 작업(예: "3. Checkpoint — State 모듈 검증")에서는 Kiro가 멈추고 채팅 창에서 질문하거나 확인을 기다린다. 채팅 창을 보고 답하거나 "계속 진행해 줘" 라고 입력해야 다음 작업으로 넘어간다.
- 실행이 멈춘 것처럼 보이면 **채팅 창에 권한 요청(파일 쓰기·명령 실행)이나 질문이 떠 있지 않은지** 먼저 확인한다. 대부분 여기서 기다리고 있다.
- 중간에 멈추면 남은 작업만 다시 실행하면 된다 (Run all Tasks 는 끝나지 않은 필수 작업만 실행한다).
- 구현 중 설계를 바꿔야 하면 코드부터 고치지 말고 `#spec:todo-list` 로 **설계·요구사항을 먼저 고친 뒤** Sync Files → 실행한다.
- 이미 끝난 작업이 완료로 표시되지 않았다면 **Sync Files** 를 누르거나 "어떤 작업이 끝났는지 확인해 줘" 라고 요청한다.

## 산출물

```
my-todo-kiro/
├── index.html
├── package.json            {"type": "module"}
├── src/  todo.js  storage.js  app.js  style.css
├── tests/ todo.test.js
└── .kiro/specs/todo-list/tasks.md   ← 모든 작업 완료
```

## 6-2. 화면이 실제로 나오는지 확인하고, 안 나오면 Kiro에게 고치게 하기

`tasks.md` 가 완료로 보여도 **앱이 실제로 동작하는지는 직접 열어 봐야 안다.** 작업이 중간에 멈췄거나, 파일만 만들어지고 내용이 비어 있으면 브라우저 화면이 하얗게 비어 나온다.

1. 🖥️ Kiro 터미널에서 서버를 켠다.

   ```bash
   python3 -m http.server 8000
   ```

2. 🌐 브라우저에서 **http://localhost:8000** 을 연다. (`index.html` 더블클릭 ✗)
3. 입력란·추가 버튼·필터·남은 개수가 보이고, 할 일을 하나 추가했을 때 목록에 나타나면 정상 → 체크리스트로.
4. **화면이 비어 있거나 버튼이 동작하지 않으면** 아래 순서로 확인한다.
   1. `tasks.md` 에 `- [ ]`, `- [~]`, `- [-]` 로 남은 필수 작업이 있는지 본다. → 있으면 Run all Tasks 가 끝나지 않은 것이다.
   2. 🖥️ 파일이 비어 있지 않은지 본다.

      ```bash
      wc -l index.html src/*.js
      ```

      → 줄 수가 0 이나 1~2 줄이면 아직 구현되지 않은 것이다.
   3. 🌐 브라우저에서 **⌘ + ⌥ + I** → **Console** 탭에 빨간 오류가 있는지 본다. 있으면 복사해 둔다.
5. 👻 Kiro 채팅 창에 증상을 그대로 알리고 고치게 한다.

   ```text
   #spec:todo-list python3 -m http.server 8000 으로 http://localhost:8000 을 열었더니 화면에 아무것도 나오지 않아.
   tasks.md 에서 끝나지 않은 작업을 확인하고, index.html 과 src 파일이 요구사항대로 실제로 구현되어 있는지 점검해서 화면이 나오도록 고쳐 줘.
   브라우저 콘솔 오류: (있으면 붙여 넣기, 없으면 "없음")
   고친 뒤에는 tasks.md 의 작업 상태를 실제 구현 상태에 맞게 갱신해 줘.
   ```

6. Kiro가 파일을 고치면(권한을 물으면 허용) 브라우저를 **⌘ + Shift + R**(강력 새로 고침)로 다시 연다. 정상이 될 때까지 4~6을 반복한다.
7. 마지막으로 `tasks.md` 에서 **Sync Files** 를 눌러 작업 상태를 실제 코드와 맞춘다. 아직 `- [ ]` 로 남은 필수 작업이 있으면 다시 **Run all Tasks**.

> 💡 이렇게 "직접 실행해 보고 → 증상을 Spec과 함께 알려 주고 → 고치게 하는" 과정도 SDD의 일부다. 고친 내용이 요구사항·설계를 바꾸는 것이라면 `requirements.md`·`design.md` 도 함께 고쳐 달라고 한다.

## 체크리스트

- [ ] `tasks.md` 의 모든 필수 작업이 `- [x]` 다. (`*` 선택 작업은 남아 있어도 된다)
- [ ] 🖥️ `node --test` 가 `# fail 0` 으로 통과한다. (설계가 Vitest 로 바뀌었다면 `npm install` 후 `npm test`)
- [ ] 🌐 http://localhost:8000 에서 화면이 나오고, 할 일 추가가 동작한다. (6-2)
- [ ] [SAMPLE.md](SAMPLE.md) 의 순서대로 모든 시나리오가 요구사항대로 동작함을 확인했다.
- [ ] 🖥️ `git add -A && git commit -m "feat: todo list (Kiro spec todo-list)"`

---

# 7 단계: Agent Hook — 저장하면 테스트 자동 실행

**목적** — 반복 작업을 자동화한다. **에이전트가 `src/` 나 `tests/` 의 JavaScript 파일을 저장할 때마다 `node --test` 를 실행**하는 Hook을 만든다.

**입력**

1. Kiro 패널 › **Agent Hooks** › **+** → **Ask Kiro to create a hook**
2. 아래 내용을 입력한다.

```text
src 또는 tests 폴더의 .js 파일이 저장되면 프로젝트 루트에서 node --test 를 실행하는 hook 을 만들어 줘. 이름은 "저장 시 테스트 실행" 으로 해 줘.
```

3. Kiro가 보여 주는 설정(이벤트 종류, 파일 패턴, 동작)을 확인하고 저장한다.

Kiro가 만드는 파일은 대략 다음과 같다(예시 — 필드 값은 Kiro가 정한다):

```json
{
  "version": "v1",
  "hooks": [
    {
      "name": "저장 시 테스트 실행",
      "description": "src/ 또는 tests/ 의 .js 파일 저장 후 단위 테스트 실행",
      "trigger": "PostFileSave",
      "matcher": "^(src|tests)/.*\\.js$",
      "action": { "type": "command", "command": "node --test" },
      "timeout": 60
    }
  ]
}
```

4. 확인: 채팅에서 작은 수정을 요청해 Hook이 도는지 본다.

```text
src/todo.js 의 countActive 함수 위에 "진행 중인 할 일의 개수를 돌려준다" 라는 주석을 달아 줘.
```

## 규칙

- Hook의 동작은 두 가지다. **command** = 셸 명령 실행(테스트·린트), **agent** = 대화에 프롬프트를 넣어 AI에게 일을 시킴(예: "테스트 파일도 갱신해 줘").
- 파일 이벤트 Hook은 **에이전트가 파일을 만들거나 저장·삭제할 때** 동작한다. 패턴(matcher)을 좁게 잡아 불필요한 실행을 줄인다.
- 그 밖의 이벤트: 프롬프트 제출, 에이전트 응답 종료, 세션 시작, 도구 사용 전·후, **Spec 작업 실행 전·후** 등.
- Hook 파일도 코드처럼 git에 커밋해 팀과 공유한다.

## 산출물

```
.kiro/hooks/
└── <이름>.json        ← 예: run-tests-on-save.json
```

## 체크리스트

- [ ] Kiro 패널 › **Agent Hooks** 에 "저장 시 테스트 실행" 이 보이고 켜져 있다.
- [ ] `.kiro/hooks/` 에 JSON 파일이 생겼다.
- [ ] 에이전트가 `src/todo.js` 를 저장했을 때 `node --test` 가 자동으로 실행되고 결과가 보였다.
- [ ] 🖥️ 커밋했다.

---

# 8 단계: (도전) 기존 Spec에 마감일 기능 추가

**목적** — 이미 완성된 Spec을 **고쳐서** 기능을 늘린다. Kiro는 **같은 Spec 문서를 갱신하고 Sync Files 로 작업을 맞추는** 방식이다. (M02 OpenSpec에서는 같은 일을 "바뀌는 부분만 적는 델타 명세"로 하는 방법을 배운다)

**입력** — 순서대로

1. 요구사항 추가

```text
#spec:todo-list 요구사항에 마감일 기능을 추가해 줘. 사용자는 할 일을 추가할 때 선택적으로 마감일을 지정할 수 있다. 마감일이 지난 미완료 할 일은 눈에 띄게 표시된다. 목록을 마감일이 가까운 순으로 정렬해 볼 수 있다. 예전에 저장된 마감일 없는 할 일도 그대로 보여야 한다. 알림은 범위 밖이다. 인수 조건은 EARS 형식으로 써 줘.
```

2. 설계 갱신

```text
#spec:todo-list 바뀐 요구사항에 맞게 design.md 를 갱신해 줘. 마감일은 HTML date 입력과 YYYY-MM-DD 문자열로 저장하고, 마감일 없는 기존 데이터도 읽을 수 있어야 한다.
```

3. `tasks.md` 를 열고 **Sync Files** → 새 요구사항에 해당하는 작업이 추가된다.
4. 새 작업 실행 (작업 클릭 또는 **Run all Tasks** — 미완료 작업만 실행된다)
5. 7단계 Hook이 테스트를 자동으로 돌리는지 확인하고, [SAMPLE.md 8단계](SAMPLE.md#8단계-도전-마감일-기능-써-보기)로 앱을 확인한다.

## 규칙

- 기존 기능의 요구사항을 바꾸지 않았는지 확인한다. 바뀌어야 한다면 바뀐 요구사항이 명시적으로 드러나게 고쳐 달라고 한다.
- 저장 데이터 형식이 바뀌므로 **예전 데이터 호환**(마감일 없는 할 일)을 요구사항·테스트에 반드시 넣는다.
- 기능이 크게 다르면 Spec을 새로 만든다 (Kiro 권장: **기능 하나에 Spec 하나**).

## 산출물

```
.kiro/specs/todo-list/
├── requirements.md   ← 마감일 요구사항 추가
├── design.md         ← 마감일 데이터·화면 설계 추가
└── tasks.md          ← Sync Files 로 새 작업 추가 → 실행 후 완료
```

## 체크리스트

- [ ] `requirements.md` 에 마감일 요구사항(EARS)이 추가되었다.
- [ ] `design.md` 에 마감일 저장 형식과 기존 데이터 호환 방법이 있다.
- [ ] Sync Files 후 새 작업이 생겼고 모두 완료되었다.
- [ ] `node --test` 가 통과하고, SAMPLE 8단계(마감일)와 5단계(기존 기능) 시나리오가 모두 동작한다.
- [ ] 🖥️ 커밋했다.

---

# 부록 A. 팀 규칙 스티어링 조각

`.kiro/steering/sdd-rules.md` 로 저장하면 Spec 밖에서 대화할 때도 같은 흐름을 지킨다. (front matter가 없으므로 항상 포함)

```markdown
# 스펙 주도 개발 규칙

- 동작을 바꾸는 요청을 받으면 코드를 바로 고치지 말고, 해당 Spec(.kiro/specs/<기능>/)의 requirements.md 부터 고치자고 제안한다.
- 요구사항의 인수 조건은 EARS 형식(WHEN … THE SYSTEM SHALL …)으로 쓴다.
- 요구사항·설계를 바꾼 뒤에는 tasks.md 를 Sync Files 로 맞춘 다음 구현한다.
- 구현은 tasks.md 의 순서와 번호를 따르고, 작업마다 관련 테스트를 함께 작성한다.
- 작업을 마치면 node --test 를 실행해 결과를 보고한다.
- 문서·화면 문구·커밋 메시지는 한국어로 쓴다.
```

> 다른 AI 도구와 규칙을 함께 쓰려면 프로젝트 루트의 `AGENTS.md` 에 같은 내용을 두어도 된다. Kiro는 `AGENTS.md` 를 항상 포함한다.

# 부록 B. 자주 겪는 문제

| 증상 | 원인 / 해결 |
| --- | --- |
| Spec을 시작했는데 문서가 안 만들어진다 | 채팅 창에 **파일 접근 권한** 질문이 떠 있는지 확인하고 허용한다 |
| Run all Tasks 후 화면이 하얗게 비어 있다 | 작업이 중간에 멈췄거나 파일이 비어 있다. 6-2 순서로 확인하고 Kiro에게 증상을 알려 고치게 한다 |
| 작업이 `[~]`(대기)·`[-]`(진행 중)에서 멈춰 있다 | 채팅 창에 권한 요청·Checkpoint 질문이 떠 있는지 확인하고 답한다 |
| 설계에 Vitest·fast-check 등 npm 패키지가 들어갔다 | 스티어링(tech.md) 위반. Generate Task List 전에 4단계 요청문으로 design.md 를 고친다 |
| Kiro 패널이 안 보인다 | 왼쪽 활동 막대의 유령 아이콘 클릭. 그래도 없으면 메뉴 View 에서 Kiro 패널 열기 |
| `.kiro` 폴더가 Finder에 안 보인다 | 숨김 폴더. Finder `⌘ + Shift + .`, 터미널 `ls -a` |
| 요구사항이 영어로 나온다 | `.kiro/steering/product.md` 에 한국어 규칙이 있는지 확인. 프롬프트에 "한국어로" 를 덧붙인다 |
| 스티어링과 다른 기술(React 등)이 설계에 나온다 | `tech.md` 가 있는지, front matter를 `manual` 로 잘못 두지 않았는지 확인 후 "tech.md 를 따르도록 design.md 를 고쳐 줘" |
| Spec 폴더 이름이 문서와 다르다 | Kiro가 이름을 정했다. 그대로 진행하거나 처음 프롬프트에 "Spec 이름은 todo-list" 를 넣는다 |
| 요구사항을 고쳤는데 작업이 그대로다 | `tasks.md` 에서 **Sync Files** |
| 작업은 끝났는데 완료 표시가 안 된다 | **Sync Files** 또는 "#spec:todo-list 어떤 작업이 끝났는지 확인해 줘" |
| Hook이 실행되지 않는다 | Agent Hooks 에서 켜져 있는지, 파일 패턴이 실제 경로와 맞는지 확인. 파일 이벤트 Hook은 **에이전트가 저장한 파일**에 반응한다 |
| `node: command not found` (Hook·터미널) | Node.js 설치 후 Kiro를 다시 시작 |
| 브라우저 화면이 비어 있다 | `file://` 로 열면 ES 모듈이 막힌다. `python3 -m http.server 8000` 주소로 접속 |

# 부록 C. 용어 정리

| 용어 | 뜻 |
| --- | --- |
| Steering (스티어링) | AI에게 항상 알려 주는 프로젝트 규칙 파일. `.kiro/steering/*.md` |
| Foundation files | 기본 스티어링 3종: product.md(제품), tech.md(기술), structure.md(구조) |
| Spec | 기능 하나의 계획 묶음. `.kiro/specs/<기능>/` 의 requirements · design · tasks |
| Feature / Bugfix Spec | 새 기능용 / 버그 수정용 Spec |
| Requirements-First / Design-First | 요구사항부터 / 설계부터 시작하는 Spec 진행 방식 |
| Quick Spec | 승인 단계 없이 세 문서를 한 번에 만드는 방식 |
| EARS | WHEN … THE SYSTEM SHALL … 형식의 요구사항 작성법 |
| Analyze Requirements | 요구사항의 빈틈·모순 점검 |
| Run all Tasks / wave | 모든 미완료 작업 실행 / 동시에 실행되는 작업 묶음 |
| Sync Files | 요구사항·설계·작업 문서와 실제 상태를 다시 맞추기 |
| `#spec:<이름>` | 채팅에 해당 Spec 세 문서를 맥락으로 불러오기 |
| Agent Hook | 이벤트(파일 저장, 작업 완료 등)에 맞춰 명령·프롬프트를 자동 실행. `.kiro/hooks/*.json` |
| MCP | 외부 도구·API를 Kiro 에이전트에 연결하는 표준 |
