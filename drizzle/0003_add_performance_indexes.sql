-- Performance indexes for high-frequency queries
-- Created for Phase 12: Performance & Caching Optimization

-- High-frequency queries on user_id
CREATE INDEX IF NOT EXISTS "decks_user_id_idx" ON "decks" ("user_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");

-- Team-related queries
CREATE INDEX IF NOT EXISTS "decks_team_id_idx" ON "decks" ("team_id");

-- Share lookups (composite index for active share queries)
CREATE INDEX IF NOT EXISTS "deck_shares_deck_id_idx" ON "deck_shares" ("deck_id", "is_active");
