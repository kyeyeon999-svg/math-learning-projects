# 일기 없는 공개 배포

두 프로젝트는 별도 컴파일이 없는 HTML/CSS/JavaScript 정적 사이트입니다. 저장소의 프로젝트 폴더 전체나 기존 로컬 서버를 공개하지 말고 아래 빌드가 출력하는 **단일 프로젝트 릴리스 폴더만** 정적 호스팅의 문서 루트로 사용하세요. 두 사이트는 각각 도메인 또는 서브도메인 루트에 배치하는 구성을 기준으로 합니다. 실제 호스팅 설정은 아직 검증하지 않았습니다.

## 로컬 빌드와 검증

Node.js 24 이상이 설치된 환경에서 작업 폴더 루트 기준:

```text
node build-public.cjs math-hub
node build-public.cjs math-play
node --test public-release.test.cjs
cd math-hub
node --test --test-skip-pattern=HTTP tests/*.test.js
cd ../math-play
node check.cjs
```

각 빌드는 public-releases 아래 새 폴더를 만들고 절대 경로를 출력합니다. 기존 릴리스는 덮어쓰지 않습니다. 실패한 빌드의 폴더는 배포하지 마세요. npm을 사용할 수 있다면 각 프로젝트의 `npm run build`도 같은 빌드를 호출합니다. 설치나 npm install은 필요하지 않습니다. 오프라인 테스트는 HTTP 검증을 제외하므로 전체 테스트 통과와 구별해야 합니다. 전체 hub 검증 명령은 `npm test` 또는 `node --test tests/*.test.js`이며 로컬 HTTP 접속이 허용되어야 합니다.

빌드는 허용 목록의 정적 자산만 복사합니다. hub는 공개 앱 목록을 별도로 생성하고 diary 디렉터리, diary-store.cjs, server.cjs를 포함하지 않습니다. 따라서 일기 카드·화면·API가 공개 패키지에 없습니다. 기존 로컬 일기 기능과 데이터는 보존되며 `start.cmd`/`npm start`는 여전히 **로컬 전용**입니다. 정적 호스팅에 /api 프록시나 원본 프로젝트 fallback을 연결하지 마세요. 파일이 없는 경로는 404를 반환해야 합니다. SPA fallback은 사용하지 않습니다.

## 환경설정과 비밀정보

공개 정적 사이트에는 .env, API 키, DB, 서버 환경변수가 필요하지 않습니다. 브라우저 자산에는 비밀정보를 넣지 마세요. `.env` 파일을 올려도 앱이 자동으로 읽지 않습니다. 로컬 전용 서버만 다음 값을 사용합니다.

| 변수 | 대상 | 기본값 | 공개 배포 |
|---|---|---|---|
| PORT | hub / play | 4190 / 4180 | 사용 안 함 |
| DIARY_DATA_DIR | hub 로컬 일기 | 사용자 로컬 MathHub/diary-data | 사용·이전 안 함 |
| LOCALAPPDATA | hub 로컬 경로 fallback | 운영체제 사용자 경로 | 사용 안 함 |

## 호스팅에서 별도 적용할 항목 — 미확인

HTTPS, 올바른 JavaScript/WASM MIME 타입, GET/HEAD 제한, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, 프레임 삽입 차단 응답 헤더를 설정해야 합니다. CSP는 현재 페이지의 inline 스타일 및 PDF.js Worker/WASM과 호환되는지 브라우저 검증 후 적용해야 하며, PDF 페이지의 기존 meta CSP만으로 WASM 동작을 보장하지 않습니다. 헤더 설정은 호스팅 업체에 따라 달라 실제 서버 설정을 아직 생성·적용하지 않았습니다.

실제 브라우저에서 학습 완주·재도전·저장 실패 안내와 PDF 파일 선택·암호·취소·Worker/WASM을 합성 자료로 확인해야 합니다. /diary/index.html 및 /api/diary의 404, 원본 서버·DB 접근 불가도 실제 호스팅에서 확인해야 합니다. 최신 Node/PDF.js 취약점 조회, 네트워크 관찰, 클라우드 접속 로그의 보관/개인정보 정책 검토는 미확인입니다. 빌드 성공은 공개 배포 승인이 아닙니다.
