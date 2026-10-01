// 어흥콘 출품팀 데이터 (리팩토링 보고서 PDF 기준)
// images: 대표 이미지 목록. 첫 장은 카드 커버, 전체는 팀 상세에서 넘겨 보는 갤러리로 나옵니다.
//   img/ 폴더에 "팀id-번호.jpg" 로 넣고 순서대로 적어 주세요. 예) images: ["img/aftor-1.jpg", "img/aftor-2.jpg"]
//   비워 두면 트랙 색 커버가 나옵니다. 권장: 가로 1200px, 3:2 비율, 장당 300KB 이하.
window.TEAMS = [
  {
    id: "aftor",
    service: "Aftor",
    team: "국경없는사자들",
    track: "LIKELION",
    images: ["img/aftor-1.jpg", "img/aftor-2.jpg"],
    tagline: "귀국 후까지 의료정보와 병원을 잇는 AI 크로스보더 협진 플랫폼",
    target: "해외에서 진료받고 귀국하는 환자, 한·일 협진 병원",
    desc: "해외에서 받은 진료 정보를 귀국 후 국내 병원까지 이어 줍니다. AI가 환자 위치를 기준으로 병원을 매칭하고, 양국 병원이 협진 합의안을 함께 검토해 확정합니다.",
    growth: "구글맵 주소 검색으로 실제 위치 기반 AI 병원 매칭을 붙이고, 양측이 최신 합의안을 모두 검토해야 확정되도록 협진 흐름을 바꿨어요. 라우트 lazy loading, N+1 쿼리 제거, AI 요청 timeout·중복 차단으로 속도와 비용도 잡았어요.",
    url: "https://borderlesslion-front.vercel.app/",
    github: ["https://github.com/2026-LIKELION-Hackathon-EWHA-Team2"]
  },
  {
    id: "travelguard",
    service: "TravelGuard",
    team: "말랑이",
    track: "LIKELION",
    images: ["img/travelguard-1.jpg", "img/travelguard-2.jpg"],
    tagline: "해외여행 중 도난·분실, 신고서 초안까지 AI가 함께하는 위기 대응",
    target: "해외여행 중 도난·분실 사고를 겪은 여행자",
    desc: "사고 경위를 텍스트나 음성으로 말하면 AI가 시간·장소·피해 물품을 정리해 사건 카드로 저장합니다. 가까운 경찰서·대사관·영사관 경로와 한·일 병기 신고서 초안까지 준비해 줍니다.",
    growth: "따로 놀던 가이드·지도·서류함을 하나의 사용자 흐름으로 잇고, 첫 화면 빠른 이용과 지도 탭, 카드·여권 분실 같은 유형별 가이드를 더했어요. 실제 사용자가 접속할 수 있는 배포 환경도 갖췄어요.",
    url: "",
    github: ["https://github.com/team-mallang/likelion-hackathon"]
  },
  {
    id: "picknu",
    service: "Pick Nu",
    team: "시원쿨쿨 멋터밤",
    track: "Open",
    images: ["img/picknu-1.jpg", "img/picknu-2.jpg"],
    tagline: "메뉴판만 보여 주면, 우리 인원·예산에 딱 맞는 주문 조합을 AI가",
    target: "여럿이 함께 식당에서 주문하는 사람들",
    desc: "식당의 QR·URL·메뉴판 이미지를 분석해 인원·예산·식사 성향에 맞는 메뉴 조합을 추천합니다. 총금액과 추천 이유까지 알려 줘 단체 주문의 메뉴 고민과 계산 부담을 덜어 줍니다.",
    growth: "AI 추천 결과에서 빠지던 단가·수량을 채우고, 재추천 때 같은 조합이 반복되지 않게 이전 결과를 관리하도록 바꿨어요. 금액 검증을 더하고, 같은 메뉴판에 요청이 몰려도 분석이 중복 실행되지 않게 했어요.",
    url: "",
    github: [
      "https://github.com/holybanguda/2026_hackerton_back",
      "https://github.com/holybanguda/2026hackerton/tree/final_frontend_fix1"
    ]
  },
  {
    id: "mcmorbit",
    service: "MCM Orbit",
    team: "꽃보다사자",
    track: "SJF",
    images: ["img/mcmorbit-1.jpg", "img/mcmorbit-2.jpg", "img/mcmorbit-3.jpg", "img/mcmorbit-4.jpg", "img/mcmorbit-5.jpg"],
    tagline: "방문 전부터 구매 이후까지, 고객 경험을 잇는 AI 클라이언텔링",
    target: "MCM 매장 고객과 매장 직원",
    desc: "고객의 구매 경험은 Arc, 구매 없이 다녀간 방문은 Visit Memory로 기록합니다. 다음에 매장을 찾으면 고객과 직원이 이전 경험을 이어서 대화할 수 있습니다.",
    growth: "QR 촬영 대신 NFC 태그 접촉만으로 바로 들어오도록 진입 방식을 바꿨어요. 서울·파리·뮌헨 매장 데이터를 더해, 서울에서 만든 Arc가 해외 매장까지 이어지는 글로벌 경험을 구현했어요.",
    url: "https://mcm-orbit.site/",
    github: ["https://github.com/TEAM-LIONTHANFLOWER"]
  },
  {
    id: "nextime",
    service: "NEXTiME",
    team: "금연한사자처럼",
    track: "AAC",
    images: ["img/nextime-1.jpg", "img/nextime-2.jpg", "img/nextime-3.jpg", "img/nextime-4.jpg", "img/nextime-5.jpg"],
    tagline: "흡연 욕구가 오는 11분, 그 순간에 개입하는 IoT·AI 감연 서비스",
    target: "담배를 줄이고 싶은 흡연자",
    desc: "담뱃갑 모양 IoT 기기의 버튼 한 번으로 흡연 욕구가 생긴 순간을 앱과 연결합니다. 줄이고 싶었던 이유를 다시 떠올리게 하고, 지금 할 대체 행동 하나를 제안하며, 결과를 쌓아 다음 추천을 개인화합니다.",
    growth: "'금연'에서 '감연'으로 서비스 방향을 다시 정의했어요. 텍스트 리포트를 한눈에 보이는 감연 대시보드로 바꾸고, Web Push 비동기 처리와 SSE로 IoT 버튼 이후 알림 속도와 안정성을 높였어요.",
    url: "https://next-time-eta.vercel.app",
    github: ["https://github.com/NEXTiME-LikeLion/NextTime"]
  },
  {
    id: "refit",
    service: "RE:FIT",
    team: "왕꿈트리",
    track: "AAC",
    images: ["img/refit-1.jpg", "img/refit-2.jpg", "img/refit-3.jpg", "img/refit-4.jpg", "img/refit-5.jpg"],
    tagline: "원하는 바디 쉐입과 지금의 내 몸을 비교해 설계하는 AI 운동 코치",
    target: "목표 체형을 향해 운동하는 사람",
    desc: "원하는 체형의 레퍼런스 사진과 내 인바디·체형 사진을 비교해 차이를 진단합니다. 골격과 근육량을 고려한 운동 목표와 맞춤 루틴을 주고, 피드백과 재측정 결과로 계획을 계속 조정합니다.",
    growth: "부스에서 반복된 '사진이 저장되나요?' 질문을 계기로 신체 사진 처리 구조를 바꿨어요. 짧고 정형화됐던 AI 비교 분석을 보강하고, 운동 에이전트의 루틴 맥락과 여러 사람이 찍힐 때의 자세 인식 UX를 개선했어요.",
    url: "https://www.refit.live/",
    github: ["https://github.com/KingDreamTree"]
  },
  {
    id: "momote",
    service: "momote",
    team: "수상한 아기사자들",
    track: "Open",
    images: ["img/momote-1.jpg"],
    tagline: "두 사람의 지금 감정을 보여 주고, 필요한 순간에만 돕는 AI 커플 메신저",
    target: "연인과 대화하는 커플",
    desc: "채팅방 위의 '실'이 두 사람의 감정 상태를 늘 보여 줍니다. 공격적인 표현을 보낸 사람에게만 말투 교정을 제안하고, 대화 속 단서로 데이트 코스와 관계 고민에 맞는 영상을 추천합니다.",
    growth: "데모용 고정 채팅방 하나뿐이던 구조를 벗어나 누구나 방을 만들고 상대를 초대할 수 있게 했어요. 메시지마다 30개 대화를 다시 채점하던 AI 파이프라인을 손봐 6~14초(최대 68초)이던 응답 지연을 줄였어요.",
    url: "https://momote.site",
    github: ["https://github.com/2026-likelion-ssu-hackathon"]
  },
  {
    id: "mxis",
    service: "MXIS",
    team: "더버버",
    track: "SJF",
    images: ["img/mxis-1.jpg", "img/mxis-2.jpg", "img/mxis-3.jpg", "img/mxis-4.jpg", "img/mxis-5.jpg"],
    tagline: "센서 참(Charm)과 AI로 명품 가죽 제품을 지키는 럭셔리 케어",
    target: "MCM 가죽 제품 고객",
    desc: "센서 디바이스 MXIS Charm을 제품에 달기만 하면 사용 환경과 충격 데이터가 자동으로 모입니다. AI가 맞춤 케어 가이드를 주고, 필요하면 무상 매장 케어와 MCM 컨시어지 예약까지 연결합니다.",
    growth: "화면 컴포넌트가 떠안던 API·상태·로직을 역할별로 나누고 중복 코드를 걷어냈어요. 백엔드는 센서 저장과 AI 진단을 분리하고 실패한 진단은 다시 처리하도록 해 센서→진단→조회 흐름을 안정화했어요.",
    url: "",
    github: ["https://github.com/Likelion14th-AnimalLeague-Team03"]
  },
  {
    id: "sott",
    service: "SOTT",
    team: "영크크 말고 봉크크",
    track: "AAC",
    images: ["img/sott-1.jpg"],
    tagline: "성분이 겹치는 화장품을 골라내 스킨케어 루틴을 덜어 주는 AI",
    target: "스킨케어 제품을 여러 개 쓰는 사람",
    desc: "쓰고 있는 화장품을 고르면 성분 겹침을 분석해 굳이 쓰지 않아도 되는 제품을 알려 줍니다. 새 제품을 들일 때는 기존 제품과의 궁합을 비교한 구매 추천 리포트도 발행합니다.",
    growth: "성분표를 하나하나 찍던 OCR 단계를 없애고 브랜드 사이트에서 2,481건의 제품 데이터를 직접 모아 API를 새로 짰어요. 제품을 지나치게 빼던 LLM 분석 기준도 고쳤어요.",
    url: "https://www.sott.site",
    github: ["https://github.com/NO-YCC-YES-BCC"]
  },
  {
    id: "aura-aura",
    service: "AURA",
    team: "AURA",
    track: "SJF",
    images: ["img/aura-aura-1.jpg"],
    tagline: "처음 명품을 사는 사람을 위한 상담부터 관리·커뮤니티까지",
    target: "명품을 처음 구입하는 사람",
    desc: "무엇을 살지 상담하는 단계부터 구매 기록, 상태 관리, 같은 물건을 가진 사람들과의 정보 공유까지 하나의 흐름으로 잇는 웹 서비스입니다.",
    growth: "토큰 만료 때 refresh가 동시에 여러 번 호출되던 문제를 고치고, 요청 대기 중 피드백을 더했어요. 사용자 상태에 따라 문구가 달라지게 하고, 방문 카드 저장이 채팅 흐름으로 자연스럽게 이어지도록 다듬었어요.",
    url: "",
    github: ["https://github.com/14th-Hackathon-AURA"]
  },
  {
    id: "hale",
    service: "HALE",
    team: "오리스웰",
    track: "AAC",
    images: ["img/hale-1.jpg", "img/hale-2.jpg", "img/hale-3.jpg", "img/hale-4.jpg"],
    tagline: "시술 후 매일 달라지는 피부에 맞춘 AI 회복 루틴",
    target: "피부 시술을 받은 사람",
    desc: "시술 정보와 매일의 피부 상태를 AI로 분석해 오늘 필요한 회복 루틴을 알려 주는 피부 회복 케어 솔루션입니다.",
    growth: "단일 계정이라 여러 명이 동시에 쓰면 데이터가 덮어쓰이던 구조를 게스트 로그인으로 바꿨어요. 더운 날 '온찜질' 같은 엉뚱한 조언이 나오지 않게 회복 단계와 실시간 날씨·자외선을 체크리스트에 반영하고, 온보딩 화면도 더했어요.",
    url: "https://hale-zeta.vercel.app/",
    github: ["https://github.com/duckswell"]
  },
  {
    id: "closer",
    service: "CLOSER",
    team: "초코숭이",
    track: "SJF",
    images: ["img/closer-1.jpg", "img/closer-2.jpg", "img/closer-3.jpg", "img/closer-4.jpg", "img/closer-5.jpg"],
    tagline: "매장 속 행동으로 취향을 읽는 AR 피팅·개인화 리테일 플랫폼",
    target: "오프라인 매장을 운영하는 브랜드(B2B)와 매장 고객",
    desc: "매장에서의 탐색·선택·AR 피팅·찜 행동을 추천 모델 RecRec에 반영해 지금 관심사에 맞는 상품을 추천합니다. 방문 후에는 취향을 아바타로 보여 주고 피팅 기록을 Digital Closet에 남겨 재방문으로 잇습니다.",
    growth: "흩어져 있던 API 응답과 예외 처리를 한데 모으고, 외부 서버 장애가 사용자 실패로 번지지 않게 했어요. 추천 데이터에 관심 강도와 최근성을 반영하고, 위시리스트·검색·쇼핑백으로 AR 피팅을 실제 쇼핑 여정에 이었어요.",
    url: "https://www.mcm-showcase.com/",
    github: [
      "https://github.com/o25e/mcm-showcase-frontend",
      "https://github.com/sunguk0410/mcmshowcase-backend"
    ]
  },
  {
    id: "aura-eagle",
    service: "AURA",
    team: "독수리 6형제",
    track: "SJF",
    images: ["img/aura-eagle-1.jpg", "img/aura-eagle-2.jpg", "img/aura-eagle-3.jpg", "img/aura-eagle-4.jpg", "img/aura-eagle-5.jpg"],
    tagline: "착장을 읽고 세상에 하나뿐인 MCM 가방을 만드는 인터랙티브 미러",
    target: "MCM 매장 방문객",
    desc: "거울 앞에 서면 AI가 착장에서 컬러 팔레트와 무드를 뽑아내고, 손을 뻗어 꾸미는 동안 나만의 가방이 완성됩니다. 그 순간은 숏폼 영상과 디지털 보증서 Soul Tag로 남아 SNS와 구매로 이어집니다.",
    growth: "모두에게 같던 액세서리 두 종을 늘려 커스터마이징의 '나만의' 가치를 살렸어요. 단일 노드 DB의 쓰기·조회 간섭을 풀고, 2초보다 오래 대야 붙던 아우라 핸드(가상 커서)의 거리 인식을 개선했어요.",
    url: "https://aura-frontend-dun.vercel.app/",
    github: [
      "https://github.com/jiyoung0531/aura-frontend",
      "https://github.com/kimtaehee829/aura-backend"
    ]
  },
  {
    id: "tagonai",
    service: "TagOn AI",
    team: "사춘기온사자",
    track: "SJF",
    images: ["img/tagonai-1.jpg"],
    tagline: "NFC 태그 한 번으로 시작하는 명품 매장 AI 컨시어지",
    target: "MCM 매장 고객과 매장 직원(SA)",
    desc: "매장에서 NFC 태그로 익명 세션을 열면 AI가 초개인화 제품을 추천하고 질문에 답합니다. 관심 상품은 여권(Journey Card) 콜라주에 모이고, 직원 응대가 필요하면 SA 대시보드로 호출이 갑니다.",
    growth: "해커톤 땐 없던 직원용 SA 대시보드를 만들어 접수·승인·완료 상태를 실제 서버와 연결했어요. 추천 상품 이메일 발송을 붙이고, 첫 화면에서 1.5MB를 받던 폰트와 무거운 3D 파티클을 실기기 기준으로 줄였어요.",
    url: "https://tagonai.site",
    github: ["https://github.com/orgs/SAONLION/repositories"]
  },
  {
    id: "mcmportal",
    service: "MCM PORTAL",
    team: "가천미인",
    track: "SJF",
    images: ["img/mcmportal-1.jpg", "img/mcmportal-2.jpg", "img/mcmportal-3.jpg", "img/mcmportal-4.jpg"],
    tagline: "착장의 무드를 읽어 어울리는 MCM World로 데려가는 AI 포토 체험",
    target: "MCM 매장 방문객",
    desc: "실제 MCM 제품을 착용하고 여행 스타일을 고르면 AI가 착장의 색·톤으로 무드를 판정해 어울리는 공간을 매칭합니다. 사람과 제품은 그대로 둔 채 배경만 바뀐 사진을 남기고, QR로 관심 제품까지 이어 봅니다.",
    growth: "버튼을 눌러야 하던 촬영을 위치·거리 안내와 재시도·재촬영·확정 흐름으로 다듬어 체험을 안정화했어요. 서버 환경을 새로 구성하고, 만료된 촬영 세션과 이미지를 자동으로 정리하도록 했어요.",
    url: "https://mcmportal.duckdns.org",
    github: [
      "https://github.com/likelion-gachon1/sjf_track",
      "https://github.com/likelion-gachon1/sjf_BE"
    ]
  }
];
