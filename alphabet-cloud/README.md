# 알파벳 학습 · Supabase / Vercel

`public/`은 배포 원본입니다. `node build.cjs`로 `dist/`를 만듭니다. Vercel의 Root Directory는 `alphabet-cloud`입니다.

Supabase Auth의 Email 가입을 켜고 Confirm email을 끕니다. 아이디는 소문자로 통일하고 `아이디@students.classroom.invalid`를 인증 식별자로 사용합니다. 실제 메일은 수집·발송하지 않습니다. 가입 제한과 요청 빈도 제한은 Supabase Auth에 적용됩니다. 학생용 클라이언트에는 publishable key만 제공합니다.

학습 데이터는 `schema.sql`의 RLS로 본인만 읽고 추가할 수 있습니다. 가입 아이디는 Auth 이메일의 유일성으로 중복을 방지합니다. 공용 기기를 고려해 로그인은 메모리에만 유지하며 새로고침하면 다시 로그인합니다. 완료된 기록은 서버에 유지됩니다.

비밀번호 분실 시 학생은 담당 교사에게 문의합니다. 교사는 본인 확인 뒤 Supabase 프로젝트 관리자 권한으로 `reset-password.cjs`를 실행합니다. 학생에게 관리자 키를 제공하지 마세요. 계정 및 기록 삭제 요청은 관리자가 처리합니다.
