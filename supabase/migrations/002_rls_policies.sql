-- ============================================================
-- EcoConnect — Row-Level Security Policies
-- Run after 001_initial_schema.sql
-- ============================================================
-- Note: service-role key always bypasses RLS (Supabase default).
-- These policies protect direct anon/authenticated access and
-- future user-JWT forwarding from the NestJS API.
-- ============================================================

-- ────────────────────────────────────────
-- Enable RLS
-- ────────────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports               ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────
-- Helper: is the current user an admin?
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────
CREATE POLICY "profiles_select" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
    FOR DELETE TO authenticated USING (is_admin());

-- ────────────────────────────────────────
-- communities
-- ────────────────────────────────────────
CREATE POLICY "communities_select" ON communities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "communities_insert" ON communities
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "communities_update" ON communities
    FOR UPDATE TO authenticated USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = communities.id
              AND cm.user_id = auth.uid()
              AND cm.role = 'admin'
              AND cm.status = 'approved'
        ) OR
        is_admin()
    );

CREATE POLICY "communities_delete" ON communities
    FOR DELETE TO authenticated USING (auth.uid() = created_by OR is_admin());

-- ────────────────────────────────────────
-- community_members
-- ────────────────────────────────────────
CREATE POLICY "community_members_select" ON community_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "community_members_insert" ON community_members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_members_update" ON community_members
    FOR UPDATE TO authenticated USING (
        -- community admin
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_members.community_id
              AND cm.user_id = auth.uid()
              AND cm.role = 'admin'
              AND cm.status = 'approved'
        ) OR
        is_admin()
    );

CREATE POLICY "community_members_delete" ON community_members
    FOR DELETE TO authenticated USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_members.community_id
              AND cm.user_id = auth.uid()
              AND cm.role = 'admin'
              AND cm.status = 'approved'
        ) OR
        is_admin()
    );

-- ────────────────────────────────────────
-- posts
-- ────────────────────────────────────────
CREATE POLICY "posts_select" ON posts
    FOR SELECT TO authenticated USING (
        status = 'published' OR
        author_id = auth.uid() OR
        is_admin()
    );

CREATE POLICY "posts_insert" ON posts
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = posts.community_id
              AND cm.user_id = auth.uid()
              AND cm.status = 'approved'
        )
    );

CREATE POLICY "posts_update" ON posts
    FOR UPDATE TO authenticated USING (
        auth.uid() = author_id OR is_admin()
    );

CREATE POLICY "posts_delete" ON posts
    FOR DELETE TO authenticated USING (
        auth.uid() = author_id OR is_admin()
    );

-- ────────────────────────────────────────
-- post_likes
-- ────────────────────────────────────────
CREATE POLICY "post_likes_select" ON post_likes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "post_likes_insert" ON post_likes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_likes_delete" ON post_likes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ────────────────────────────────────────
-- post_comments
-- ────────────────────────────────────────
CREATE POLICY "post_comments_select" ON post_comments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "post_comments_insert" ON post_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "post_comments_update" ON post_comments
    FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "post_comments_delete" ON post_comments
    FOR DELETE TO authenticated USING (
        auth.uid() = author_id OR is_admin()
    );

-- ────────────────────────────────────────
-- conversations
-- ────────────────────────────────────────
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT TO authenticated USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
    );

CREATE POLICY "conversations_insert" ON conversations
    FOR INSERT TO authenticated WITH CHECK (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
    );

-- ────────────────────────────────────────
-- messages
-- ────────────────────────────────────────
CREATE POLICY "messages_select" ON messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
              AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "messages_insert" ON messages
    FOR INSERT TO authenticated WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
              AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

CREATE POLICY "messages_update" ON messages
    FOR UPDATE TO authenticated USING (sender_id = auth.uid());

-- ────────────────────────────────────────
-- friendships
-- ────────────────────────────────────────
CREATE POLICY "friendships_select" ON friendships
    FOR SELECT TO authenticated USING (
        requester_id = auth.uid() OR receiver_id = auth.uid()
    );

CREATE POLICY "friendships_insert" ON friendships
    FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friendships_update" ON friendships
    FOR UPDATE TO authenticated USING (
        receiver_id = auth.uid() OR is_admin()
    );

CREATE POLICY "friendships_delete" ON friendships
    FOR DELETE TO authenticated USING (
        requester_id = auth.uid() OR receiver_id = auth.uid() OR is_admin()
    );

-- ────────────────────────────────────────
-- community_events
-- ────────────────────────────────────────
CREATE POLICY "community_events_select" ON community_events
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_events.community_id
              AND cm.user_id = auth.uid()
              AND cm.status = 'approved'
        ) OR
        is_admin()
    );

CREATE POLICY "community_events_insert" ON community_events
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM community_members cm
            WHERE cm.community_id = community_events.community_id
              AND cm.user_id = auth.uid()
              AND cm.role = 'admin'
              AND cm.status = 'approved'
        )
    );

CREATE POLICY "community_events_update" ON community_events
    FOR UPDATE TO authenticated USING (
        auth.uid() = created_by OR is_admin()
    );

CREATE POLICY "community_events_delete" ON community_events
    FOR DELETE TO authenticated USING (
        auth.uid() = created_by OR is_admin()
    );

-- ────────────────────────────────────────
-- marketplace_listings
-- ────────────────────────────────────────
CREATE POLICY "listings_select" ON marketplace_listings
    FOR SELECT TO authenticated USING (
        status = 'active' OR seller_id = auth.uid() OR is_admin()
    );

CREATE POLICY "listings_insert" ON marketplace_listings
    FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());

CREATE POLICY "listings_update" ON marketplace_listings
    FOR UPDATE TO authenticated USING (
        seller_id = auth.uid() OR is_admin()
    );

CREATE POLICY "listings_delete" ON marketplace_listings
    FOR DELETE TO authenticated USING (
        seller_id = auth.uid() OR is_admin()
    );

-- ────────────────────────────────────────
-- reports
-- ────────────────────────────────────────
CREATE POLICY "reports_select" ON reports
    FOR SELECT TO authenticated USING (
        reporter_id = auth.uid() OR is_admin()
    );

CREATE POLICY "reports_insert" ON reports
    FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_admin" ON reports
    FOR UPDATE TO authenticated USING (is_admin());
