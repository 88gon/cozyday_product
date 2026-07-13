// functions/api/react.js
// Cloudflare Pages Function - 리액션 POST

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

// POST /api/react
// body: { commentId, sessionId, reactionType: 'heart'|'wow'|'same' }
export async function onRequestPost({ env, request }) {
  try {
    const { commentId, sessionId, reactionType } = await request.json();

    if (!commentId || !sessionId || !['heart', 'wow', 'same'].includes(reactionType)) {
      return json({ ok: false, error: '잘못된 요청' }, 400);
    }

    // 현재 댓글 조회
    const { results } = await env.DB.prepare(
      'SELECT heart_count, wow_count, same_count, reacted_json FROM comments WHERE id = ?'
    ).bind(commentId).all();

    if (!results.length) {
      return json({ ok: false, error: '댓글 없음' }, 404);
    }

    const row = results[0];
    const reacted = JSON.parse(row.reacted_json || '[]');

    if (reacted.includes(sessionId)) {
      return json({ ok: false, error: '이미 리액션함' }, 409);
    }

    const colMap = { heart: 'heart_count', wow: 'wow_count', same: 'same_count' };
    const col    = colMap[reactionType];
    reacted.push(sessionId);

    await env.DB.prepare(
      `UPDATE comments SET ${col} = ${col} + 1, reacted_json = ? WHERE id = ?`
    ).bind(JSON.stringify(reacted), commentId).run();

    const newCount = (row[col] || 0) + 1;
    return json({ ok: true, newCount });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
