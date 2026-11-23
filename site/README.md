# kosta-ai-lab 학습 로드맵 (`site/`)

학생이 무엇부터, 어떤 자료로, 어떻게 배울지 보여 주는 정적 사이트입니다. 강사들이 이 저장소에 공개한 강의 교재와 실습 가이드를 배우는 순서대로 잇습니다. 교재와 실습은 사이트에 복사하지 않고 GitHub 원본으로 연결합니다.

공개 주소: https://kosta-ai-lab.github.io/ai-native-sdlc/

```bash
cd site
node scripts/build.mjs          # site/dist 생성 (허용 목록 파일만)
node scripts/check.mjs --dist   # 데이터와 원본 대조, 화면 원본·CSP·글꼴·워크플로·산출물 검사
node scripts/test.mjs           # 계산·검사·빌드·서버 시험
node scripts/serve.mjs --port 0 # http://127.0.0.1:<빈 포트>/ai-native-sdlc/  (루트로 보려면 --base /)
```

Node.js 18.17 이상이 필요하며 설치할 의존성은 없습니다. 자세한 내용은 [운영 안내](../docs/LEARNING_SITE_OPERATIONS.md)와 [화면 명세](../docs/LEARNING_SITE_DESIGN.md)를 참고하세요.

- 로드맵·단계·자료의 내용: `data/roadmap.json`
- 고정 문구·메타데이터·meta CSP: `src/index.html`
- 화면: `src/app.css`(스타일), `src/core.js`(계산), `src/app.js`(화면 동작)
- 글꼴: `src/fonts/`, `src/fonts.css`. `scripts/fonts.py`가 만드는 생성 파일입니다.
- 사이트 코드 라이선스: Apache License 2.0. 글꼴은 SIL Open Font License 1.1([제3자 자료 고지](../THIRD_PARTY_NOTICES.md)). 연결된 교재는 각 원본의 라이선스(교육자료 CC BY-NC 4.0 등)를 따릅니다.
