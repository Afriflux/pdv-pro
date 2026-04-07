-- ─── sql/community_migration.sql ────────────────────────────────────────────
-- Migration : Tables Communauté Yayyam
-- CommunityPost | CommunityLike | CommunityComment
-- Exécuter dans Supabase SQL Editor

-- ─── Table Posts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CommunityPost" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id    TEXT        NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  image_url   TEXT,
  category    TEXT        NOT NULL DEFAULT 'general'
              CHECK (category IN ('general', 'question', 'success', 'tip', 'mode', 'digital', 'food')),
  likes_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Table Likes ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CommunityLike" (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id    TEXT        NOT NULL REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  store_id   TEXT        NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, store_id)
);

-- ─── Table Commentaires ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CommunityComment" (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id    TEXT        NOT NULL REFERENCES "CommunityPost"(id) ON DELETE CASCADE,
  store_id   TEXT        NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_community_post_category  ON "CommunityPost"(category);
CREATE INDEX IF NOT EXISTS idx_community_post_store     ON "CommunityPost"(store_id);
CREATE INDEX IF NOT EXISTS idx_community_post_created   ON "CommunityPost"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_like_post      ON "CommunityLike"(post_id);
CREATE INDEX IF NOT EXISTS idx_community_like_store     ON "CommunityLike"(store_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_post   ON "CommunityComment"(post_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE "CommunityPost"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityLike"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityComment" ENABLE ROW LEVEL SECURITY;

-- Lecture publique (feed visible à tous)
CREATE POLICY "community_posts_select"
  ON "CommunityPost" FOR SELECT USING (true);

CREATE POLICY "community_likes_select"
  ON "CommunityLike" FOR SELECT USING (true);

CREATE POLICY "community_comments_select"
  ON "CommunityComment" FOR SELECT USING (true);

-- Écriture (authentifiée via service role dans les API routes)
CREATE POLICY "community_posts_insert"
  ON "CommunityPost" FOR INSERT WITH CHECK (true);

CREATE POLICY "community_posts_update"
  ON "CommunityPost" FOR UPDATE USING (true);

CREATE POLICY "community_likes_insert"
  ON "CommunityLike" FOR INSERT WITH CHECK (true);

CREATE POLICY "community_likes_delete"
  ON "CommunityLike" FOR DELETE USING (true);

CREATE POLICY "community_comments_insert"
  ON "CommunityComment" FOR INSERT WITH CHECK (true);
