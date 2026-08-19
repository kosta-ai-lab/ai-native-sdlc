# Courses · 강의 과정 자료

> KOSTA AI Lab 멤버가 만든 **강의 과정(training course)** 자료를 모으는 폴더입니다.
> `modules/`가 AI Native SDLC 방법론을 단계별로 쌓는 자산이라면, `courses/`는 그 방법론을 가르치는 **교육 과정**을 담습니다.

## 게재된 강의

| 강의 | 분량 | 강사 |
|------|------|------|
| [Agentic Coding using Claude Code](agentic-coding-using-claude-code/) | 4시간 × 10편 시리즈 | 박준성 |
| **AI Native 개발 실무 3부작** | | 윤성열 |
| ├ [1편 · 바이브 코딩 첫걸음](vibe-coding-with-claude-code/) | 1일 7블록 | |
| ├ [2편 · 스펙 주도 개발 실전](spec-driven-development-practice/) | 1일 8블록 | |
| └ [3편 · Spec Kit으로 실전 소프트웨어 설계](software-design-with-spec-kit/) | 1일 8블록 | |

## 폴더 규칙

강의 하나당 폴더 하나를 만듭니다. 폴더 이름은 강의 주제를 영어 kebab-case로 짓습니다(예: `agentic-coding-with-claude-code`).

각 강의 폴더는 아래 구성을 따릅니다.

| 항목 | 위치 | 설명 |
|------|------|------|
| 강의 개요 | `README.md` | 제목·대상·선수지식·학습목표·커리큘럼·분량·강사 |
| 슬라이드 | `slides/` | 발표 자료(PDF) 또는 외부 링크 |
| 실습 | `labs/` | 실습 코드·과제 |
| 참고자료 | `resources/` | 링크·읽을거리 |

처음 시작할 때는 `_sample-course/` 폴더를 복사해서 내용을 채우면 됩니다.

## 강의 올리는 법

### 방법 A — 웹 브라우저로 올리기 (Git을 몰라도 됩니다)

1. GitHub에서 이 저장소의 `courses/` 폴더를 엽니다.
2. 오른쪽 위 **Add file → Upload files** 를 누릅니다.
3. 강의 자료 파일들을 화면으로 **드래그앤드롭** 합니다.
4. 화면 아래 **Commit changes** 에 간단한 설명을 적고 **Commit** 을 누릅니다.

> 폴더 구조를 그대로 올리려면, 내 컴퓨터에서 강의 폴더를 만든 뒤 그 안의 파일들을 한 번에 끌어다 놓으면 됩니다. 파일 경로에 폴더 이름을 포함하면 GitHub가 폴더를 자동으로 만들어 줍니다.

### 방법 B — Git / Pull Request (개발자용)

1. `course/<주제>` 브랜치를 만듭니다.
2. 강의 폴더를 추가하고 commit 합니다.
3. Pull Request를 올리고 리뷰를 받습니다. (자세한 흐름은 [CONTRIBUTING.md](../CONTRIBUTING.md) 참고)

## 품질 기준

- "따라 하면 되는" 수준으로 친절하게 씁니다(단계·예시 포함).
- 한국어를 우선하고, 핵심 용어는 영문을 병기합니다.
- 슬라이드 원본이 외부(드라이브 등)에 있으면 링크로 연결합니다.
