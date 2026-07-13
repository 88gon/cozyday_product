-- 49사주 대나무숲 댓글 테이블
-- Cloudflare D1 대시보드 또는 wrangler CLI로 실행해주세요:
--   wrangler d1 execute saju-comments --file=schema.sql

CREATE TABLE IF NOT EXISTS comments (
  id              TEXT    PRIMARY KEY,
  session_id      TEXT    NOT NULL,
  nickname        TEXT    NOT NULL,
  text            TEXT    NOT NULL,
  card_json       TEXT,
  tags_json       TEXT    DEFAULT '[]',
  heart_count     INTEGER DEFAULT 0,
  wow_count       INTEGER DEFAULT 0,
  same_count      INTEGER DEFAULT 0,
  reacted_json    TEXT    DEFAULT '[]',
  created_at      INTEGER NOT NULL  -- Unix ms timestamp
);

CREATE INDEX IF NOT EXISTS idx_created_at ON comments(created_at DESC);

-- ── Migration v2: 수정/삭제 기능 지원 ──────────────────
-- D1 콘솔에서 아래 두 줄을 실행해주세요 (이미 테이블이 있는 경우):
--   ALTER TABLE comments ADD COLUMN pin_hash TEXT;
--   ALTER TABLE comments ADD COLUMN ip_hash  TEXT;
-- (신규 테이블 생성 시에는 아래 DROP 후 위 CREATE TABLE 재실행)
ALTER TABLE comments ADD COLUMN pin_hash TEXT;
ALTER TABLE comments ADD COLUMN ip_hash  TEXT;
