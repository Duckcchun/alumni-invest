// Supabase 프로젝트 > Project Settings > API 에서 복사해 넣으세요.
// 비워 두면 '데모 모드'로 동작합니다 (투표가 이 브라우저에만 저장됨).
window.APP_CONFIG = {
  SUPABASE_URL: "https://hqcfwgbnujyehzfdnkim.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxY2Z3Z2JudWp5ZWh6ZmRua2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDUwOTUsImV4cCI6MjEwNjQyMTA5NX0.eIwsUJCHFGSwRg4OTaBEzhV2dy0KS11vCUgCuseY_LM",

  // 투표 마감 시각 (ISO 8601). 데모 모드에서 D-day 표시에 쓰입니다.
  // 실제 Supabase 연결 시에는 event_config.closes_at 값이 우선합니다.
  CLOSES_AT: "2026-10-31T23:59:59+09:00",

  // 1표당 가상 투자금 (원)
  UNIT_KRW: 10000000,

  // 결과 새로고침 주기 (ms)
  POLL_MS: 15000,

  // 1위 리워드 문구
  REWARD: "", // 비워 두면 히어로의 리워드 배지가 숨겨져요

  // 문의처 (푸터에 표시)
  CONTACT: "멋쟁이사자처럼 14기 중앙운영단"
};
