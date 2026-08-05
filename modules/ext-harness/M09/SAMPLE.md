# 예제 실행: 5분 안에 첫 루프 만들어 보기

아래는 그대로 따라 하면 되는 최소 실습 시나리오입니다.

```bash
# 0. 실습용 폴더 준비 (이미 git 프로젝트가 있다면 그 폴더에서 진행해도 됩니다)
mkdir my-loop-demo && cd my-loop-demo
git init

# 1. 루프 뼈대 생성 (Claude Code 사용 예시)
npx @cobusgreyling/loop init . --pattern daily-triage --tool claude

# 2. 어떤 파일이 생겼는지 확인
ls -la
# STATE.md, LOOP.md, loop-budget.md, loop-run-log.md 등이 보이면 성공

# 3. 비용 미리 확인
npx @cobusgreyling/loop cost --pattern daily-triage --level L1 --cadence 1d

# 4. 준비 상태 점수 확인
npx @cobusgreyling/loop audit . --suggest

# 5. Claude Code 안에서 아래 명령을 실행 (1주차: 코드 수정 없이 상태 파일만 갱신)
# /loop 1d Run $loop-triage. Read STATE.md. Merge findings into High Priority and Watch List. Update Last run. Do not edit code.

# 6. 결과 확인 후 커밋
git add .
git commit -m "루프 엔지니어링 첫 실행: daily-triage 스캐폴드 및 STATE.md 초기화"
```

이 순서대로 진행하면, "Loop Ready 점수가 0점대에서 올라가는 것"과 "STATE.md가 채워지는 것"을 직접 확인할 수 있습니다. (저장소의 데모 스크립트 `scripts/before-after-demo.sh` 도 점수 변화를 시각적으로 보여줍니다.)
