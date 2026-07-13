// functions/api/comments.js
// Cloudflare Pages Function - 댓글 GET / POST
//
// ✅ 설정 방법 (Cloudflare 대시보드):
//  1. Workers & Pages → D1 → 데이터베이스 생성 (이름: saju-comments)
//  2. schema.sql 내용을 D1 콘솔에서 실행
//  3. Pages 프로젝트 → Settings → Functions → D1 database bindings
//     Variable name: DB  /  D1 database: saju-comments

const PAGE_SIZE = 20;

// 4.5GB 기준: 행당 평균 2KB 가정 → 4.5GB / 2KB = 2,250,000 행
// 4.5GB 초과 감지 후 오래된 것부터 삭제
const MAX_ROWS     = 2_250_000;
const CLEANUP_ROWS = 200_000;  // 초과 시 한 번에 삭제할 행 수

// CORS 헤더
const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// ──────────────────────────────────────────
// GET /api/comments?page=0&tag=#갑목일간
// ──────────────────────────────────────────
export async function onRequestGet({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결 (Cloudflare 대시보드에서 DB 바인딩 필요)' }, 503);
  const url    = new URL(request.url);
  const page   = Math.max(0, parseInt(url.searchParams.get('page') || '0'));
  const tag    = url.searchParams.get('tag') || '';
  const offset = page * PAGE_SIZE;

  try {
    let stmt;
    if (tag) {
      stmt = env.DB.prepare(
        `SELECT * FROM comments WHERE tags_json LIKE ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(`%${tag}%`, PAGE_SIZE, offset);
    } else {
      stmt = env.DB.prepare(
        `SELECT * FROM comments ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(PAGE_SIZE, offset);
    }

    const { results } = await stmt.all();

    const comments = results.map(row => ({
      id:        row.id,
      sessionId: row.session_id,
      nickname:  row.nickname,
      text:      row.text,
      card:      row.card_json ? JSON.parse(row.card_json) : null,
      tags:      row.tags_json ? JSON.parse(row.tags_json) : [],
      reactions: { heart: row.heart_count || 0, wow: row.wow_count || 0, same: row.same_count || 0 },
      reactedSessions: row.reacted_json ? JSON.parse(row.reacted_json) : [],
      createdAt: row.created_at
    }));

    return json({ ok: true, comments, page, hasMore: results.length === PAGE_SIZE });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ──────────────────────────────────────────
// POST /api/comments
// body: { sessionId, nickname, text, card?, tags? }
// ──────────────────────────────────────────
export async function onRequestPost({ env, request }) {
  if (!env.DB) return json({ ok: false, error: 'D1 DB 미연결' }, 503);
  try {
    const body = await request.json();
    const { sessionId, nickname, text, card, tags } = body;

    if (!text || text.trim().length === 0 || text.length > 300) {
      return json({ ok: false, error: '텍스트는 1~300자 이내여야 합니다.' }, 400);
    }
    if (!sessionId || !nickname) {
      return json({ ok: false, error: '세션/닉네임 누락' }, 400);
    }

    const id        = crypto.randomUUID();
    const createdAt = Date.now();

    await env.DB.prepare(`
      INSERT INTO comments
        (id, session_id, nickname, text, card_json, tags_json,
         heart_count, wow_count, same_count, reacted_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, '[]', ?)
    `).bind(
      id,
      sessionId,
      nickname.slice(0, 20),
      text.trim(),
      card ? JSON.stringify(card) : null,
      JSON.stringify(tags || []),
      createdAt
    ).run();

    // 10% 확률로 용량 체크 & 자동 정리 실행 (매 삽입마다 실행 방지)
    if (Math.random() < 0.1) {
      await autoCleanup(env.DB);
    }

    return json({ ok: true, id, createdAt });
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
      // 오래된 댓글부터 CLEANUP_ROWS 개 삭제
      await db.prepare(`
        DELETE FROM comments
        WHERE id IN (
          SELECT id FROM comments ORDER BY created_at ASC LIMIT ?
        )
      `).bind(CLEANUP_ROWS).run();

      console.log(`[자동정리] ${total}행 → ${CLEANUP_ROWS}행 삭제 완료`);
    }
  } catch (err) {
    console.error('[자동정리 실패]', err.message);
  }
}
