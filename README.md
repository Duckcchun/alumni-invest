# 알럼나이 모의 엔젤 투자 페이지

어흥콘 출품 15팀에 알럼나이가 가상 투자금(1인 1표)을 넣는 투표 페이지입니다. 빌드 과정이 없는 정적 사이트이고, 투표는 Supabase에 저장됩니다.

```
index.html        페이지
style.css         스타일
app.js            동작 (투표, 실시간 순위, 필터)
teams.js          15팀 데이터 ← 문구·썸네일 수정은 여기서
config.js         Supabase 키, 투자 단위, 리워드 문구
supabase/schema.sql
```

## 1. 로컬에서 미리 보기

```bash
cd alumni-invest
python3 -m http.server 8000   # → http://localhost:8000
```

`config.js`가 비어 있으면 **데모 모드**로 동작합니다(투표가 내 브라우저에만 저장).

## 2. Supabase 설정 (5분)

1. supabase.com에서 새 프로젝트 생성
2. **SQL Editor**에 `supabase/schema.sql` 전체를 붙여 넣고 Run
3. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사해 `config.js`에 붙여 넣기

anon 키는 공개돼도 괜찮습니다. 테이블은 RLS로 막혀 있고 `cast_vote` / `get_results` 함수로만 접근해 이메일은 밖으로 나가지 않습니다.

## 3. Vercel 배포

- GitHub에 올린 뒤 Vercel에서 Import → Framework: **Other**, Build Command 비움, Output: 루트
- 또는 `npx vercel --prod`

## 운영 팁

- **마감 설정**: SQL Editor에서 `update event_config set closes_at = '2026-10-12 23:59:59+09' where id = 1;` → 페이지에 D-day가 뜨고, 마감 후 투표가 막힙니다.
- **팀 딥링크**: `https://…/?team=aftor` 처럼 열면 해당 팀 IR이 바로 열립니다. (id는 `teams.js` 참고)
- **대표 이미지**: `img/` 폴더에 `팀id-번호.jpg`로 넣고 `teams.js`의 해당 팀에 `images: ["img/aftor-1.jpg", "img/aftor-2.jpg"]`처럼 순서대로 적어 주세요. 첫 장은 카드 커버, 전체는 팀 상세 갤러리로 나옵니다. 없으면 트랙 색 커버가 나옵니다. (가로 1200px · 3:2 · 장당 300KB 이하 권장)
- **최종 순위/기수별 참여**: `schema.sql` 하단 운영용 쿼리 참고
- **선배의 한마디**: 투자할 때 선택으로 남기며 이메일당 1개입니다. 공개 한마디는 하단 "선배들의 한마디" 벽과 팀 상세에 기수와 함께 표시되고, 이메일은 노출되지 않습니다.
  - 문제 있는 글 숨기기: `update votes set hidden = true where id = 123;`
  - 팀별 전달용(비공개 포함) 목록: `schema.sql` 하단 운영용 쿼리 참고
- **이메일 파기**: 이벤트 종료 후 `update votes set email = 'deleted-' || id;`

## 참고

- 1인 1표는 이메일 기준입니다. 이메일 인증은 하지 않으므로, 1위 발표 전에 수상한 이메일(같은 도메인 대량 등)은 SQL로 한 번 훑어보는 걸 권장합니다.
- 팀 소개 문구는 각 팀 리팩토링 보고서(PDF)를 바탕으로 정리했습니다. 게시 전에 각 팀에 한 번 확인받으면 좋습니다.
