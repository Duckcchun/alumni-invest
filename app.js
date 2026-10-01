(() => {
  const CFG = window.APP_CONFIG || {};
  const TEAMS = window.TEAMS || [];
  const TEAM_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]));
  const UNIT = CFG.UNIT_KRW || 10000000;
  const DEMO = !(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const MY_VOTE_KEY = "aheung-invest:my-vote";
  const DEMO_KEY = "aheung-invest:demo-votes";
  const DEMO_COMMENTS_KEY = "aheung-invest:demo-comments";
  const VOTED_UNKNOWN = "__voted__"; // 투표는 했지만 어느 팀인지 모르는 경우 (다른 기기·이미 쓴 이메일)
  const CTYPE = { cheer: "응원해요", impressive: "인상적이에요", suggest: "이렇게 해 보면 어때요" };
  const WALL_PAGE = 12;

  const $ = s => document.querySelector(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  // ───────── API ─────────
  const sb = DEMO ? null : window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  const api = {
    async results() {
      if (DEMO) {
        const votes = JSON.parse(store.get(DEMO_KEY) || "{}");
        const counts = {};
        Object.values(votes).forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        return counts;
      }
      const { data, error } = await sb.rpc("get_results");
      if (error) throw error;
      return Object.fromEntries((data || []).map(r => [r.team_id, Number(r.votes)]));
    },
    async config() {
      if (DEMO) return { closes_at: CFG.CLOSES_AT || null };
      const { data, error } = await sb.rpc("get_event_config");
      if (error) throw error;
      return (data && data[0]) || { closes_at: null };
    },
    async comments() {
      if (DEMO) return JSON.parse(store.get(DEMO_COMMENTS_KEY) || "[]");
      const { data, error } = await sb.rpc("get_comments");
      if (error) throw error;
      return data || [];
    },
    async vote(email, generation, teamId, { comment = "", type = null, isPublic = true } = {}) {
      if (DEMO) {
        const votes = JSON.parse(store.get(DEMO_KEY) || "{}");
        const key = email.trim().toLowerCase();
        if (votes[key]) return "already_voted";
        votes[key] = teamId;
        store.set(DEMO_KEY, JSON.stringify(votes));
        if (comment && isPublic) {
          const list = JSON.parse(store.get(DEMO_COMMENTS_KEY) || "[]");
          list.unshift({ id: Date.now(), team_id: teamId, generation: generation || null, comment_type: type, comment, created_at: new Date().toISOString() });
          store.set(DEMO_COMMENTS_KEY, JSON.stringify(list));
        }
        return "ok";
      }
      const { data, error } = await sb.rpc("cast_vote", {
        p_email: email, p_generation: generation, p_team_id: teamId,
        p_comment: comment || null, p_comment_type: comment ? type : null, p_is_public: isPublic
      });
      if (error) throw error;
      return data;
    }
  };

  // ───────── state ─────────
  const state = {
    counts: {},
    closesAt: null,
    track: "전체",
    sort: "shuffle",
    order: shuffle(TEAMS.map(t => t.id)),
    showAllRanks: false,
    myVote: store.get(MY_VOTE_KEY),
    current: null,
    loaded: false, // 첫 결과를 받기 전엔 스켈레톤 표시
    comments: [],
    wallTeam: "전체",
    wallLimit: WALL_PAGE,
    dlgAllComments: false
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // FLIP 애니메이션: 다시 그리기 전 위치를 기억(snap) → 그린 뒤(play) 원래 자리에서 새 자리로 이동.
  // 새로 나타난 요소는 살짝 떠오르며 등장.
  function flipSnap(container, selector) {
    const rects = {};
    container.querySelectorAll(selector).forEach(el => { rects[el.dataset.id] = el.getBoundingClientRect(); });
    return rects;
  }
  function flipPlay(container, selector, before, { enterNew = true } = {}) {
    if (reduceMotion) return;
    container.querySelectorAll(selector).forEach((el, i) => {
      const old = before[el.dataset.id];
      const now = el.getBoundingClientRect();
      if (old) {
        const dx = old.left - now.left, dy = old.top - now.top;
        if (!dx && !dy) return;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      } else if (enterNew) {
        el.animate(
          [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
          { duration: 280, delay: Math.min(i, 8) * 25, easing: "ease-out", fill: "backwards" }
        );
      }
    });
  }

  // 숫자 카운트업 (el.dataset.v 에 이전 값 보관)
  function countTo(el, to, fmt) {
    const from = Number(el.dataset.v ?? to);
    el.dataset.v = to;
    if (reduceMotion || from === to) { el.textContent = fmt(to); return; }
    const start = performance.now(), dur = 600;
    const step = now => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(from + (to - from) * eased));
      if (p < 1 && el.dataset.v == to) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ───────── format ─────────
  function krw(votes) {
    const won = votes * UNIT;
    if (won === 0) return "₩0";
    const eok = Math.floor(won / 1e8);
    const man = Math.round((won % 1e8) / 1e4);
    let s = "₩";
    if (eok) s += eok.toLocaleString("ko-KR") + "억";
    if (man) s += (eok ? " " : "") + man.toLocaleString("ko-KR") + "만";
    return s;
  }
  function unitLabel() {
    const man = UNIT / 1e4;
    return man >= 1e4 ? `${man / 1e4}억 원` : `${man.toLocaleString("ko-KR")}만 원`;
  }
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const displayName = t => TEAMS.filter(x => x.service === t.service).length > 1 ? `${t.service} (${t.team})` : t.service;
  const isClosed = () => state.closesAt && Date.now() > new Date(state.closesAt).getTime();

  // 트랙별 커버 색 (멋사 BI 팔레트만 사용) [배경, 글자]
  const TRACK_STYLE = {
    LIKELION: ["#FF6000", "#FFFFFF"],
    SJF: ["#1C1C1C", "#FFFFFF"],
    AAC: ["#FFE066", "#1C1C1C"],
    Open: ["#F2EDE6", "#1C1C1C"]
  };

  // 팀 이미지 목록 (images 배열, 예전 thumb 한 장도 지원)
  const teamImages = t => (Array.isArray(t.images) ? t.images : t.thumb ? [t.thumb] : []).filter(Boolean);

  function coverHTML(t, extra = "") {
    const imgs = teamImages(t);
    const img = imgs.length ? `<img src="${esc(imgs[0])}" alt="" loading="lazy" decoding="async" />` : "";
    const more = imgs.length > 1 ? `<span class="cover-more">+${imgs.length - 1}</span>` : "";
    const [bg, fg] = TRACK_STYLE[t.track] || TRACK_STYLE.Open;
    return `<div class="cover ${imgs.length ? "has-img" : ""}" style="--c:${bg};--c-ink:${fg}">
      ${img}
      <div class="cover-top"><span class="track-tag">${esc(t.track)}</span>${extra || more}</div>
      <div class="cover-name">${esc(t.service)}</div>
    </div>`;
  }

  // ───────── render ─────────
  function ranked() {
    return TEAMS.map(t => ({ t, v: state.counts[t.id] || 0 }))
      .sort((a, b) => b.v - a.v || a.t.service.localeCompare(b.t.service));
  }

  function renderStats() {
    const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
    if (state.loaded) {
      countTo($("#statFund"), total, krw);
      countTo($("#statInvestors"), total, n => `${n.toLocaleString("ko-KR")}명`);
    } else {
      $("#statFund").innerHTML = $("#statInvestors").innerHTML = `<span class="skel skel-text"></span>`;
    }
    if (state.closesAt) {
      const d = new Date(state.closesAt);
      if (isClosed()) {
        $("#statDeadlineLabel").textContent = "상태";
        $("#statDeadline").textContent = "마감";
      } else {
        const days = Math.ceil((d - Date.now()) / 864e5);
        $("#statDeadlineLabel").textContent = `마감 ${d.getMonth() + 1}/${d.getDate()}`;
        $("#statDeadline").textContent = days <= 1 ? "오늘 마감" : `D-${days - 1}`;
      }
    } else {
      $("#statDeadlineLabel").textContent = "상태";
      $("#statDeadline").textContent = "진행 중";
    }
  }

  function renderRanks() {
    const list = ranked();
    const max = Math.max(1, ...list.map(r => r.v));
    const total = list.reduce((a, r) => a + r.v, 0);
    const shown = state.showAllRanks ? list : list.slice(0, 5);
    const el = $("#rankList");
    if (!state.loaded) {
      el.innerHTML = Array.from({ length: 5 }, () =>
        `<li class="rank-item is-skel" aria-hidden="true"><span class="skel skel-no"></span><div class="rank-main"><span class="skel skel-text"></span><div class="bar"></div></div><span class="skel skel-fund"></span></li>`).join("");
      $("#rankToggle").hidden = true;
      return;
    }
    if (!total) {
      el.innerHTML = `<li class="rank-empty">아직 투자가 없어요. 첫 투자자가 되어 주세요.</li>`;
      $("#rankToggle").hidden = true;
      return;
    }
    // 스켈레톤·빈 상태에서 처음 그릴 때는 등장 효과 없이
    const hadRows = !!el.querySelector(".rank-item[data-id]");
    const before = flipSnap(el, ".rank-item[data-id]");
    let prev = null, rank = 0;
    el.innerHTML = list.map((r, i) => {
      if (r.v !== prev) { rank = i + 1; prev = r.v; }
      r.rank = rank;
      return r;
    }).filter(r => shown.includes(r)).map(r => `
      <li class="rank-item ${r.rank === 1 && r.v ? "top1" : ""}" data-id="${r.t.id}" tabindex="0">
        <span class="rank-no">${r.v ? r.rank : "–"}</span>
        <div class="rank-main">
          <div class="rank-name">${esc(r.t.service)}<span>${esc(r.t.team)}</span></div>
          <div class="bar"><i style="width:${(r.v / max) * 100}%"></i></div>
        </div>
        <div class="rank-fund">${krw(r.v)}<small>${r.v}표 · ${Math.round((r.v / total) * 100)}%</small></div>
      </li>`).join("");
    // 순위 이동은 미끄러지게, "전체 순위 보기"로 늘어난 행은 떠오르며 등장
    flipPlay(el, ".rank-item[data-id]", before, { enterNew: hadRows });
    $("#rankToggle").hidden = false;
    $("#rankToggle").textContent = state.showAllRanks ? "상위 5팀만 보기" : `전체 순위 보기 (${TEAMS.length}팀)`;
  }

  function renderChips() {
    const tracks = ["전체", ...new Set(TEAMS.map(t => t.track))];
    $("#chips").innerHTML = tracks.map(tr => {
      const n = tr === "전체" ? TEAMS.length : TEAMS.filter(t => t.track === tr).length;
      const label = tr === "전체" ? "전체" : `${tr} 트랙`;
      const on = state.track === tr;
      return `<button type="button" class="chip ${on ? "is-active" : ""}" data-track="${esc(tr)}" aria-pressed="${on}">${esc(label)}<em>${n}</em></button>`;
    }).join("");
  }

  function renderGrid() {
    let ids = state.sort === "fund"
      ? ranked().map(r => r.t.id)
      : state.order;
    if (state.track !== "전체") ids = ids.filter(id => TEAM_BY_ID[id].track === state.track);
    const grid = $("#grid");
    const before = flipSnap(grid, ".card");
    const hadCards = Object.keys(before).length > 0;
    grid.innerHTML = ids.map(id => {
      const t = TEAM_BY_ID[id];
      const mine = state.myVote === id;
      return `<button type="button" class="card ${mine ? "is-mine" : ""}" data-id="${id}" aria-label="${esc(displayName(t))} 자세히 보기">
        ${coverHTML(t, mine ? `<span class="mine-tag">내가 투자한 팀</span>` : "")}
        <div class="card-body">
          <span class="card-team">${teamImages(t).length ? `<b class="card-service">${esc(t.service)}</b> · ` : ""}${esc(t.team)}</span>
          <p class="card-tagline">${esc(t.tagline)}</p>
          <div class="card-foot"><b class="card-fund" data-v="${state.counts[id] || 0}">${state.loaded ? krw(state.counts[id] || 0) : "–"}</b><span class="more">IR 보기 →</span></div>
        </div>
      </button>`;
    }).join("");
    // 필터·정렬 변경 시 남는 카드는 새 자리로 미끄러지고, 새로 보이는 카드는 떠오르며 등장
    if (hadCards) flipPlay(grid, ".card", before);
  }

  // 카드는 그대로 두고 금액 숫자만 갱신 (hover·포커스 유지)
  function updateGridFunds() {
    document.querySelectorAll("#grid .card").forEach(card => {
      countTo(card.querySelector(".card-fund"), state.counts[card.dataset.id] || 0, krw);
    });
  }

  let lastFundOrder = "";
  function renderAll({ full = false } = {}) {
    renderStats();
    renderRanks();
    // 투자금 순 정렬이 바뀌었거나 강제 갱신일 때만 카드를 다시 그림
    const fundOrder = state.sort === "fund" ? ranked().map(r => r.t.id).join() : "";
    if (full || fundOrder !== lastFundOrder) renderGrid();
    else updateGridFunds();
    lastFundOrder = fundOrder;
    if (state.current) renderDialogFund();
  }

  // ───────── 선배들의 한마디 ─────────
  const NOTE_TONES = ["y", "g", "w"]; // BI 옐로우 · 베이스 그레이 · 화이트를 번갈아
  function genLabel(g) {
    if (!g) return "익명의 선배";
    if (g === "운영진/기타") return "운영진 · 기타";
    return `${g} 선배`;
  }
  function noteHTML(c, i, { showTeam = true } = {}) {
    const t = TEAM_BY_ID[c.team_id];
    const tone = NOTE_TONES[Number(c.id) % NOTE_TONES.length] || NOTE_TONES[i % 3];
    const type = CTYPE[c.comment_type];
    return `<figure class="note note-${tone}" data-id="${esc(c.id)}">
      ${type ? `<span class="note-type">${esc(type)}</span>` : ""}
      <blockquote>${esc(c.comment)}</blockquote>
      <figcaption>${esc(genLabel(c.generation))}${showTeam && t
        ? ` → <button type="button" class="note-team" data-team="${esc(t.id)}">${esc(displayName(t))}</button>` : ""}</figcaption>
    </figure>`;
  }

  function renderWall() {
    const grid = $("#wallGrid");
    const chips = $("#wallChips");
    if (!state.loaded) {
      grid.innerHTML = Array.from({ length: 3 }, () => `<div class="note note-g is-skel" aria-hidden="true"><span class="skel skel-text"></span><span class="skel skel-text"></span></div>`).join("");
      return;
    }
    const all = state.comments.filter(c => TEAM_BY_ID[c.team_id]);
    $("#wallCount").textContent = all.length ? `${all.length.toLocaleString("ko-KR")}개` : "";

    // 한마디가 있는 팀만 칩으로
    const byTeam = {};
    all.forEach(c => { byTeam[c.team_id] = (byTeam[c.team_id] || 0) + 1; });
    if (state.wallTeam !== "전체" && !byTeam[state.wallTeam]) state.wallTeam = "전체";
    const teamIds = Object.keys(byTeam).sort((a, b) => byTeam[b] - byTeam[a]);
    chips.hidden = teamIds.length < 2;
    chips.innerHTML = [["전체", "전체", all.length], ...teamIds.map(id => [id, displayName(TEAM_BY_ID[id]), byTeam[id]])]
      .map(([id, label, n]) => {
        const on = state.wallTeam === id;
        return `<button type="button" class="chip ${on ? "is-active" : ""}" data-wall-team="${esc(id)}" aria-pressed="${on}">${esc(label)}<em>${n}</em></button>`;
      }).join("");

    const list = state.wallTeam === "전체" ? all : all.filter(c => c.team_id === state.wallTeam);
    const before = flipSnap(grid, ".note[data-id]");
    const hadNotes = Object.keys(before).length > 0;
    grid.innerHTML = list.length
      ? list.slice(0, state.wallLimit).map((c, i) => noteHTML(c, i)).join("")
      : `<p class="wall-empty">아직 남겨진 한마디가 없어요. 투자할 때 한마디를 함께 남길 수 있어요.</p>`;
    if (hadNotes) flipPlay(grid, ".note[data-id]", before);
    const more = $("#wallMore");
    more.hidden = list.length <= state.wallLimit;
    more.textContent = `더 보기 (${list.length - Math.min(list.length, state.wallLimit)}개)`;
  }

  // ───────── 히어로 한마디 띠 ─────────
  const TICKER_MIN = CFG.TICKER_MIN || 6;   // 이만큼 모이기 전엔 띠를 숨김 (휑해 보이지 않게)
  const TICKER_SPEED = 38;                   // px/초
  const seenCommentIds = new Set();
  let tickerFirst = true;

  function tickHTML(c, isNew) {
    const t = TEAM_BY_ID[c.team_id];
    const tone = NOTE_TONES[Number(c.id) % NOTE_TONES.length] || "g";
    const type = CTYPE[c.comment_type];
    return `<button type="button" class="tick tick-${tone} ${isNew ? "is-new" : ""}" data-team="${esc(t.id)}"
        aria-label="${esc(genLabel(c.generation))}이 ${esc(displayName(t))}에 남긴 한마디: ${esc(c.comment)}. 팀 IR 보기">
      <span class="tick-top">${type ? `<span class="tick-type">${esc(type)}</span>` : ""}${isNew ? `<span class="tick-new">방금</span>` : ""}</span>
      <span class="tick-text">${esc(c.comment)}</span>
      <span class="tick-by">${esc(genLabel(c.generation))} → <b>${esc(displayName(t))}</b></span>
    </button>`;
  }

  function renderTicker() {
    const box = $("#ticker");
    const list = state.comments.filter(c => TEAM_BY_ID[c.team_id]);
    // 새로 들어온 한마디 표시 (첫 로딩분은 제외)
    const fresh = new Set(tickerFirst ? [] : list.filter(c => !seenCommentIds.has(c.id)).map(c => c.id));
    list.forEach(c => seenCommentIds.add(c.id));
    tickerFirst = false;

    if (list.length < TICKER_MIN) { box.hidden = true; return; }
    const wasHidden = box.hidden;
    box.hidden = false;
    $("#tickerCount").textContent = list.length.toLocaleString("ko-KR");

    // 두 줄로 나눔. 적으면 두 줄 모두 전체를 쓰되 순서를 다르게.
    const rows = list.length >= 16
      ? [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)]
      : [list, list.slice().reverse()];

    box.querySelectorAll(".ticker-row").forEach((row, r) => {
      const track = row.querySelector(".ticker-track");
      // 다시 그려도 흐르던 위치에서 이어지도록 진행률을 기억
      const anim = track.getAnimations ? track.getAnimations()[0] : null;
      const frac = (anim && anim.effect && anim.effect.getComputedTiming().progress) || 0;

      const items = rows[r].map(c => tickHTML(c, fresh.has(c.id))).join("");
      track.innerHTML = `<div class="ticker-set">${items}</div>`;
      // 한 세트가 화면 폭보다 짧으면 반복해서 빈틈이 없게
      const set = track.firstElementChild;
      const need = row.clientWidth || window.innerWidth;
      const w1 = set.scrollWidth || 1;
      const reps = Math.max(1, Math.ceil(need / w1));
      if (reps > 1) set.innerHTML = items.repeat(reps);
      // 이어 붙일 복제본은 보조기기·키보드에서 제외 (inert)
      track.insertAdjacentHTML("beforeend", `<div class="ticker-set" aria-hidden="true" inert>${set.innerHTML}</div>`);
      const dur = Math.max(20, set.scrollWidth / TICKER_SPEED);
      track.style.setProperty("--dur", `${dur}s`);
      track.style.animationDelay = `-${(frac * dur).toFixed(2)}s`;
    });

    if (wasHidden && !reduceMotion) box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
    if (fresh.size) {
      clearTimeout(renderTicker._t);
      renderTicker._t = setTimeout(() => {
        box.querySelectorAll(".tick.is-new").forEach(el => el.classList.remove("is-new"));
        box.querySelectorAll(".tick-new").forEach(el => el.remove());
      }, 20000);
    }
  }

  function setTickerPaused(paused) {
    const box = $("#ticker"), btn = $("#tickerPause");
    box.classList.toggle("is-paused", paused);
    btn.setAttribute("aria-pressed", paused);
    btn.querySelector(".ticker-pause-label").textContent = paused ? "재생" : "멈추기";
  }

  function renderDialogComments() {
    const box = $("#dlgComments");
    const list = state.comments.filter(c => c.team_id === state.current);
    box.hidden = !list.length;
    if (!list.length) { box.innerHTML = ""; return; }
    const shown = state.dlgAllComments ? list : list.slice(0, 3);
    box.innerHTML = `<h4>선배들의 한마디 <span class="h4-count">${list.length}</span></h4>
      <div class="dlg-notes">${shown.map((c, i) => noteHTML(c, i, { showTeam: false })).join("")}</div>
      ${list.length > 3 ? `<button type="button" class="text-btn" data-dlg-more>${state.dlgAllComments ? "접기" : `${list.length - 3}개 더 보기`}</button>` : ""}`;
  }

  // ───────── dialog ─────────
  const dlg = $("#teamDialog");

  const PANES = { view: "#dlgView", form: "#investForm", done: "#doneView" };
  function showPane(name) {
    Object.entries(PANES).forEach(([k, sel]) => {
      const el = $(sel);
      const show = k === name;
      const wasHidden = el.hidden;
      el.hidden = !show;
      // 팝업이 이미 열린 상태에서 화면이 바뀔 때만 살짝 페이드
      if (show && wasHidden && dlg.open && !reduceMotion) {
        el.animate([{ opacity: 0, transform: "translateX(12px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
      }
    });
  }

  function renderDialogFund() {
    const t = TEAM_BY_ID[state.current];
    $("#dlgFund").textContent = `${krw(state.counts[t.id] || 0)} · ${state.counts[t.id] || 0}표`;
    const btn = $("#dlgInvestBtn");
    if (isClosed()) { btn.disabled = true; btn.textContent = "투자가 마감됐어요"; }
    else if (state.myVote) {
      btn.disabled = true;
      btn.textContent = state.myVote === t.id ? "이 팀에 투자하셨어요"
        : state.myVote === VOTED_UNKNOWN ? "이미 투자하셨어요" : "이미 다른 팀에 투자하셨어요";
    } else { btn.disabled = false; btn.textContent = "이 팀에 투자하기"; }
  }

  // 저장소 주소로 프론트/백엔드를 추정해 버튼 이름을 붙임. 판단이 안 되면 번호로.
  function repoLabels(repos) {
    if (repos.length === 1) return [[repos[0], "GitHub"]];
    const kind = g => /(front(end)?|[_-]fe)(?=$|[_\-/])/i.test(g) ? "front"
      : /(back(end)?|[_-]be)(?=$|[_\-/])/i.test(g) ? "back" : null;
    let kinds = repos.map(kind);
    // 2개 중 하나만 판별되면 나머지는 반대쪽으로 봄
    if (repos.length === 2 && kinds.filter(Boolean).length === 1) {
      const known = kinds.find(Boolean);
      kinds = kinds.map(k => k || (known === "front" ? "back" : "front"));
    }
    const name = { front: "GitHub · 프론트엔드", back: "GitHub · 백엔드" };
    return repos.map((g, i) => [g, name[kinds[i]] || `GitHub ${i + 1}`]);
  }

  // 팀 상세 상단: 이미지가 있으면 넘겨 보는 갤러리, 없으면 트랙 색 커버
  function galleryHTML(t, imgs) {
    const n = imgs.length;
    return `<div class="gal" data-n="${n}" role="region" aria-roledescription="carousel" aria-label="${esc(t.service)} 이미지">
      <div class="gal-track" tabindex="0">
        ${imgs.map((src, i) => `<figure class="gal-slide" aria-label="${i + 1} / ${n}">
          <img src="${esc(src)}" alt="${esc(t.service)} 화면 ${i + 1}" ${i ? 'loading="lazy"' : ""} decoding="async" /></figure>`).join("")}
      </div>
      <button type="button" class="gal-nav gal-prev" data-gal="-1" aria-label="이전 이미지" disabled>‹</button>
      <button type="button" class="gal-nav gal-next" data-gal="1" aria-label="다음 이미지">›</button>
      <div class="gal-dots">${imgs.map((_, i) => `<button type="button" class="gal-dot" data-gal-to="${i}" aria-label="${i + 1}번째 이미지"${i ? "" : ' aria-current="true"'}></button>`).join("")}</div>
      <span class="gal-count" aria-hidden="true">1 / ${n}</span>
    </div>`;
  }
  function galleryIndex(track) { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
  function syncGallery(gal) {
    const track = gal.querySelector(".gal-track");
    const n = Number(gal.dataset.n), i = Math.min(n - 1, galleryIndex(track));
    gal.querySelectorAll(".gal-dot").forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"));
    gal.querySelector(".gal-count").textContent = `${i + 1} / ${n}`;
    gal.querySelector(".gal-prev").disabled = i === 0;
    gal.querySelector(".gal-next").disabled = i === n - 1;
  }
  function galleryGo(gal, i) {
    const track = gal.querySelector(".gal-track");
    const n = Number(gal.dataset.n);
    i = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function openTeam(id, fromHistory = false) {
    const t = TEAM_BY_ID[id];
    if (!t) return;
    state.current = id;
    const imgs = teamImages(t);
    const coverBox = $("#dlgCover");
    coverBox.classList.toggle("has-gal", imgs.length > 0);
    coverBox.innerHTML = imgs.length ? galleryHTML(t, imgs) : coverHTML(t);
    $("#dlgTrack").textContent = `${t.track} 트랙`;
    $("#dlgTeam").textContent = `팀 ${t.team}`;
    $("#dlgTitle").textContent = t.service;
    $("#dlgTagline").textContent = t.tagline;
    $("#dlgTarget").textContent = t.target;
    $("#dlgDesc").textContent = t.desc;
    $("#dlgGrowth").textContent = t.growth;
    const links = [];
    if (t.url) links.push(`<a class="link-btn" href="${esc(t.url)}" target="_blank" rel="noopener">서비스 바로가기 ↗</a>`);
    repoLabels(t.github || []).forEach(([g, label]) => links.push(`<a class="link-btn" href="${esc(g)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`));
    $("#dlgLinks").innerHTML = links.join("");
    state.dlgAllComments = false;
    renderDialogComments();
    renderDialogFund();
    showPane("view");
    if (!dlg.open) {
      dlg.classList.remove("is-closing");
      dlg.showModal();
      // 주소를 ?team=id 로 바꿔 두면 뒤로가기로 팝업만 닫히고, 주소 그대로 공유 가능
      if (fromHistory) history.replaceState({ team: id }, "", `?team=${encodeURIComponent(id)}`);
      else history.pushState({ team: id }, "", `?team=${encodeURIComponent(id)}`);
    }
    dlg.scrollTop = 0;
  }

  // 닫힘 애니메이션 후 실제로 닫음. 우리가 쌓은 history 항목이면 뒤로 돌려 주소도 원래대로.
  let afterClose = null;
  function closeDialog() {
    if (!dlg.open || dlg.classList.contains("is-closing")) return;
    if (history.state && history.state.team) { history.back(); return; } // popstate에서 finishClose
    finishClose();
  }
  function finishClose() {
    if (!dlg.open) return;
    if (reduceMotion) { dlg.close(); return; }
    dlg.classList.add("is-closing");
    dlg.addEventListener("animationend", () => { dlg.classList.remove("is-closing"); dlg.close(); }, { once: true });
  }

  function openForm() {
    if (isClosed()) { toast("투자가 마감됐어요."); return; }
    if (state.myVote) { toast("이 브라우저에서는 이미 투자하셨어요. 투자는 1회만 가능해요."); return; }
    const t = TEAM_BY_ID[state.current];
    $("#formTeam").textContent = displayName(t);
    $("#formUnit").textContent = unitLabel();
    $("#formError").textContent = "";
    showPane("form");
    dlg.scrollTop = 0;
    setTimeout(() => $("#fEmail").focus(), 50);
  }

  // 자주 나오는 이메일 도메인 오타 → 바른 도메인
  const DOMAIN_FIX = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com", "gmail.cm": "gmail.com",
    "naver.con": "naver.com", "naver.co": "naver.com", "nave.com": "naver.com", "naber.com": "naver.com", "naver.cm": "naver.com",
    "daum.nte": "daum.net", "daum.ne": "daum.net", "duam.net": "daum.net", "daum.com": "daum.net",
    "hanmail.ne": "hanmail.net", "hanmail.com": "hanmail.net", "hanmali.net": "hanmail.net",
    "kakao.con": "kakao.com", "nate.con": "nate.com", "icloud.con": "icloud.com", "hotmail.con": "hotmail.com", "outlook.con": "outlook.com"
  };
  function emailSuggestion(email) {
    const m = email.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+)$/);
    if (!m || !DOMAIN_FIX[m[2]]) return null;
    return `${m[1]}@${DOMAIN_FIX[m[2]]}`;
  }
  function updateEmailHint() {
    const hint = $("#emailHint");
    const s = emailSuggestion($("#fEmail").value);
    hint.hidden = !s;
    hint.innerHTML = s ? `혹시 <b>${esc(s)}</b> 아니세요? <button type="button" class="hint-fix" data-fix="${esc(s)}">고치기</button>` : "";
  }

  async function submitVote(e) {
    e.preventDefault();
    const email = $("#fEmail").value.trim();
    const gen = $("#fGen").value;
    const err = $("#formError");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "이메일 주소를 확인해 주세요."; return; }
    if (!$("#fAgree").checked) { err.textContent = "이메일 수집에 동의해 주세요."; return; }
    const comment = $("#fComment").value.trim().slice(0, 200);
    const type = (document.querySelector('input[name="ctype"]:checked') || {}).value || "cheer";
    const isPublic = !$("#fPrivate").checked;
    const btn = $("#formSubmit");
    btn.disabled = true; btn.textContent = "처리 중…";
    try {
      const res = await api.vote(email, gen, state.current, { comment, type, isPublic });
      if (res === "ok") {
        state.myVote = state.current;
        store.set(MY_VOTE_KEY, state.current);
        state.counts[state.current] = (state.counts[state.current] || 0) + 1;
        const note = !comment ? ""
          : isPublic ? " 남겨 주신 한마디는 '선배들의 한마디'에 올라가요."
          : " 남겨 주신 한마디는 팀에게만 전달돼요.";
        $("#doneText").textContent = `${displayName(TEAM_BY_ID[state.current])}에 ${unitLabel()}을 투자하셨어요. 순위에 바로 반영돼요.${note}`;
        $("#fComment").value = ""; $("#fCount").textContent = "0/200"; $("#fPrivate").checked = false;
        showPane("done");
        renderAll({ full: true });
        refresh();
      } else if (res === "already_voted") {
        // 이 이메일이 어느 팀에 투표했는지는 알 수 없으니 팀 표시 없이 '투표함'만 기억
        if (!state.myVote) { state.myVote = VOTED_UNKNOWN; store.set(MY_VOTE_KEY, VOTED_UNKNOWN); }
        err.textContent = "이 이메일로는 이미 투자하셨어요. 투자는 1인 1회예요.";
        renderAll({ full: true });
      } else if (res === "closed") {
        err.textContent = "투자가 마감됐어요.";
      } else if (res === "invalid_email") {
        err.textContent = "이메일 주소를 확인해 주세요.";
      } else {
        err.textContent = "투자를 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
      }
    } catch (ex) {
      console.error(ex);
      err.textContent = "네트워크 문제로 투자하지 못했어요. 잠시 후 다시 시도해 주세요.";
    } finally {
      btn.disabled = false; btn.textContent = "투자 확정";
    }
  }

  // ───────── data refresh ─────────
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      // 한마디 조회가 실패해도 순위는 갱신되도록 따로 처리
      const [counts, comments] = await Promise.all([
        api.results(),
        api.comments().catch(e => { console.error(e); return state.comments; })
      ]);
      const sig = list => `${list.length}:${list[0] ? list[0].id : ""}`;
      const commentsChanged = !state.loaded || sig(comments) !== sig(state.comments);
      state.counts = counts;
      state.comments = comments;
      state.loaded = true;
      renderAll();
      // 한마디가 바뀌었을 때만 벽을 다시 그림 (스크롤·포커스 유지)
      if (commentsChanged) {
        renderWall();
        renderTicker();
        if (state.current) renderDialogComments();
      }
    } catch (e) {
      console.error(e);
    } finally { refreshing = false; }
  }

  // 투자 후 순위표로 스크롤하고 내 팀 행을 잠깐 강조
  function scrollToMyRank() {
    const id = state.myVote;
    // 내 팀이 상위 5위 밖이면 전체 순위를 펼침
    if (id && !state.showAllRanks && !$(`#rankList .rank-item[data-id="${CSS.escape(id)}"]`)) {
      state.showAllRanks = true; renderRanks();
    }
    const row = id && $(`#rankList .rank-item[data-id="${CSS.escape(id)}"]`);
    (row || $("#boardTitle")).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (row) { row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash"); }
    toast("투자가 반영됐어요.");
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  // ───────── init ─────────
  function init() {
    if (DEMO) $("#demoBanner").hidden = false;
    $("#unitLabel").textContent = unitLabel();
    if (CFG.REWARD) $("#reward").innerHTML = `<span class="reward-label">1위 리워드</span>${esc(CFG.REWARD)}`;
    if (CFG.CONTACT) $("#contact").textContent = `문의 · ${CFG.CONTACT}`;

    const gens = ['<option value="">선택 안 함</option>'];
    for (let i = 1; i <= 13; i++) gens.push(`<option value="${i}기">${i}기</option>`);
    gens.push('<option value="운영진/기타">운영진 · 기타</option>');
    $("#fGen").innerHTML = gens.join("");

    renderChips();
    renderAll({ full: true });
    renderWall();

    // 한마디 벽: 팀 필터, 더 보기, 팀 이름 누르면 IR 열기
    $("#wallChips").addEventListener("click", e => {
      const b = e.target.closest("[data-wall-team]"); if (!b || b.dataset.wallTeam === state.wallTeam) return;
      state.wallTeam = b.dataset.wallTeam; state.wallLimit = WALL_PAGE; renderWall();
    });
    $("#wallMore").addEventListener("click", () => { state.wallLimit += WALL_PAGE; renderWall(); });

    // 한마디 띠: 카드 누르면 IR, 멈춤 버튼, 화면 밖이면 자동 정지, 폭 바뀌면 반복 수 재계산
    $("#ticker").addEventListener("click", e => { const b = e.target.closest(".tick"); if (b) openTeam(b.dataset.team); });
    $("#tickerPause").addEventListener("click", () => setTickerPaused(!$("#ticker").classList.contains("is-paused")));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => $("#ticker").classList.toggle("is-offscreen", !en.isIntersecting)).observe($("#ticker"));
    }
    let resizeT;
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (window.innerWidth === lastW) return; // 모바일 주소창 높이 변화는 무시
        lastW = window.innerWidth;
        if (!$("#ticker").hidden) renderTicker();
      }, 200);
    });
    $("#wallGrid").addEventListener("click", e => { const b = e.target.closest("[data-team]"); if (b) openTeam(b.dataset.team); });
    // 팀 상세 갤러리: 화살표·점 클릭, 스와이프 후 위치 동기화, 키보드 좌우
    const cover = $("#dlgCover");
    cover.addEventListener("click", e => {
      const gal = e.target.closest(".gal"); if (!gal) return;
      const step = e.target.closest("[data-gal]"), to = e.target.closest("[data-gal-to]");
      if (step) galleryGo(gal, galleryIndex(gal.querySelector(".gal-track")) + Number(step.dataset.gal));
      else if (to) galleryGo(gal, Number(to.dataset.galTo));
    });
    cover.addEventListener("scroll", e => {
      if (!e.target.classList || !e.target.classList.contains("gal-track")) return;
      clearTimeout(cover._t); cover._t = setTimeout(() => syncGallery(e.target.closest(".gal")), 60);
    }, true);
    cover.addEventListener("keydown", e => {
      const gal = e.target.closest(".gal"); if (!gal || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      galleryGo(gal, galleryIndex(gal.querySelector(".gal-track")) + (e.key === "ArrowRight" ? 1 : -1));
    });
    $("#dlgComments").addEventListener("click", e => {
      if (e.target.closest("[data-dlg-more]")) { state.dlgAllComments = !state.dlgAllComments; renderDialogComments(); }
    });
    $("#fComment").addEventListener("input", e => { $("#fCount").textContent = `${e.target.value.length}/200`; });

    $("#chips").addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      if (state.track === b.dataset.track) return;
      state.track = b.dataset.track;
      // 칩은 다시 그리지 않고 클래스만 바꿔서 색 전환이 부드럽게
      document.querySelectorAll("#chips .chip").forEach(c => {
        const on = c === b;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on);
      });
      renderGrid();
    });
    document.querySelectorAll(".sort-btn").forEach(b => b.addEventListener("click", () => {
      if (state.sort === b.dataset.sort && b.dataset.sort === "fund") return;
      state.sort = b.dataset.sort;
      if (state.sort === "shuffle") state.order = shuffle(state.order);
      document.querySelectorAll(".sort-btn").forEach(x => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b); });
      renderGrid();
    }));
    $("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openTeam(c.dataset.id); });
    $("#rankList").addEventListener("click", e => { const r = e.target.closest(".rank-item"); if (r) openTeam(r.dataset.id); });
    $("#rankList").addEventListener("keydown", e => {
      const r = e.target.closest(".rank-item");
      if (r && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openTeam(r.dataset.id); }
    });
    $("#rankToggle").addEventListener("click", () => { state.showAllRanks = !state.showAllRanks; renderRanks(); });
    $("#dlgInvestBtn").addEventListener("click", openForm);
    $("#formBack").addEventListener("click", () => showPane("view"));
    $("#investForm").addEventListener("submit", submitVote);
    $("#fEmail").addEventListener("blur", updateEmailHint);
    $("#fEmail").addEventListener("input", () => { if (!$("#emailHint").hidden) updateEmailHint(); });
    $("#emailHint").addEventListener("click", e => {
      const b = e.target.closest(".hint-fix"); if (!b) return;
      $("#fEmail").value = b.dataset.fix; updateEmailHint(); $("#fEmail").focus();
    });
    dlg.addEventListener("click", e => {
      if (e.target.closest("[data-to-rank]")) { afterClose = scrollToMyRank; closeDialog(); }
      else if (e.target.closest("[data-close]")) closeDialog();
      else if (e.target === dlg) closeDialog(); // backdrop
    });
    // ESC 키도 닫힘 애니메이션을 거치게
    dlg.addEventListener("cancel", e => { e.preventDefault(); closeDialog(); });
    dlg.addEventListener("close", () => {
      state.current = null;
      if (afterClose) { const fn = afterClose; afterClose = null; fn(); }
    });
    // 어흥콘 소개 팝업 (팀 상세 위에 겹쳐 열려도 됨)
    const about = $("#aboutDialog");
    const closeAbout = () => {
      if (!about.open || about.classList.contains("is-closing")) return;
      if (reduceMotion) { about.close(); return; }
      about.classList.add("is-closing");
      about.addEventListener("animationend", () => { about.classList.remove("is-closing"); about.close(); }, { once: true });
    };
    document.addEventListener("click", e => {
      if (e.target.closest("[data-open-about]")) { about.showModal(); about.scrollTop = 0; }
    });
    about.addEventListener("click", e => {
      if (e.target.closest("[data-close-about]") || e.target === about) closeAbout();
    });
    about.addEventListener("cancel", e => { e.preventDefault(); closeAbout(); });

    window.addEventListener("popstate", e => {
      const id = e.state && e.state.team;
      if (id && TEAM_BY_ID[id]) openTeam(id, true);
      else finishClose();
    });

    api.config().then(c => { state.closesAt = c.closes_at; renderAll(); }).catch(console.error);
    refresh();
    setInterval(() => { if (!document.hidden) refresh(); }, CFG.POLL_MS || 15000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });

    // ?team=aftor 로 들어오면 해당 팀 IR 바로 열기 (뉴스레터 딥링크용)
    // 기본 주소를 한 칸 깔아 두고 그 위에 팀 주소를 쌓아서, 닫으면 ?team 없는 주소로 돌아감
    const q = new URLSearchParams(location.search).get("team");
    if (q && TEAM_BY_ID[q]) {
      history.replaceState(null, "", location.pathname);
      openTeam(q);
    }
  }

  init();
})();
