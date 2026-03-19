-- ============================================================================
-- RPC atomique : incrémenter / décrémenter likes_count sur CommunityPost
-- Élimine la race condition du read-modify-write côté applicatif
-- À exécuter dans le SQL Editor Supabase AVANT déploiement
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_likes_count(
  p_post_id TEXT,
  delta     INTEGER  -- +1 pour like, -1 pour unlike
) RETURNS void
LANGUAGE sql
AS $$
  UPDATE "CommunityPost"
  SET likes_count = GREATEST(0, likes_count + delta)
  WHERE id = p_post_id;
$$;
