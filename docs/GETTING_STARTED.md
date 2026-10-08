# 처음 시작하기 — 공개 준비 검토 초안

> **2026-10-08 반영 상태:** 준비 문서 23개는 PR #5로 main에 병합되었습니다(병합 커밋 `9614297985689db627b8c303ee818f7ffb26f320`). 아래의 준비 브랜치·main 미반영 표기는 작성 당시 기록입니다. 현재 저장소는 PRIVATE이며 자료별 권리·내용 확인, 정식 라이선스 적용과 실제 공개 승인은 별도로 남아 있습니다.


> 기준: 2026-10-08 KST, `origin/main`의 `2e96afb40522244f881e75a47e0abe69c6c03b92`를 확인한 로컬 초안. 현재 비공개입니다. 전체 공개 준비·라이선스 방향·기여 기준·운영 책임은 [결정 기록](PUBLIC_RELEASE_DECISIONS.md)에 정했고, 자료별 권리·내용 확인과 최종 공개 승인은 남아 있습니다. 이 문서는 사용 허락을 부여하지 않습니다.

## 접근과 실행 범위

현재는 승인된 저장소 접근 권한이 있어야 합니다. 공개 전환 후에는 확정된 안내를 사용하세요. 아래 clone 명령은 접근 가능한 경우의 예시입니다. 이번 준비에서는 같은 원격 저장소를 별도 로컬 작업본으로 복제했습니다.

```bash
git clone https://github.com/kosta-ai-lab/ai-native-sdlc.git
cd ai-native-sdlc
```

저장소 루트에는 `package.json`이 없습니다. **루트에서 `pnpm install`하지 말고 선택한 앱 디렉터리로 이동**하세요. 각 앱은 자체 `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`을 갖습니다. `private: true`는 패키지 메타데이터이며 저장소 공개 승인이나 라이선스가 아닙니다.

문서·경로·package scripts·JSON/YAML을 정적으로 검사했고, **경로 B의 작은 TDD 예제는 실제 의존성 설치·테스트 2개·타입 검사를 통과했습니다.** 확인 환경은 macOS 26.6.2, Node.js 22.23.1, pnpm 11.24.0, Vitest 3.2.6입니다. 경로 C의 세 API는 추가로 `NODE_ENV=test pnpm test src`에서 35/34/92개 테스트와 타입 검사를 통과했습니다. 서버·AI 초기화·하네스·다른 운영체제는 미검증입니다. 결과의 범위를 [공개 체크리스트](PUBLIC_RELEASE_CHECKLIST.md)에 기록합니다.

## 경로 A — 설치 없이 방법론과 교육 자료 읽기

1. [프로젝트 개요](../README.md)와 [방법론](../METHODOLOGY.md)을 읽습니다.
2. [코딩·TDD 모듈](../modules/06-coding-tdd/README.md)에서 규칙과 시드 모듈의 범위를 확인합니다. 모든 모듈이 완성된 것은 아닙니다.
3. 교육 자료는 [강의 목록](../courses/README.md)에서 고릅니다. PDF·PPTX·DOCX·이미지는 별도 뷰어가 필요할 수 있습니다. 파일이 존재한다는 사실은 공개 권리 검토가 끝났다는 뜻이 아닙니다.
4. 변경을 제안하려면 [기여 가이드](../CONTRIBUTING.md)를 확인합니다.

## 경로 B — 가장 작은 TDD 코드 예제

[web-task-system README](../samples/web-task-system/README.md)와 [package.json](../samples/web-task-system/package.json)을 확인한 명령입니다. Node.js와 pnpm이 필요하며, package.json에는 `engines`나 `packageManager` 버전 고정이 없습니다. 이 초안은 검증된 최소 버전이나 지원 OS 목록을 주장하지 않습니다.

저장소 루트에서:

```bash
cd samples/web-task-system
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm exec tsc --noEmit
```

`pnpm test`는 `vitest run`입니다. 타입 검사는 [tsconfig.json](../samples/web-task-system/tsconfig.json)의 `noEmit` 설정에 맞춘 직접 실행이며 `typecheck`라는 npm script는 없습니다. `dev`/`start` script도 없으므로 이 경로는 웹 서버가 아니라 할 일 생성 함수·테스트를 읽는 예제입니다.

읽기 순서: [요구사항](../samples/web-task-system/docs/03-requirements.md) → [명세](../samples/web-task-system/docs/04-spec.md) → [인수조건](../samples/web-task-system/docs/05-acceptance.feature) → [테스트](../samples/web-task-system/test/todo.test.ts) → [구현](../samples/web-task-system/src/todo.ts).

## 경로 C — SDD 교육용 API 세 트랙

아래 경로와 명령은 저장소 파일에서 확인했습니다. “안내 가능한 경로”라는 뜻이며 런타임 지원 인증이나 운영 배포 보장은 아닙니다.

| 트랙 | README | package.json | 학습 자료 |
|---|---|---|---|
| OpenSpec 상품·주문 API | [개요](../courses/spec-driven-development-practice/labs/openspec-ecommerce-api/README.md) | [scripts](../courses/spec-driven-development-practice/labs/openspec-ecommerce-api/package.json) | [단계별 교재](../courses/spec-driven-development-practice/labs/openspec-ecommerce-api/docs/steps/README.md) |
| Spec Kit 상품·주문 API | [개요](../courses/spec-driven-development-practice/labs/speckit-ecommerce-api/README.md) | [scripts](../courses/spec-driven-development-practice/labs/speckit-ecommerce-api/package.json) | [단계별 교재](../courses/spec-driven-development-practice/labs/speckit-ecommerce-api/docs/steps/README.md) |
| Spec Kit 멀티셀러 설계 | [개요](../courses/software-design-with-spec-kit/labs/speckit-ecommerce-fullscale/README.md) | [scripts](../courses/software-design-with-spec-kit/labs/speckit-ecommerce-fullscale/package.json) | [추적성](../courses/software-design-with-spec-kit/labs/speckit-ecommerce-fullscale/design/traceability.md) |

필요한 기본 도구는 Node.js와 pnpm입니다. 세 API의 scripts는 `test: vitest run`, `build: tsc -p tsconfig.json`, `dev: tsx watch src/index.ts`, `start: tsx src/index.ts`입니다. Hono·TypeScript·Vitest·tsx는 각 package.json에 선언된 의존성입니다. `engines`/`packageManager` 고정은 없으므로 지원 Node.js/pnpm 버전 조합을 공개 전에 실제 검증하고 기록해야 합니다.

저장소 루트에서 아래 **세 디렉터리 중 하나만** 선택합니다.

```bash
cd courses/spec-driven-development-practice/labs/openspec-ecommerce-api
# 또는 courses/spec-driven-development-practice/labs/speckit-ecommerce-api
# 또는 courses/software-design-with-spec-kit/labs/speckit-ecommerce-fullscale
pnpm install --frozen-lockfile --ignore-scripts
NODE_ENV=test pnpm test src
pnpm exec tsc --noEmit
# 선택: 검토한 로컬 교육용 서버를 실행할 때만
pnpm dev
```

각 API의 `src/index.ts`는 기본 포트 3000과 `/health`를 선언합니다. `PORT`로 포트를 변경할 수 있습니다. 이 문서는 네트워크 바인딩을 loopback 전용이라고 보장하지 않습니다. 서버를 외부에 노출하거나 실제 고객·결제 데이터를 연결하지 말고, 합성 데이터로 격리된 학습 환경에서만 검토하세요.

## AI 도구 초기화와 부작용

일반 테스트·타입 검사 안내와 AI 생성 실습을 구분합니다. 저장소 표준 플랫폼은 [Claude Code](../decisions/0001-platform-claude-code.md)이며, AI 도구 실행에는 별도 설치·계정·비용·데이터 전송 검토가 필요할 수 있습니다. 이번 검토에서는 AI CLI·API를 실행하지 않았습니다.

- OpenSpec README는 `npx @fission-ai/openspec@latest init`을 안내하며 OpenSpec 1.5를 과거 스택으로 기록합니다. `@latest`는 고정된 재현 버전이 아닙니다. 공개 전에 검증된 버전과 초기화 절차를 확정해야 합니다.
- 두 Spec Kit README는 `uvx --from git+https://github.com/github/spec-kit.git specify init . --ai claude`를 안내하고 0.12.8을 기록합니다. Git 브랜치 기반 설치는 버전이 변할 수 있습니다. `uv`/`uvx`와 생성 파일을 별도 검토해야 합니다.
- 생성된 `.claude/` 명령·스킬과 `.specify/`의 일부 파일은 사본에서 생략되었다고 README에 적혀 있습니다. **기존 `.specify/memory/constitution.md`와 `openspec/config.yaml`을 덮어쓰지 마세요.** 초기화는 새 작업 사본에서 비교·검토합니다.
- OpenSpec의 `pnpm harness`는 `claude -p` 실행과 Git 커밋·태그를 수반하는 재현 러너입니다. 초보자의 기본 시작 명령이 아니며, 허락 없이 실행하지 않습니다. 문서의 스냅샷 태그가 현재 저장소에 존재한다고 여기서 보장하지 않습니다.
- 멀티셀러 다이어그램 재생성에는 해당 README에 안내된 PlantUML이 필요합니다. 소스 읽기·테스트 실행에 필수인 도구는 아닙니다.

## 문제가 생기면

파일 경로·실행 디렉터리·도구 버전·비식별 최소 재현·실제 오류 요약을 기록합니다. 비공개 로그나 키를 올릴 필요는 없습니다. 질문·버그·문서 개선의 제안 흐름은 [CONTRIBUTING](../CONTRIBUTING.md), 보안 문제는 [SECURITY](../SECURITY.md)의 비공개 요약 경로를 확인하세요. 저장소는 아직 비공개이며 외부 접근과 신고 기능의 활성화는 공개 후 실제 확인합니다.
