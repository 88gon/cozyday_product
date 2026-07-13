// community.js
// 49사주 커뮤니티 기능 - 세션 기반 익명 커뮤니티

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // 상수
  // ─────────────────────────────────────────────
  const SESSION_KEY = 'saju_session_id';
  const NICKNAME_KEY = 'saju_nickname';
  const NICKNAME_SRC_KEY = 'saju_nickname_source';
  const RESULT_CACHE_KEY = 'saju_result_cache';
  const COLLECTION = 'community_comments';
  const PAGE_SIZE = 20;

  // 닉네임 생성 재료
  const ADJECTIVES = [
    '불타는', '차가운', '눈물 많은', '고집 센', '계획적인',
    '외로운', '쾌활한', '날카로운', '따뜻한', '깊은',
    '낙천적인', '예민한', '묵묵한', '반짝이는', '조용한',
    '신중한', '자유로운', '당당한', '섬세한', '엉뚱한'
  ];

  const GAN_NOUNS = {
    '甲': ['갑목일간', '봄나무'],
    '乙': ['을목일간', '봄꽃'],
    '丙': ['병화일간', '여름태양'],
    '丁': ['정화일간', '촛불'],
    '戊': ['무토일간', '산'],
    '己': ['기토일간', '들판'],
    '庚': ['경금일간', '단검'],
    '辛': ['신금일간', '보석'],
    '壬': ['임수일간', '대해'],
    '癸': ['계수일간', '봄비']
  };

  const FALLBACK_NOUNS = [
    '인프피', '엔팁', 'INFJ궁합러', '사주탐험가',
    '무토인간', '수목형인간', '오행탐구자', '별자리덕후'
  ];

  // ─────────────────────────────────────────────
  // 세션 ID 관리
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
  // 닉네임 생성
  // ─────────────────────────────────────────────
  function generateNickname(dayGan) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    let noun;
    if (dayGan && GAN_NOUNS[dayGan]) {
      const nouns = GAN_NOUNS[dayGan];
      noun = nouns[Math.floor(Math.random() * nouns.length)];
    } else {
      noun = FALLBACK_NOUNS[Math.floor(Math.random() * FALLBACK_NOUNS.length)];
    }
    return adj + ' ' + noun;
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
  // 상대 시간 포맷
  // ─────────────────────────────────────────────
  function relativeTime(ts) {
    if (!ts) return '';
    const now = Date.now();
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((now - date.getTime()) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
    if (diff < 172800) return '어제';
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}월 ${d}일`;
  }

  // ─────────────────────────────────────────────
  // Firestore 체크
  // ─────────────────────────────────────────────
  function getDb() {
    return (typeof window !== 'undefined' && window.db) ? window.db : null;
  }

  // ─────────────────────────────────────────────
  // 댓글 HTML 렌더링
  // ─────────────────────────────────────────────
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
        ${card.mbtiSoulmate ? `<div style="color:#5d4037;font-size:0.88em;">소울메이트 MBTI: <strong>${card.mbtiSoulmate}</strong> ${card.mbtiChar || ''}</div>` : ''}
        ${card.summary ? `<div style="margin-top:8px;color:#4a3f35;line-height:1.5;font-size:0.88em;">${card.summary}</div>` : ''}
      </div>
    `;
  }

  function renderComment(doc, mySessionId) {
    const d = doc.data ? doc.data() : doc;
    const id = doc.id || d.id;
    const isMine = d.sessionId === mySessionId;
    const reactions = d.reactions || { heart: 0, wow: 0, same: 0 };
    const reactedSessions = d.reactedSessions || [];
    const hasReacted = reactedSessions.includes(mySessionId);

    const tagsHtml = (d.tags || []).map(t =>
      `<span style="display:inline-block;background:#fff3e0;color:#e67e22;padding:3px 9px;border-radius:12px;font-size:0.8em;margin-right:4px;margin-top:4px;border:1px solid #ffcc80;">${t}</span>`
    ).join('');

    return `
      <div class="comment-item" data-id="${id}" style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;box-shadow:0 2px 8px rgba(243,156,18,0.06);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:bold;color:#d35400;font-size:0.95em;">${escapeHtml(d.nickname || '익명')}</span>
          ${isMine ? `<span style="background:#ffe0b2;color:#e65100;font-size:0.72em;padding:2px 7px;border-radius:8px;font-weight:bold;">내 댓글</span>` : ''}
          <span style="color:#bbb;font-size:0.8em;margin-left:auto;">${relativeTime(d.createdAt)}</span>
        </div>
        ${renderCard(d.card)}
        <p style="margin:0 0 10px;line-height:1.7;color:#3d3330;word-break:break-word;">${escapeHtml(d.text || '')}</p>
        ${tagsHtml ? `<div style="margin-top:8px;">${tagsHtml}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="CommunityApp.reactToComment('${id}','heart')" class="reaction-btn ${hasReacted ? 'reacted' : ''}" style="background:${hasReacted ? '#ffe0b2' : '#fffaf5'};border:1px solid ${hasReacted ? '#f39c12' : '#ffedda'};border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            ❤️ 공감 <span class="reaction-count-heart">${reactions.heart || 0}</span>
          </button>
          <button onclick="CommunityApp.reactToComment('${id}','same')" class="reaction-btn ${hasReacted ? 'reacted' : ''}" style="background:${hasReacted ? '#ffe0b2' : '#fffaf5'};border:1px solid ${hasReacted ? '#f39c12' : '#ffedda'};border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            😊 힘내요 <span class="reaction-count-same">${reactions.same || 0}</span>
          </button>
          <button onclick="CommunityApp.reactToComment('${id}','wow')" class="reaction-btn ${hasReacted ? 'reacted' : ''}" style="background:${hasReacted ? '#ffe0b2' : '#fffaf5'};border:1px solid ${hasReacted ? '#f39c12' : '#ffedda'};border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            🤔 신기해요 <span class="reaction-count-wow">${reactions.wow || 0}</span>
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ─────────────────────────────────────────────
  // 씨앗 댓글 (첫 방문자용 샘플)
  // ─────────────────────────────────────────────
  const SEED_COMMENTS = [
    {
      id: 'seed_1',
      nickname: '따뜻한 정화일간',
      text: '처음으로 사주 봤는데 너무 신기해요 😮 제가 왜 이렇게 감성적이고 눈물이 많은지 드디어 이해됐어요 ㅎㅎ 정화일간이라 촛불처럼 따뜻하지만 혼자 타오른다고 하더라고요. 공감되는 분 계신가요? 🕯️',
      card: {
        dayPillar: '丁卯',
        tags: ['#감수성풍부', '#섬세함', '#따뜻한마음'],
        mbtiSoulmate: 'ISFJ',
        mbtiChar: '🕯️',
        summary: '어둠 속에서도 꺼지지 않는 촛불처럼, 당신은 주변 사람들에게 따뜻한 빛을 나눠주는 존재입니다...'
      },
      tags: ['#정화일간'],
      reactions: { heart: 24, wow: 8, same: 31 },
      createdAt: new Date(Date.now() - 1000 * 60 * 14)
    },
    {
      id: 'seed_2',
      nickname: '외로운 임수일간',
      text: '임수일간이라 생각이 너무 많다는 게 찰떡같이 맞아요 ㅋㅋ 소울메이트가 INTP라고 나왔는데... 솔직히 지적이고 대화 잘 통하는 사람 만나고 싶어요. 사주 보고 나서 내가 어떤 사람을 원하는지 더 선명해진 느낌? 여기 INTP 분 계시면 반가워요 👋',
      card: {
        dayPillar: '壬午',
        tags: ['#생각많음', '#넓은포부', '#지혜로움'],
        mbtiSoulmate: 'INTP',
        mbtiChar: '🌊',
        summary: '드넓은 바다처럼 깊고 포용력 있는 당신, 흐름을 읽는 탁월한 직관으로 어디서든 리더가 될 운명입니다...'
      },
      tags: ['#임수일간', '#인연운'],
      reactions: { heart: 41, wow: 12, same: 19 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'seed_3',
      nickname: '반짝이는 신금일간',
      text: '이번에 드디어 취업했어요!! 🎉 직업 적성 파트에서 나온 분야가 제가 지원한 곳이랑 딱 맞더라고요. 사주 보고 나서 확신이 생겼달까요? 다들 취업 준비 중이시면 적성 파트 꼭 읽어보세요. 진짜 도움 됐어요!',
      card: null,
      tags: ['#신금일간', '#취업운'],
      reactions: { heart: 67, wow: 22, same: 14 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5)
    },
    {
      id: 'seed_4',
      nickname: '묵묵한 무토일간',
      text: '혼자 살다 보니 사주라도 봐야 위로가 되더라고요 ㅎㅎ 무토일간이라 산처럼 듬직하대요... 근데 현실은 집에서 혼자 사주 보는 사람😅 그래도 오행 분석 읽으면서 나 이런 면이 있었구나 하고 의외로 위안이 많이 됐어요. 여기 혼자인 분들 반가워요.',
      card: {
        dayPillar: '戊申',
        tags: ['#듬직함', '#신뢰', '#중재자기질'],
        mbtiSoulmate: 'ESTP',
        mbtiChar: '⛰️',
        summary: '태산처럼 흔들리지 않는 당신, 묵묵히 버티는 힘이 남다릅니다. 주변 사람들이 당신을 가장 믿는 이유입니다...'
      },
      tags: ['#무토일간', '#고민상담'],
      reactions: { heart: 88, wow: 6, same: 74 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 11)
    },
    {
      id: 'seed_5',
      nickname: '깊은 갑목일간',
      text: '여기 계신 분들 혹시 상대방 일주 보고 궁합 생각해보신 적 있어요? 저 좋아하는 사람이 을목일간이라는데 목기끼리 잘 맞는 건지 너무 궁금해서요 😅 사주로 궁합 보는 거 믿으세요?',
      card: null,
      tags: ['#갑목일간', '#인연운'],
      reactions: { heart: 33, wow: 17, same: 28 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18)
    },
    {
      id: 'seed_6',
      nickname: '엉뚱한 계수일간',
      text: '계수일간이라 생각이 많고 걱정을 사서 한다는 말이... 진짜 너무 맞아서 소름 ㅠㅠ 나쁜 건 안 맞았으면 했는데 왜 이런 건 다 맞지. 근데 신기한 건 읽고 나서 오히려 위로가 됐어요. 나만 이런 게 아니구나 싶어서요. 다들 그런 경험 있어요?',
      card: {
        dayPillar: '癸丑',
        tags: ['#총명함', '#유연함', '#생각많음'],
        mbtiSoulmate: 'INTP',
        mbtiChar: '💧',
        summary: '대지를 촉촉이 적시는 봄비처럼, 당신의 섬세한 감수성은 메마른 마음에 생기를 불어넣는 특별한 재능입니다...'
      },
      tags: ['#계수일간'],
      reactions: { heart: 56, wow: 19, same: 62 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26)
    },
    {
      id: 'seed_7',
      nickname: '자유로운 을목일간',
      text: '소울메이트 MBTI 보고 신기해서 왔어요 ㅋㅋ INFJ라고 나왔는데 진짜로 주변 INFJ 분들이랑 유난히 잘 통하거든요? 우연인지 필연인지는 모르겠지만ㅎㅎ 혹시 소울메이트 MBTI랑 실제로 잘 맞으셨던 분 있어요? 궁금해요!',
      card: null,
      tags: ['#을목일간', '#인연운'],
      reactions: { heart: 29, wow: 38, same: 17 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 34)
    },
    {
      id: 'seed_8',
      nickname: '낙천적인 병화일간',
      text: '여기 처음 와봤는데 분위기 좋네요 🌻 올해 유난히 힘든 일이 많았는데 사주에서 "지금이 과도기이며 곧 새로운 시작이 온다"는 말에 왜 이렇게 위로가 됐는지 몰라요 ㅠㅠ 모두들 지금 어떤 시기를 보내고 계세요? 서로 응원해요!',
      card: {
        dayPillar: '丙寅',
        tags: ['#열정가', '#밝은에너지', '#카리스마'],
        mbtiSoulmate: 'ISFJ',
        mbtiChar: '☀️',
        summary: '하늘에 뜬 태양처럼 눈부신 당신, 어디에 있든 주변을 환하게 밝히는 타고난 에너지의 소유자입니다...'
      },
      tags: ['#병화일간', '#고민상담'],
      reactions: { heart: 103, wow: 11, same: 88 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
    },
    {
      id: 'seed_9',
      nickname: '섬세한 기토일간',
      text: '기토일간이라 포용력 있고 늘 주변 사람 챙기는 역할이라는 게 너무 맞아요. 근데 가끔은 저도 누군가가 먼저 챙겨줬으면 하는 생각이 드는 날이 있어요 🤍 여기 비슷한 분 계신가요? 아니면 잘 챙겨주는 분... 계신가요 ㅎㅎ',
      card: null,
      tags: ['#기토일간', '#인연운', '#고민상담'],
      reactions: { heart: 79, wow: 9, same: 91 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60)
    },
    {
      id: 'seed_10',
      nickname: '날카로운 경금일간',
      text: '경금일간 직업 적성에 법조인, 군인, 외과의사가 나왔는데 저 지금 그쪽 방향으로 공부하고 있거든요? 진짜 소름 ㄷㄷ 재미로 봤다가 사주 믿게 됐어요. 자기 일주 적성이랑 실제 하는 일 맞는 분들 있으면 댓글 달아줘요!',
      card: {
        dayPillar: '庚子',
        tags: ['#결단력', '#정의감', '#카리스마'],
        mbtiSoulmate: 'ENFJ',
        mbtiChar: '💎',
        summary: '단단한 쇠처럼 흔들리지 않는 의지와 정의감, 당신은 어떤 상황에서도 옳은 길을 선택하는 강인한 사람입니다...'
      },
      tags: ['#경금일간', '#취업운'],
      reactions: { heart: 47, wow: 55, same: 23 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72)
    }
  ];

  function renderSeedComment(comment) {
    const reactions = comment.reactions || { heart: 0, wow: 0, same: 0 };
    const tagsHtml = (comment.tags || []).map(t =>
      `<span style="display:inline-block;background:#fff3e0;color:#e67e22;padding:3px 9px;border-radius:12px;font-size:0.8em;margin-right:4px;margin-top:4px;border:1px solid #ffcc80;">${t}</span>`
    ).join('');
    return `
      <div class="comment-item seed-comment" data-id="${comment.id}" style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;box-shadow:0 2px 8px rgba(243,156,18,0.06);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-weight:bold;color:#d35400;font-size:0.95em;">${escapeHtml(comment.nickname)}</span>
          <span style="color:#bbb;font-size:0.8em;margin-left:auto;">${relativeTime(comment.createdAt)}</span>
        </div>
        ${renderCard(comment.card)}
        <p style="margin:0 0 10px;line-height:1.7;color:#3d3330;word-break:break-word;">${escapeHtml(comment.text)}</p>
        ${tagsHtml ? `<div style="margin-top:8px;">${tagsHtml}</div>` : ''}
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button onclick="CommunityApp._seedReact('${comment.id}','heart',this)" style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            ❤️ 공감 <span class="sc-heart">${reactions.heart}</span>
          </button>
          <button onclick="CommunityApp._seedReact('${comment.id}','same',this)" style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            😊 힘내요 <span class="sc-same">${reactions.same}</span>
          </button>
          <button onclick="CommunityApp._seedReact('${comment.id}','wow',this)" style="background:#fffaf5;border:1px solid #ffedda;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;color:#e67e22;transition:all 0.2s;">
            🤔 신기해요 <span class="sc-wow">${reactions.wow}</span>
          </button>
        </div>
      </div>
    `;
  }

  const _seedReacted = {};

  // ─────────────────────────────────────────────
  // 스켈레톤 로딩
  // ─────────────────────────────────────────────
  function skeletonHtml() {
    return Array(3).fill(0).map(() => `
      <div style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #ffedda;animation:pulse 1.5s ease-in-out infinite;">
        <div style="height:14px;background:#ffedda;border-radius:6px;width:30%;margin-bottom:10px;"></div>
        <div style="height:12px;background:#fff3e0;border-radius:6px;width:90%;margin-bottom:6px;"></div>
        <div style="height:12px;background:#fff3e0;border-radius:6px;width:75%;margin-bottom:6px;"></div>
        <div style="height:12px;background:#fff3e0;border-radius:6px;width:50%;"></div>
      </div>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // 메인 앱
  // ─────────────────────────────────────────────
  let _sessionId = '';
  let _nickname = '';
  let _lastDoc = null;
  let _loading = false;
  let _activeTag = '';
  let _unsubscribe = null;
  let _pendingCard = null;
  let _comments = []; // 캐시

  function init() {
    _sessionId = getOrCreateSessionId();
    _nickname = getOrCreateNickname();

    // 공유 카드 확인
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('share') === '1') {
      const cardStr = sessionStorage.getItem('pending_share_card');
      if (cardStr) {
        try {
          _pendingCard = JSON.parse(cardStr);
          sessionStorage.removeItem('pending_share_card');
        } catch (e) {}
      }
    }

    renderNicknameSection();
    renderCardPreview();
    setupCommentInput();
    setupTagFilter();
    loadComments(true);
    startRealtimeListener();
  }

  // ─────────────────────────────────────────────
  // 닉네임 섹션 렌더링
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
          <button onclick="CommunityApp.showNicknameInput()" style="background:white;border:1px solid #f39c12;color:#e67e22;border-radius:20px;padding:6px 14px;cursor:pointer;font-size:0.85em;font-weight:bold;">✏️ 변경</button>
        </div>
        <div id="nickname-input-area" style="display:none;margin-top:10px;display:none;">
          <div style="display:flex;gap:8px;">
            <input type="text" id="nickname-custom-input" maxlength="12" placeholder="닉네임 입력 (최대 12자)" style="flex:1;padding:8px 12px;border:1px solid #f39c12;border-radius:8px;font-size:0.9em;outline:none;color:#4a3f35;background:#fffbf5;">
            <button onclick="CommunityApp.applyNickname()" style="background:#f39c12;color:white;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:bold;font-size:0.85em;">확인</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // 카드 미리보기 렌더링
  // ─────────────────────────────────────────────
  function renderCardPreview() {
    const el = document.getElementById('card-preview-area');
    if (!el) return;
    if (_pendingCard) {
      el.innerHTML = `
        <div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:10px;padding:12px 14px;margin-bottom:12px;position:relative;">
          <button onclick="CommunityApp.removeCard()" style="position:absolute;top:8px;right:8px;background:none;border:none;cursor:pointer;color:#e65100;font-size:1.1em;">✕</button>
          <div style="font-size:0.8em;color:#e65100;font-weight:bold;margin-bottom:6px;">📎 첨부될 사주 카드</div>
          ${renderCard(_pendingCard)}
        </div>
      `;
    } else {
      el.innerHTML = '';
    }
  }

  // ─────────────────────────────────────────────
  // 댓글 입력 설정
  // ─────────────────────────────────────────────
  function setupCommentInput() {
    const textarea = document.getElementById('comment-textarea');
    const counter = document.getElementById('char-counter');
    if (!textarea || !counter) return;
    textarea.addEventListener('input', function () {
      const left = 300 - this.value.length;
      counter.textContent = left + '자 남음';
      counter.style.color = left < 30 ? '#e74c3c' : '#aaa';
    });
  }

  // ─────────────────────────────────────────────
  // 태그 필터 설정
  // ─────────────────────────────────────────────
  function setupTagFilter() {
    const tags = document.querySelectorAll('.tag-chip');
    tags.forEach(chip => {
      chip.addEventListener('click', function () {
        const tag = this.dataset.tag;
        if (_activeTag === tag) {
          _activeTag = '';
          this.classList.remove('active');
          document.querySelectorAll('.tag-chip').forEach(c => c.style.background = '');
        } else {
          _activeTag = tag;
          document.querySelectorAll('.tag-chip').forEach(c => {
            c.classList.remove('active');
            c.style.background = 'white';
            c.style.color = '#e67e22';
          });
          this.classList.add('active');
          this.style.background = '#e67e22';
          this.style.color = 'white';
        }
        _lastDoc = null;
        _comments = [];
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

    const listEl = document.getElementById('comments-list');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const emptyEl = document.getElementById('empty-state');

    if (reset) {
      _lastDoc = null;
      _comments = [];
      if (listEl) listEl.innerHTML = skeletonHtml();
    }

    const db = getDb();
    if (!db) {
      // Firebase 미설정 시 씨앗 댓글 표시
      if (listEl) {
        const filtered = _activeTag
          ? SEED_COMMENTS.filter(c => (c.tags || []).includes(_activeTag))
          : SEED_COMMENTS;
        if (filtered.length === 0) {
          listEl.innerHTML = '';
          if (emptyEl) emptyEl.style.display = 'block';
        } else {
          if (emptyEl) emptyEl.style.display = 'none';
          listEl.innerHTML = filtered.map(renderSeedComment).join('');
        }
      }
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      _loading = false;
      return;
    }

    try {
      let query = db.collection(COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(PAGE_SIZE);

      if (_activeTag) {
        query = db.collection(COLLECTION)
          .where('tags', 'array-contains', _activeTag)
          .orderBy('createdAt', 'desc')
          .limit(PAGE_SIZE);
      }

      if (_lastDoc) {
        query = query.startAfter(_lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty && _comments.length === 0) {
        // 실제 댓글 없으면 씨앗 댓글 표시
        if (listEl) {
          const filtered = _activeTag
            ? SEED_COMMENTS.filter(c => (c.tags || []).includes(_activeTag))
            : SEED_COMMENTS;
          if (filtered.length === 0) {
            listEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
          } else {
            if (emptyEl) emptyEl.style.display = 'none';
            listEl.innerHTML = filtered.map(renderSeedComment).join('');
          }
        }
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        _loading = false;
        return;
      }

      if (emptyEl) emptyEl.style.display = 'none';

      const newDocs = [];
      snapshot.forEach(doc => newDocs.push(doc));

      if (newDocs.length > 0) {
        _lastDoc = newDocs[newDocs.length - 1];
        _comments = [..._comments, ...newDocs];
      }

      if (reset && listEl) listEl.innerHTML = '';
      if (listEl) {
        newDocs.forEach(doc => {
          listEl.insertAdjacentHTML('beforeend', renderComment(doc, _sessionId));
        });
      }

      if (loadMoreBtn) {
        loadMoreBtn.style.display = newDocs.length < PAGE_SIZE ? 'none' : 'block';
      }

    } catch (err) {
      console.error('댓글 로드 실패:', err);
      if (listEl) {
        listEl.innerHTML = `
          <div style="text-align:center;padding:30px;">
            <div style="font-size:2em;">😿</div>
            <p style="color:#aaa;margin-top:10px;">댓글을 불러오지 못했습니다.</p>
            <button onclick="CommunityApp.loadComments(true)" style="background:#f39c12;color:white;border:none;border-radius:20px;padding:8px 20px;cursor:pointer;margin-top:10px;">다시 시도</button>
          </div>`;
      }
    }

    _loading = false;
  }

  // ─────────────────────────────────────────────
  // 실시간 리스너 (새 댓글)
  // ─────────────────────────────────────────────
  function startRealtimeListener() {
    const db = getDb();
    if (!db) return;
    if (_unsubscribe) _unsubscribe();

    _unsubscribe = db.collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const doc = change.doc;
            // 내가 방금 올린 글이 아니고, 이미 목록에 없는 경우만 추가
            const exists = _comments.some(c => c.id === doc.id);
            if (!exists && doc.data().sessionId !== _sessionId) {
              const listEl = document.getElementById('comments-list');
              const emptyEl = document.getElementById('empty-state');
              if (listEl) {
                if (emptyEl) emptyEl.style.display = 'none';
                listEl.insertAdjacentHTML('afterbegin', renderComment(doc, _sessionId));
              }
              _comments.unshift(doc);
            }
          }
        });
      }, err => {
        console.warn('실시간 리스너 오류:', err.message);
      });
  }

  // ─────────────────────────────────────────────
  // 댓글 게시
  // ─────────────────────────────────────────────
  async function postComment(text, card) {
    const trimmed = (text || '').trim();
    if (!trimmed || trimmed.length > 300) return false;

    const db = getDb();
    if (!db) {
      alert('Firebase 설정이 필요합니다. firebase-config.js를 확인해주세요.');
      return false;
    }

    // 태그 자동 추출 (일간 글자 or #태그)
    const tags = [];
    const cache = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY) || '{}');
    if (cache.dayGan && GAN_NOUNS[cache.dayGan]) {
      tags.push('#' + (cache.dayGan === '甲' ? '갑목일간' :
        cache.dayGan === '乙' ? '을목일간' :
        cache.dayGan === '丙' ? '병화일간' :
        cache.dayGan === '丁' ? '정화일간' :
        cache.dayGan === '戊' ? '무토일간' :
        cache.dayGan === '己' ? '기토일간' :
        cache.dayGan === '庚' ? '경금일간' :
        cache.dayGan === '辛' ? '신금일간' :
        cache.dayGan === '壬' ? '임수일간' :
        cache.dayGan === '癸' ? '계수일간' : ''));
    }

    const docData = {
      sessionId: _sessionId,
      nickname: _nickname,
      text: trimmed,
      card: card || null,
      tags: tags.filter(Boolean),
      reactions: { heart: 0, wow: 0, same: 0 },
      reactedSessions: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      const ref = await db.collection(COLLECTION).add(docData);
      // 즉시 로컬에 추가 (실시간 리스너가 처리하기 전에 UI 업데이트)
      const localDoc = {
        id: ref.id,
        data: () => ({ ...docData, createdAt: { toDate: () => new Date() } })
      };
      const listEl = document.getElementById('comments-list');
      const emptyEl = document.getElementById('empty-state');
      if (listEl) {
        if (emptyEl) emptyEl.style.display = 'none';
        listEl.insertAdjacentHTML('afterbegin', renderComment(localDoc, _sessionId));
      }
      _comments.unshift(localDoc);
      return true;
    } catch (err) {
      console.error('댓글 게시 실패:', err);
      alert('댓글 게시에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // 리액션
  // ─────────────────────────────────────────────
  async function reactToComment(commentId, reactionType) {
    const db = getDb();
    if (!db) return;

    const docRef = db.collection(COLLECTION).doc(commentId);

    try {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) return;

        const data = doc.data();
        const reactedSessions = data.reactedSessions || [];

        if (reactedSessions.includes(_sessionId)) {
          // 이미 리액션함 - 무시
          return;
        }

        const reactions = data.reactions || { heart: 0, wow: 0, same: 0 };
        reactions[reactionType] = (reactions[reactionType] || 0) + 1;

        transaction.update(docRef, {
          reactions: reactions,
          reactedSessions: firebase.firestore.FieldValue.arrayUnion(_sessionId)
        });

        // UI 즉시 업데이트
        const commentEl = document.querySelector(`.comment-item[data-id="${commentId}"]`);
        if (commentEl) {
          const countEl = commentEl.querySelector(`.reaction-count-${reactionType}`);
          if (countEl) countEl.textContent = reactions[reactionType];
          // 모든 버튼 강조
          commentEl.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.style.background = '#ffe0b2';
            btn.style.borderColor = '#f39c12';
          });
        }
      });
    } catch (err) {
      console.warn('리액션 실패:', err.message);
    }
  }

  // ─────────────────────────────────────────────
  // 공개 API
  // ─────────────────────────────────────────────
  window.CommunityApp = {
    init,
    generateNickname,
    postComment,
    reactToComment,
    changeNickname,
    loadComments,

    regenerateNickname: function () {
      const cache = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY) || '{}');
      const newNick = generateNickname(cache.dayGan || null);
      _nickname = newNick;
      localStorage.setItem(NICKNAME_KEY, newNick);
      localStorage.setItem(NICKNAME_SRC_KEY, 'generated');
      const el = document.getElementById('display-nickname');
      if (el) el.textContent = newNick;
      renderNicknameSection();
    },

    showNicknameInput: function () {
      const area = document.getElementById('nickname-input-area');
      if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
    },

    applyNickname: function () {
      const input = document.getElementById('nickname-custom-input');
      if (!input) return;
      const result = changeNickname(input.value);
      if (result) {
        _nickname = result;
        renderNicknameSection();
      } else {
        alert('닉네임을 입력해주세요. (최대 12자)');
      }
    },

    _seedReact: function (commentId, type, btn) {
      const key = commentId + '_' + type;
      if (_seedReacted[key]) return;
      _seedReacted[key] = true;
      const comment = SEED_COMMENTS.find(c => c.id === commentId);
      if (!comment) return;
      comment.reactions[type] = (comment.reactions[type] || 0) + 1;
      const item = document.querySelector(`.seed-comment[data-id="${commentId}"]`);
      if (item) {
        const span = item.querySelector('.sc-' + type);
        if (span) span.textContent = comment.reactions[type];
        btn.style.background = '#ffe0b2';
        btn.style.borderColor = '#f39c12';
      }
    },

    removeCard: function () {
      _pendingCard = null;
      renderCardPreview();
    },

    submitComment: async function () {
      const textarea = document.getElementById('comment-textarea');
      if (!textarea) return;
      const text = textarea.value.trim();
      if (!text) {
        alert('댓글 내용을 입력해주세요!');
        return;
      }
      if (text.length > 300) {
        alert('300자 이하로 작성해주세요.');
        return;
      }

      const btn = document.getElementById('submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '게시 중...';
      }

      const success = await postComment(text, _pendingCard);
      if (success) {
        textarea.value = '';
        const counter = document.getElementById('char-counter');
        if (counter) counter.textContent = '300자 남음';
        _pendingCard = null;
        renderCardPreview();
      }

      if (btn) {
        btn.disabled = false;
        btn.textContent = '댓글 남기기 🐯';
      }
    }
  };

})();
