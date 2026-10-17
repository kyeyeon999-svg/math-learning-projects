# 알파벳 학습 · Supabase / Vercel

`public/`은 배포 원본입니다. `node build.cjs`로 `dist/`를 만듭니다. Vercel의 Root Directory는 `alphabet-cloud`입니다.

Supabase Auth의 Email 가입과 Confirm email을 유지합니다. 사용자 요청에 따라 이메일 확인을 생략하지 않습니다. 아이디는 이메일 주소이며 가입 확인 메일의 링크를 누른 뒤 로그인합니다. 가입 제한과 요청 빈도 제한은 Supabase Auth에 적용됩니다. 학생용 클라이언트에는 publishable key만 제공합니다. Auth의 Site URL에는 실제 Vercel 프로덕션 주소를 등록해야 합니다.

현재 Site URL은 https://classroom-alphabet.vercel.app 입니다. 실제 학생 가입 전 Custom SMTP 설정이 필요합니다. Supabase 기본 SMTP는 조직 팀원에게만 발송하므로 학생들에게 관리자 팀 권한을 부여하는 것으로 해결하지 마세요. 메일 서버 비밀키는 Supabase 콘솔에만 입력하고 소스에 저장하지 않습니다.

학습 데이터는 `schema.sql`의 RLS로 본인만 읽고 추가할 수 있습니다. 가입 아이디는 Auth 이메일의 유일성으로 중복을 방지합니다. 공용 기기를 고려해 로그인은 메모리에만 유지하며 새로고침하면 다시 로그인합니다. 완료된 기록은 서버에 유지됩니다.

비밀번호 분실 시 학생은 담당 교사에게 문의합니다. 교사는 본인 확인 뒤 Supabase 프로젝트 관리자 권한으로 `reset-password.cjs`를 실행합니다. 학생에게 관리자 키를 제공하지 마세요. 계정 및 기록 삭제 요청은 관리자가 처리합니다.
