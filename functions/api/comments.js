// functions/api/comments.js
// Cloudflare Pages Function - 댓글 GET / POST / PATCH / DELETE

const PAGE_SIZE    = 20;
const MAX_ROWS     = 2_250_000;   // 4.5GB 기준 (행당 평균 2KB)
const CLEANUP_ROWS = 200_000;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// 문자열 SHA-256 해시 (16자리 축약)
async function hashStr(str) {
  const data = new TextEncoder().encode(str + '_49saju_salt');
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 32);
}

// 수정/삭제 권한 확인 (세션 OR IP OR 비밀번호)
async function verifyOwnership(env, commentId, sessionId, pin, ip) {
  const { results } = await env.DB.prepare(
    'SELECT session_id, pin_hash, ip_hash FROM comments WHERE id = ?'
  ).bind(commentId).all();

  if (!results.length) return { ok: false, error: '댓글을 찾을 수 없어요.' };

  const row = results[0];

  // 1. 같은 세션 (동일 브라우저)
  if (row.session_id === sessionId) return { ok: true };

  // 2. 같은 IP
  if (ip) {
    const ipHash = await hashStr(ip);
    if (row.ip_hash && row.ip_hash === ipHash) return { ok: true };
  }

  // 3. 비밀번호 일치
  if (pin && /^\d{1,4}$/.test(String(pin))) {
    const pinHash = await hashStr(String(pin));
    if (row.pin_hash && row.pin_hash === pinHash) return { ok: true };
  }

  return { ok: false, error: '비밀번호가 틀렸거나 수정·삭제 권한이 없어요.' };
}

// ──────────────────────────────────────────
// GET /api/comments?page=0&tag=#갑목일간
// ──────────────────────────────────────────
export async function onRequestGet({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결' }, 503);

  const url    = new URL(request.url);
  const page   = Math.max(0, parseInt(url.searchParams.get('page') || '0'));
  const tag    = url.searchParams.get('tag') || '';
  const offset = page * PAGE_SIZE;

  try {
    const stmt = tag
      ? env.DB.prepare(`SELECT * FROM comments WHERE tags_json LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(`%${tag}%`, PAGE_SIZE, offset)
      : env.DB.prepare(`SELECT * FROM comments ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(PAGE_SIZE, offset);

    const { results } = await stmt.all();

    const comments = results.map(row => ({
      id:       row.id,
      sessionId: row.session_id,
      nickname: row.nickname,
      text:     row.text,
      card:     row.card_json ? JSON.parse(row.card_json) : null,
      tags:     row.tags_json ? JSON.parse(row.tags_json) : [],
      reactions: { heart: row.heart_count||0, wow: row.wow_count||0, same: row.same_count||0 },
      reactedSessions: row.reacted_json ? JSON.parse(row.reacted_json) : [],
      createdAt: row.created_at,
      hasPin: !!row.pin_hash   // 비밀번호 설정 여부 (프론트에서 자물쇠 표시용)
    }));

    return json({ ok: true, comments, page, hasMore: results.length === PAGE_SIZE });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ──────────────────────────────────────────
// POST /api/comments
// body: { sessionId, nickname, text, card?, tags?, pin? }
// ──────────────────────────────────────────
export async function onRequestPost({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결' }, 503);
  try {
    const body = await request.json();
    const { sessionId, nickname, text, card, tags, pin } = body;

    if (!text || text.trim().length === 0 || text.length > 300)
      return json({ ok: false, error: '텍스트는 1~300자 이내여야 합니다.' }, 400);
    if (!sessionId || !nickname)
      return json({ ok: false, error: '세션/닉네임 누락' }, 400);

    const ip      = request.headers.get('CF-Connecting-IP') || '';
    const ipHash  = ip  ? await hashStr(ip)  : null;
    const pinHash = (pin && /^\d{1,4}$/.test(String(pin))) ? await hashStr(String(pin)) : null;

    const id        = crypto.randomUUID();
    const createdAt = Date.now();

    await env.DB.prepare(`
      INSERT INTO comments
        (id, session_id, nickname, text, card_json, tags_json,
         heart_count, wow_count, same_count, reacted_json, created_at, pin_hash, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, '[]', ?, ?, ?)
    `).bind(
      id, sessionId, nickname.slice(0,20), text.trim(),
      card ? JSON.stringify(card) : null,
      JSON.stringify(tags || []),
      createdAt, pinHash, ipHash
    ).run();

    if (Math.random() < 0.1) await autoCleanup(env.DB);

    return json({ ok: true, id, createdAt });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ──────────────────────────────────────────
// PATCH /api/comments  (댓글 수정)
// body: { commentId, sessionId, text, pin? }
// ──────────────────────────────────────────
export async function onRequestPatch({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결' }, 503);
  try {
    const { commentId, sessionId, text, pin } = await request.json();

    if (!text || text.trim().length === 0 || text.length > 300)
      return json({ ok: false, error: '텍스트는 1~300자 이내여야 합니다.' }, 400);

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const auth = await verifyOwnership(env, commentId, sessionId, pin, ip);
    if (!auth.ok) return json(auth, 403);

    await env.DB.prepare('UPDATE comments SET text = ? WHERE id = ?')
      .bind(text.trim(), commentId).run();

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ──────────────────────────────────────────
// DELETE /api/comments  (댓글 삭제)
// body: { commentId, sessionId, pin? }
// ──────────────────────────────────────────
export async function onRequestDelete({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결' }, 503);
  try {
    const { commentId, sessionId, pin } = await request.json();

    const ip = request.headers.get('CF-Connecting-IP') || '';
    const auth = await verifyOwnership(env, commentId, sessionId, pin, ip);
    if (!auth.ok) return json(auth, 403);

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentId).run();
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ──────────────────────────────────────────
// OPTIONS (CORS preflight)
// ──────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

// ──────────────────────────────────────────
// 4.5GB 자동 정리
// ──────────────────────────────────────────
async function autoCleanup(db) {
  try {
    const { results } = await db.prepare('SELECT COUNT(*) as cnt FROM comments').all();
    const total = results[0]?.cnt ?? 0;
    if (total > MAX_ROWS) {
      await db.prepare(`DELETE FROM comments WHERE id IN (SELECT id FROM comments ORDER BY created_at ASC LIMIT ?)`).bind(CLEANUP_ROWS).run();
      console.log(`[자동정리] ${total}행 → ${CLEANUP_ROWS}행 삭제`);
    }
  } catch (err) {
    console.error('[자동정리 실패]', err.message);
  }
}
