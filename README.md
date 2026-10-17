# 초등 수학 학습 프로젝트

초등 수학 학습 허브(math-hub)와 수학 게임(math-play)의 소스 모음입니다.

- Node.js 24 이상으로 각 폴더의 start.cmd 또는 node server.cjs를 실행합니다.
- math-hub의 일기장은 로컬 전용이며, 실제 일기 데이터는 저장소에 포함하지 않습니다. 암호화와 사용자 인증 기능이 없으므로 서버를 외부에 공개하지 마세요.
- 웹 공개 배포는 node build-public.cjs math-hub 또는 node build-public.cjs math-play로 생성한 정적 폴더만 사용합니다. 공개 빌드는 일기 기능과 API를 제외합니다.
- 상세 안내: [공개 배포](PUBLIC-DEPLOYMENT.md), [보안 검토](SECURITY-REVIEW.md).
- 포함된 PDF.js 및 폰트/WASM의 라이선스는 vendor 안의 원문을 따릅니다.

GitHub 소스 공개와 웹사이트 배포는 별개입니다.
