// community.js
// 49사주 대나무숲 - Cloudflare D1 + Pages Functions 기반

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 상수
  // ─────────────────────────────────────────────
  const SESSION_KEY      = 'saju_session_id';
  const NICKNAME_KEY     = 'saju_nickname';
  const NICKNAME_SRC_KEY = 'saju_nickname_source';
  const RESULT_CACHE_KEY = 'saju_result_cache';
  const PAGE_SIZE        = 20;
  const API_BASE         = '/api';  // Cloudflare Pages Functions

  // ─────────────────────────────────────────────
  // 닉네임 생성 재료
  // ─────────────────────────────────────────────
  const ADJECTIVES = [
    '불타는', '차가운', '눈물 많은', '고집 센', '계획적인',
    '외로운', '쾌활한', '날카로운', '따뜻한', '깊은',
    '낙천적인', '예민한', '묵묵한', '반짝이는', '조용한',
    '신중한', '자유로운', '당당한', '섬세한', '엉뚱한'
  ];

  const GAN_NOUNS = {
    '甲': ['갑목일간', '봄나무'],  '乙': ['을목일간', '봄꽃'],
    '丙': ['병화일간', '여름태양'],'丁': ['정화일간', '촛불'],
    '戊': ['무토일간', '산'],      '己': ['기토일간', '들판'],
    '庚': ['경금일간', '단검'],    '辛': ['신금일간', '보석'],
    '壬': ['임수일간', '대해'],    '癸': ['계수일간', '봄비']
  };

  const FALLBACK_NOUNS = [
    '인프피', '엔팁', 'INFJ궁합러', '사주탐험가',
    '무토인간', '수목형인간', '오행탐구자', '별자리덕후'
  ];

  const GAN_TAG_MAP = {
    '甲':'갑목일간','乙':'을목일간','丙':'병화일간','丁':'정화일간',
    '戊':'무토일간','己':'기토일간','庚':'경금일간','辛':'신금일간',
    '壬':'임수일간','癸':'계수일간'
  };

  // ─────────────────────────────────────────────
  // 씨앗 댓글 (API 실패/빈 상태 폴백)
  // ─────────────────────────────────────────────
  const SEED_COMMENTS = [
    {
      id: 'seed_1', nickname: '따뜻한 정화일간',
      text: '처음으로 사주 봤는데 너무 신기해요 😮 제가 왜 이렇게 감성적이고 눈물이 많은지 드디어 이해됐어요 ㅎㅎ 정화일간이라 촛불처럼 따뜻하지만 혼자 타오른다고 하더라고요. 공감되는 분 계신가요? 🕯️',
      card: { dayPillar:'丁卯', tags:['#감수성풍부','#섬세함','#따뜻한마음'], mbtiSoulmate:'ISFJ', mbtiChar:'🕯️', summary:'어둠 속에서도 꺼지지 않는 촛불처럼, 당신은 주변 사람들에게 따뜻한 빛을 나눠주는 존재입니다...' },
      tags:['#정화일간'], reactions:{ heart:24, wow:8, same:31 },
      createdAt: Date.now() - 1000*60*14
    },
    {
      id: 'seed_2', nickname: '외로운 임수일간',
      text: '임수일간이라 생각이 너무 많다는 게 찰떡같이 맞아요 ㅋㅋ 소울메이트가 INTP라고 나왔는데... 솔직히 지적이고 대화 잘 통하는 사람 만나고 싶어요. 사주 보고 나서 내가 어떤 사람을 원하는지 더 선명해진 느낌? 여기 INTP 분 계시면 반가워요 👋',
      card: { dayPillar:'壬午', tags:['#생각많음','#넓은포부','#지혜로움'], mbtiSoulmate:'INTP', mbtiChar:'🌊', summary:'드넓은 바다처럼 깊고 포용력 있는 당신, 흐름을 읽는 탁월한 직관으로 어디서든 리더가 될 운명입니다...' },
      tags:['#임수일간','#인연운'], reactions:{ heart:41, wow:12, same:19 },
      createdAt: Date.now() - 1000*60*60*2
    },
    {
      id: 'seed_3', nickname: '반짝이는 신금일간',
      text: '이번에 드디어 취업했어요!! 🎉 직업 적성 파트에서 나온 분야가 제가 지원한 곳이랑 딱 맞더라고요. 사주 보고 나서 확신이 생겼달까요? 다들 취업 준비 중이시면 적성 파트 꼭 읽어보세요. 진짜 도움 됐어요!',
      card: null, tags:['#신금일간','#취업운'], reactions:{ heart:67, wow:22, same:14 },
      createdAt: Date.now() - 1000*60*60*5
    },
    {
      id: 'seed_4', nickname: '묵묵한 무토일간',
      text: '혼자 살다 보니 사주라도 봐야 위로가 되더라고요 ㅎㅎ 무토일간이라 산처럼 듬직하대요... 근데 현실은 집에서 혼자 사주 보는 사람😅 그래도 오행 분석 읽으면서 나 이런 면이 있었구나 하고 의외로 위안이 많이 됐어요. 여기 혼자인 분들 반가워요.',
      card: { dayPillar:'戊申', tags:['#듬직함','#신뢰','#중재자기질'], mbtiSoulmate:'ESTP', mbtiChar:'⛰️', summary:'태산처럼 흔들리지 않는 당신, 묵묵히 버티는 힘이 남다릅니다...' },
      tags:['#무토일간','#고민상담'], reactions:{ heart:88, wow:6, same:74 },
      createdAt: Date.now() - 1000*60*60*11
    },
    {
      id: 'seed_5', nickname: '깊은 갑목일간',
      text: '여기 계신 분들 혹시 상대방 일주 보고 궁합 생각해보신 적 있어요? 저 좋아하는 사람이 을목일간이라는데 목기끼리 잘 맞는 건지 너무 궁금해서요 😅 사주로 궁합 보는 거 믿으세요?',
      card: null, tags:['#갑목일간','#인연운'], reactions:{ heart:33, wow:17, same:28 },
      createdAt: Date.now() - 1000*60*60*18
    },
    {
      id: 'seed_6', nickname: '엉뚱한 계수일간',
      text: '계수일간이라 생각이 많고 걱정을 사서 한다는 말이... 진짜 너무 맞아서 소름 ㅠㅠ 나쁜 건 안 맞았으면 했는데 왜 이런 건 다 맞지. 근데 신기한 건 읽고 나서 오히려 위로가 됐어요. 나만 이런 게 아니구나 싶어서요.',
      card: { dayPillar:'癸丑', tags:['#총명함','#유연함','#생각많음'], mbtiSoulmate:'INTP', mbtiChar:'💧', summary:'대지를 촉촉이 적시는 봄비처럼, 당신의 섬세한 감수성은 메마른 마음에 생기를 불어넣는 특별한 재능입니다...' },
      tags:['#계수일간'], reactions:{ heart:56, wow:19, same:62 },
      createdAt: Date.now() - 1000*60*60*26
    },
    {
      id: 'seed_7', nickname: '자유로운 을목일간',
      text: '소울메이트 MBTI 보고 신기해서 왔어요 ㅋㅋ INFJ라고 나왔는데 진짜로 주변 INFJ 분들이랑 유난히 잘 통하거든요? 우연인지 필연인지는 모르겠지만ㅎㅎ 혹시 소울메이트 MBTI랑 실제로 잘 맞으셨던 분 있어요?',
      card: null, tags:['#을목일간','#인연운'], reactions:{ heart:29, wow:38, same:17 },
      createdAt: Date.now() - 1000*60*60*34
    },
    {
      id: 'seed_8', nickname: '낙천적인 병화일간',
      text: '여기 처음 와봤는데 분위기 좋네요 🌻 올해 유난히 힘든 일이 많았는데 사주에서 "지금이 과도기이며 곧 새로운 시작이 온다"는 말에 왜 이렇게 위로가 됐는지 몰라요 ㅠㅠ 모두들 지금 어떤 시기를 보내고 계세요? 서로 응원해요!',
      card: { dayPillar:'丙寅', tags:['#열정가','#밝은에너지','#카리스마'], mbtiSoulmate:'ISFJ', mbtiChar:'☀️', summary:'하늘에 뜬 태양처럼 눈부신 당신, 어디에 있든 주변을 환하게 밝히는 타고난 에너지의 소유자입니다...' },
      tags:['#병화일간','#고민상담'], reactions:{ heart:103, wow:11, same:88 },
      createdAt: Date.now() - 1000*60*60*48
    },
    {
      id: 'seed_9', nickname: '섬세한 기토일간',
      text: '기토일간이라 포용력 있고 늘 주변 사람 챙기는 역할이라는 게 너무 맞아요. 근데 가끔은 저도 누군가가 먼저 챙겨줬으면 하는 생각이 드는 날이 있어요 🤍 여기 비슷한 분 계신가요? 아니면 잘 챙겨주는 분... 계신가요 ㅎㅎ',
      card: null, tags:['#기토일간','#인연운','#고민상담'], reactions:{ heart:79, wow:9, same:91 },
      createdAt: Date.now() - 1000*60*60*60
    },
    {
      id: 'seed_10', nickname: '날카로운 경금일간',
      text: '경금일간 직업 적성에 법조인, 군인, 외과의사가 나왔는데 저 지금 그쪽 방향으로 공부하고 있거든요? 진짜 소름 ㄷㄷ 재미로 봤다가 사주 믿게 됐어요. 자기 일주 적성이랑 실제 하는 일 맞는 분들 있으면 댓글 달아줘요!',
      card: { dayPillar:'庚子', tags:['#결단력','#정의감','#카리스마'], mbtiSoulmate:'ENFJ', mbtiChar:'💎', summary:'단단한 쇠처럼 흔들리지 않는 의지와 정의감, 당신은 어떤 상황에서도 옳은 길을 선택하는 강인한 사람입니다...' },
      tags:['#경금일간','#취업운'], reactions:{ heart:47, wow:55, same:23 },
      createdAt: Date.now() - 1000*60*60*72
    }
  ];

  const _seedReacted = {};

  // ─────────────────────────────────────────────
  // 세션 ID
  // ─────────────────────────────────────────────
  function getOrCreateSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  // ─────────────────────────────────────────────
  // 닉네임
  // ─────────────────────────────────────────────
  function generateNickname(dayGan) {
    const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const pool = (dayGan && GAN_NOUNS[dayGan]) ? GAN_NOUNS[dayGan] : FALLBACK_NOUNS;
    return adj + ' ' + pool[Math.floor(Math.random() * pool.length)];
  }

  function getOrCreateNickname() {
    let nick = localStorage.getItem(NICKNAME_KEY);
    if (!nick) {
      const cache = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY) || '{}');
      nick = generateNickname(cache.dayGan || null);
      localStorage.setItem(NICKNAME_KEY, nick);
      localStorage.setItem(NICKNAME_SRC_KEY, 'generated');
    }
    return nick;
  }

  function changeNickname(newNickname) {
    const trimmed = newNickname.trim().slice(0, 12);
    if (!trimmed) return false;
    localStorage.setItem(NICKNAME_KEY, trimmed);
    localStorage.setItem(NICKNAME_SRC_KEY, 'custom');
    return trimmed;
  }

  // ─────────────────────────────────────────────
  // 상대 시간
  // ─────────────────────────────────────────────
  function relativeTime(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - Number(ts)) / 1000);
    if (diff < 60)     return '방금';
    if (diff < 3600)   return Math.floor(diff / 60) + '분 전';
    if (diff < 86400)  return Math.floor(diff / 3600) + '시간 전';
    if (diff < 172800) return '어제';
    const d = new Date(Number(ts));
    return `${d.getMonth()+1}월 ${d.getDate()}일`;
  }

  // ─────────────────────────────────────────────
  // HTML 렌더링
  // ─────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function renderCard(card) {
    if (!card) return '';
    const tagsHtml = (card.tags || []).map(t =>
      `<span style="display:inline-block;background:#ffe0b2;color:#e65100;padding:3px 8px;border-radius:12px;font-size:0.78em;margin-right:4px;">${t}</span>`
    ).join('');
    return `
      <div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);border-radius:10px;padding:14px;margin:10px 0;border:1px solid #ffcc80;font-size:0.9em;">
        <div style="font-weight:bold;color:#e65100;margin-bottom:6px;">📋 사주 결과 카드</div>
        <div style="font-size:1.1em;font-weight:bold;color:#bf360c;">${card.dayPillar || ''} 일주</div>
        <div style="margin:6px 0;">${tagsHtml}</div>
        ${card.mbtiSoulmate ? `<div style="color:#5d4037;font-size:0.88em;">소울메이트 MBTI: <strong>${card.mbtiSoulmate}</strong> ${card.mbtiChar||''}</div>` : ''}
        ${card.summary ? `<div style="margin-top:8px;color:#4a3f35;line-height:1.5;font-size:0.88em;">${card.summary}</div>` : ''}
      </div>`;
  }

  function renderComment(comment, mySessionId) {
    const isMine   = comment.sessionId === mySessionId;
    const reactions = comment.reactions || { heart:0, wow:0, same:0 };
    const reacted  = (comment.reactedSessions || []).includes(mySessionId);
    const tagsHtml = (comment.tags || []).map(t =>
      `<span style="display:inline-block;background:#fff3e0;color:#e67e22;padding:3px 9px;border-radius:12px;font-size:0.8em;margin-right:4px;margin-top:4px;border:1px solid #ffcc80;">${t}</span>`
    ).join('');

    const btnStyle = (type) =>
      `background:${reacted?'#ffe0b2':'#fffaf5'};border:1px solid ${reacted?'#f39c12':'#ffedda'};border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;`;

    return `
      <div class="comment-item" data-id="${comment.id}" style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;box-shadow:0 2px 8px rgba(243,156,18,0.06);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:bold;color:#d35400;font-size:0.95em;">${escapeHtml(comment.nickname||'익명')}</span>
          ${isMine?`<span style="background:#ffe0b2;color:#e65100;font-size:0.72em;padding:2px 7px;border-radius:8px;font-weight:bold;">내 댓글</span>`:''}
          <span style="color:#bbb;font-size:0.8em;margin-left:auto;">${relativeTime(comment.createdAt)}</span>
        </div>
        ${renderCard(comment.card)}
        <p style="margin:0 0 10px;line-height:1.7;color:#3d3330;word-break:break-word;">${escapeHtml(comment.text||'')}</p>
        ${tagsHtml?`<div style="margin-top:8px;">${tagsHtml}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="CommunityApp.reactToComment('${comment.id}','heart')" style="${btnStyle('heart')}">❤️ 공감 <span class="rc-heart-${comment.id}">${reactions.heart||0}</span></button>
          <button onclick="CommunityApp.reactToComment('${comment.id}','same')"  style="${btnStyle('same')}">😊 힘내요 <span class="rc-same-${comment.id}">${reactions.same||0}</span></button>
          <button onclick="CommunityApp.reactToComment('${comment.id}','wow')"   style="${btnStyle('wow')}">🤔 신기해요 <span class="rc-wow-${comment.id}">${reactions.wow||0}</span></button>
        </div>
      </div>`;
  }

  function renderSeedComment(c) {
    const tagsHtml = (c.tags||[]).map(t =>
      `<span style="display:inline-block;background:#fff3e0;color:#e67e22;padding:3px 9px;border-radius:12px;font-size:0.8em;margin-right:4px;margin-top:4px;border:1px solid #ffcc80;">${t}</span>`
    ).join('');
    const r = c.reactions||{heart:0,wow:0,same:0};
    return `
      <div class="comment-item seed-comment" data-id="${c.id}" style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;box-shadow:0 2px 8px rgba(243,156,18,0.06);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:bold;color:#d35400;font-size:0.95em;">${escapeHtml(c.nickname)}</span>
          <span style="color:#bbb;font-size:0.8em;margin-left:auto;">${relativeTime(c.createdAt)}</span>
        </div>
        ${renderCard(c.card)}
        <p style="margin:0 0 10px;line-height:1.7;color:#3d3330;word-break:break-word;">${escapeHtml(c.text)}</p>
        ${tagsHtml?`<div style="margin-top:8px;">${tagsHtml}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="CommunityApp._seedReact('${c.id}','heart',this)" style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;">❤️ 공감 <span class="sc-heart">${r.heart}</span></button>
          <button onclick="CommunityApp._seedReact('${c.id}','same',this)"  style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;">😊 힘내요 <span class="sc-same">${r.same}</span></button>
          <button onclick="CommunityApp._seedReact('${c.id}','wow',this)"   style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;">🤔 신기해요 <span class="sc-wow">${r.wow}</span></button>
        </div>
      </div>`;
  }

  function skeletonHtml() {
    return Array(3).fill(0).map(() => `
      <div style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;animation:pulse 1.5s ease-in-out infinite;">
        <div style="height:14px;background:#ffedda;border-radius:6px;width:30%;margin-bottom:10px;"></div>
        <div style="height:12px;background:#fff3e0;border-radius:6px;width:90%;margin-bottom:6px;"></div>
        <div style="height:12px;background:#fff3e0;border-radius:6px;width:75%;"></div>
      </div>`).join('');
  }

  function showToast(msg, isError) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:${isError?'#e74c3c':'#e67e22'};color:white;padding:12px 24px;
      border-radius:24px;font-size:0.9em;font-weight:bold;z-index:99999;
      box-shadow:0 4px 12px rgba(0,0,0,0.15);pointer-events:none;
      animation:fadeInUp 0.3s ease;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ─────────────────────────────────────────────
  // API 호출 헬퍼
  // ─────────────────────────────────────────────
  async function apiFetch(path, options = {}) {
    const res  = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    return res.json();
  }

  // ─────────────────────────────────────────────
  // 상태
  // ─────────────────────────────────────────────
  let _sessionId  = '';
  let _nickname   = '';
  let _page       = 0;
  let _loading    = false;
  let _hasMore    = true;
  let _activeTag  = '';
  let _pendingCard = null;
  let _pollTimer  = null;
  let _latestCreatedAt = 0; // 폴링 기준

  // ─────────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────────
  function init() {
    _sessionId = getOrCreateSessionId();
    _nickname  = getOrCreateNickname();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('share') === '1') {
      const cardStr = sessionStorage.getItem('pending_share_card');
      if (cardStr) {
        try { _pendingCard = JSON.parse(cardStr); } catch(e) {}
        sessionStorage.removeItem('pending_share_card');
      }
    }

    renderNicknameSection();
    renderCardPreview();
    setupCommentInput();
    setupTagFilter();
    loadComments(true);
    startPolling();
  }

  // ─────────────────────────────────────────────
  // 닉네임 섹션
  // ─────────────────────────────────────────────
  function renderNicknameSection() {
    const el = document.getElementById('nickname-section');
    if (!el) return;
    el.innerHTML = `
      <div style="background:#fffaf5;border:1px solid #ffedda;border-radius:12px;padding:16px 18px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:1em;color:#4a3f35;">안녕하세요! 🐯 <strong style="color:#e67e22;" id="display-nickname">${escapeHtml(_nickname)}</strong> 으로 참여 중이에요</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button onclick="CommunityApp.regenerateNickname()" style="background:white;border:1px solid #f39c12;color:#e67e22;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;font-weight:bold;">🎲 재생성</button>
          <button onclick="CommunityApp.showNicknameInput()"  style="background:white;border:1px solid #f39c12;color:#e67e22;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;font-weight:bold;">✏️ 변경</button>
        </div>
        <div id="nickname-input-area" style="display:none;margin-top:10px;">
          <div style="display:flex;gap:8px;">
            <input type="text" id="nickname-custom-input" maxlength="12" placeholder="닉네임 입력 (최대 12자)"
              style="flex:1;padding:8px 12px;border:1px solid #f39c12;border-radius:8px;font-size:0.9em;outline:none;color:#4a3f35;background:#fffbf5;">
            <button onclick="CommunityApp.applyNickname()" style="background:#f39c12;color:white;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:bold;font-size:0.85em;">확인</button>
          </div>
        </div>
      </div>`;
  }

  // ─────────────────────────────────────────────
  // 카드 미리보기
  // ─────────────────────────────────────────────
  function renderCardPreview() {
    const el = document.getElementById('card-preview-area');
    if (!el) return;
    el.innerHTML = _pendingCard ? `
      <div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:10px;padding:12px 14px;margin-bottom:12px;position:relative;">
        <button onclick="CommunityApp.removeCard()" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:#e65100;font-size:1.1em;">✕</button>
        <div style="font-size:0.8em;color:#e65100;font-weight:bold;margin-bottom:6px;">📎 첨부될 사주 카드</div>
        ${renderCard(_pendingCard)}
      </div>` : '';
  }

  // ─────────────────────────────────────────────
  // 댓글 입력 설정
  // ─────────────────────────────────────────────
  function setupCommentInput() {
    const textarea = document.getElementById('comment-textarea');
    const counter  = document.getElementById('char-counter');
    if (!textarea || !counter) return;
    textarea.addEventListener('input', function() {
      const left = 300 - this.value.length;
      counter.textContent = left + '자 남음';
      counter.style.color = left < 30 ? '#e74c3c' : '#aaa';
    });
  }

  // ─────────────────────────────────────────────
  // 태그 필터
  // ─────────────────────────────────────────────
  function setupTagFilter() {
    document.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', function() {
        const tag = this.dataset.tag;
        if (_activeTag === tag) {
          _activeTag = '';
          document.querySelectorAll('.tag-chip').forEach(c => { c.style.background='white'; c.style.color='#e67e22'; });
        } else {
          _activeTag = tag;
          document.querySelectorAll('.tag-chip').forEach(c => { c.style.background='white'; c.style.color='#e67e22'; });
          this.style.background = '#e67e22';
          this.style.color = 'white';
        }
        _page = 0;
        _hasMore = true;
        loadComments(true);
      });
    });
  }

  // ─────────────────────────────────────────────
  // 댓글 로드
  // ─────────────────────────────────────────────
  async function loadComments(reset) {
    if (_loading) return;
    _loading = true;

    const listEl     = document.getElementById('comments-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const emptyEl    = document.getElementById('empty-state');

    if (reset) {
      _page = 0;
      _hasMore = true;
      if (listEl) listEl.innerHTML = skeletonHtml();
    }

    try {
      const tagParam = _activeTag ? `&tag=${encodeURIComponent(_activeTag)}` : '';
      const data = await apiFetch(`/comments?page=${_page}${tagParam}`);

      if (!data.ok) throw new Error(data.error || 'API 오류');

      const comments = data.comments || [];
      _hasMore = data.hasMore;

      if (reset && listEl) listEl.innerHTML = '';

      if (comments.length === 0 && _page === 0) {
        // 실제 댓글 없으면 씨앗 댓글 표시
        const filtered = _activeTag
          ? SEED_COMMENTS.filter(c => (c.tags||[]).includes(_activeTag))
          : SEED_COMMENTS;
        if (listEl) listEl.innerHTML = filtered.map(renderSeedComment).join('');
        if (emptyEl) emptyEl.style.display = 'none';
      } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (comments.length > 0) {
          _latestCreatedAt = Math.max(_latestCreatedAt, comments[0].createdAt || 0);
        }
        if (listEl) {
          comments.forEach(c => listEl.insertAdjacentHTML('beforeend', renderComment(c, _sessionId)));
        }
        _page++;
      }

      if (loadMoreBtn) loadMoreBtn.style.display = _hasMore ? 'block' : 'none';

    } catch (err) {
      console.error('댓글 로드 실패:', err);
      // API 실패 시 씨앗 댓글 폴백
      if (listEl && _page === 0) {
        const filtered = _activeTag
          ? SEED_COMMENTS.filter(c => (c.tags||[]).includes(_activeTag))
          : SEED_COMMENTS;
        listEl.innerHTML = filtered.map(renderSeedComment).join('');
        if (emptyEl) emptyEl.style.display = 'none';
      }
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }

    _loading = false;
  }

  // ─────────────────────────────────────────────
  // 30초 폴링 (새 댓글 감지)
  // ─────────────────────────────────────────────
  function startPolling() {
    _pollTimer = setInterval(async () => {
      try {
        const data = await apiFetch('/comments?page=0');
        if (!data.ok || !data.comments.length) return;

        const newest = data.comments[0];
        if (newest.createdAt > _latestCreatedAt && newest.sessionId !== _sessionId) {
          _latestCreatedAt = newest.createdAt;
          const listEl = document.getElementById('comments-list');
          const emptyEl = document.getElementById('empty-state');
          if (listEl) {
            listEl.querySelectorAll('.seed-comment').forEach(el => el.remove());
            if (emptyEl) emptyEl.style.display = 'none';
            listEl.insertAdjacentHTML('afterbegin', renderComment(newest, _sessionId));
            showToast('새 댓글이 도착했어요 🐯');
          }
        }
      } catch(e) { /* 폴링 실패 무시 */ }
    }, 30000);
  }

  // ─────────────────────────────────────────────
  // 댓글 게시
  // ─────────────────────────────────────────────
  async function postComment(text, card) {
    const trimmed = (text||'').trim();
    if (!trimmed || trimmed.length > 300) return false;

    const tags = [];
    const cache = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY)||'{}');
    if (cache.dayGan && GAN_TAG_MAP[cache.dayGan]) {
      tags.push('#' + GAN_TAG_MAP[cache.dayGan]);
    }

    try {
      const data = await apiFetch('/comments', {
        method: 'POST',
        body: JSON.stringify({ sessionId: _sessionId, nickname: _nickname, text: trimmed, card: card||null, tags })
      });

      if (!data.ok) throw new Error(data.error || '게시 실패');

      const localComment = {
        id: data.id,
        sessionId: _sessionId,
        nickname: _nickname,
        text: trimmed,
        card: card||null,
        tags,
        reactions: { heart:0, wow:0, same:0 },
        reactedSessions: [],
        createdAt: data.createdAt || Date.now()
      };

      const listEl = document.getElementById('comments-list');
      const emptyEl = document.getElementById('empty-state');
      if (listEl) {
        listEl.querySelectorAll('.seed-comment').forEach(el => el.remove());
        if (emptyEl) emptyEl.style.display = 'none';
        listEl.insertAdjacentHTML('afterbegin', renderComment(localComment, _sessionId));
      }
      _latestCreatedAt = localComment.createdAt;
      showToast('댓글이 등록됐어요 🐯');
      return true;
    } catch(err) {
      console.error('게시 실패:', err);
      showToast('게시 실패. 잠시 후 다시 시도해주세요 😿', true);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // 리액션
  // ─────────────────────────────────────────────
  async function reactToComment(commentId, type) {
    try {
      const data = await apiFetch('/react', {
        method: 'POST',
        body: JSON.stringify({ commentId, sessionId: _sessionId, reactionType: type })
      });

      if (data.ok) {
        const el = document.querySelector(`.comment-item[data-id="${commentId}"]`);
        if (el) {
          const span = el.querySelector(`.rc-${type}-${commentId}`);
          if (span) span.textContent = data.newCount;
          el.querySelectorAll('button').forEach(btn => {
            btn.style.background = '#ffe0b2';
            btn.style.borderColor = '#f39c12';
          });
        }
      } else if (data.error === '이미 리액션함') {
        showToast('이미 공감했어요 🐯');
      }
    } catch(err) {
      console.warn('리액션 실패:', err.message);
    }
  }

  // ─────────────────────────────────────────────
  // 공개 API
  // ─────────────────────────────────────────────
  window.CommunityApp = {
    init, generateNickname, postComment, reactToComment, changeNickname, loadComments,

    regenerateNickname() {
      const cache = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY)||'{}');
      const nick  = generateNickname(cache.dayGan||null);
      _nickname = nick;
      localStorage.setItem(NICKNAME_KEY, nick);
      localStorage.setItem(NICKNAME_SRC_KEY, 'generated');
      renderNicknameSection();
    },

    showNicknameInput() {
      const area = document.getElementById('nickname-input-area');
      if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
    },

    applyNickname() {
      const input = document.getElementById('nickname-custom-input');
      if (!input) return;
      const result = changeNickname(input.value);
      if (result) { _nickname = result; renderNicknameSection(); }
      else alert('닉네임을 입력해주세요. (최대 12자)');
    },

    removeCard() { _pendingCard = null; renderCardPreview(); },

    async submitComment() {
      const textarea = document.getElementById('comment-textarea');
      if (!textarea) return;
      const text = textarea.value.trim();
      if (!text) { alert('댓글 내용을 입력해주세요!'); return; }
      if (text.length > 300) { alert('300자 이하로 작성해주세요.'); return; }

      const btn = document.getElementById('submit-btn');
      const resetBtn = () => { if(btn){ btn.disabled=false; btn.textContent='댓글 남기기 🐯'; } };
      if (btn) { btn.disabled=true; btn.textContent='게시 중...'; }

      try {
        const ok = await postComment(text, _pendingCard);
        if (ok) {
          textarea.value = '';
          const counter = document.getElementById('char-counter');
          if (counter) counter.textContent = '300자 남음';
          _pendingCard = null;
          renderCardPreview();
        }
      } catch(e) {
        console.error(e);
      } finally {
        resetBtn();
      }
    },

    _seedReact(id, type, btn) {
      const key = id + '_' + type;
      if (_seedReacted[key]) return;
      _seedReacted[key] = true;
      const c = SEED_COMMENTS.find(s => s.id === id);
      if (!c) return;
      c.reactions[type] = (c.reactions[type]||0) + 1;
      const item = document.querySelector(`.seed-comment[data-id="${id}"]`);
      if (item) {
        const span = item.querySelector('.sc-' + type);
        if (span) span.textContent = c.reactions[type];
        btn.style.background = '#ffe0b2';
        btn.style.borderColor = '#f39c12';
      }
    }
  };

})();
