# kosta-ai-lab 공개 포털 (`site/`)

kosta-ai-lab의 공개 취지를 소개하고, AI-Native SDLC 로드맵과 지금 열람할 수 있는 공개 자료(프로젝트·강의·코드 예제)로 연결하는 정적 사이트입니다. 교재와 실습은 사이트에 복사하지 않고 GitHub 원본으로 연결합니다.

```bash
cd site
node scripts/build.mjs          # site/dist 생성 (허용 목록 파일만)
node scripts/check.mjs --dist   # 원본 경로·상태 근거·승인 문구·메타·meta CSP·상대 경로·워크플로·산출물 재현성 검사
node scripts/test.mjs           # 데이터·변조 검출·화면 동작 회귀·갱신 대응·빌드·서버 테스트
node scripts/serve.mjs --port 0 # http://127.0.0.1:<빈 포트>/ai-native-sdlc/  (루트로 보려면 --base /)
```

Node.js 18.17 이상이 필요하며 설치할 의존성은 없습니다. 자세한 내용은 [운영 안내](../docs/LEARNING_SITE_OPERATIONS.md)와 [화면 명세](../docs/LEARNING_SITE_DESIGN.md)를 참고하세요.

- 소개 문구·메타데이터·meta CSP: `src/index.html`
- 화면: `src/story.css`·`src/layers.css`(스타일), `src/motion-core.js`(무대 계산)·`src/layers.js`(영역 펼침·자료 상세)·`src/story.js`(렌더·스크롤)
- 로드맵·공개 항목 연결: `data/portal.json`
- 원본 링크와 근거: `data/sources.json`
- 사이트 코드 라이선스: Apache License 2.0. 연결된 교재는 각 원본의 라이선스(교육자료 CC BY-NC 4.0 등)를 따릅니다.
