# OpenSpec 실제 커맨드 (검증 기록)

> Task 2 산출물. 하네스 `steps.yaml`은 이 문서의 **확인된 커맨드**만 사용한다(추측 금지).

- **버전**: OpenSpec **1.5.0** (2026-07-08 확인, `openspec --version`)
- **설치**: `npm i -g @fission-ai/openspec@latest`

## 비대화형 초기화 (헤드리스 안전)

```bash
openspec init --tools claude --force
```
- `--tools claude` : Claude Code용 통합 파일·슬래시 커맨드를 비대화형으로 설치.
- `--force` : legacy 파일 자동 정리(프롬프트 없음).
- 생성되는 슬래시 커맨드의 정확한 이름/접두는 **init 실행 후 산출물에서 확정**(Task 6). 웹 자료의 `/opsx:*`는 참고값.

## AI 지시 생성 (하네스 핵심)

```bash
openspec instructions [artifact] --change <id> [--json]
```
- artifact 생성(제안·스펙 등)을 위한 enriched 지시를 CLI가 출력.
- **하네스 전략**: 슬래시 커맨드를 `claude -p`에 직접 넣는 대신, `openspec instructions`로 받은 지시를 `claude -p` 프롬프트에 주입 → CLI 기반이라 헤드리스에서 안정적. (Task 7에서 실동작 확정)

## 주요 CLI 커맨드

| 커맨드 | 용도 |
|--------|------|
| `openspec init --tools claude --force` | 초기화 |
| `openspec list` / `openspec list --specs` | 변경/스펙 목록 |
| `openspec show [item]` | 변경·스펙 조회(md/json) |
| `openspec validate [item]` | 변경·스펙 검증 (단계 gate) |
| `openspec status --change <id>` | 변경의 artifact 완료 상태 |
| `openspec archive [change]` | 완료 변경 아카이브 + main 스펙 갱신 |
| `openspec instructions ... --change <id>` | AI용 지시 생성 |
| `openspec context` | 현재 작업 컨텍스트 출력 |

## 검증에 쓸 커맨드 (하네스 gate)

- 스펙 생성 확인: `openspec list` 비어있지 않음 + `openspec validate --strict` 통과
- 아카이브 확인: `openspec/changes/archive/` 존재
