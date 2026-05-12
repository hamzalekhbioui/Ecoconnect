-- ============================================================
-- EcoConnect — Initial Schema
-- Run this first in the new Supabase SQL editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────
-- Enum types
-- ────────────────────────────────────────
CREATE TYPE user_role             AS ENUM ('admin', 'member', 'visitor');
CREATE TYPE user_status           AS ENUM ('pending', 'approved');
CREATE TYPE member_status         AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE member_role           AS ENUM ('admin', 'member');
CREATE TYPE post_status           AS ENUM ('pending', 'published', 'rejected');
CREATE TYPE media_type            AS ENUM ('image', 'video');
CREATE TYPE attachment_type       AS ENUM ('image', 'document');
CREATE TYPE friendship_status     AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE event_location_type   AS ENUM ('online', 'in_person', 'hybrid');
CREATE TYPE listing_category      AS ENUM ('plants', 'seeds', 'tools', 'produce', 'services', 'other');
CREATE TYPE listing_status        AS ENUM ('active', 'sold', 'removed');
CREATE TYPE report_status         AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- ────────────────────────────────────────
-- Tables
-- ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    email       TEXT,
    avatar_url  TEXT,
    role        user_role   NOT NULL DEFAULT 'member',
    status      user_status NOT NULL DEFAULT 'approved',
    credits     NUMERIC     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communities (
    id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                            TEXT        NOT NULL,
    slug                            TEXT        NOT NULL UNIQUE,
    description                     TEXT,
    cover_image                     TEXT,
    created_by                      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requires_post_approval          BOOLEAN     NOT NULL DEFAULT false,
    requires_membership_approval    BOOLEAN     NOT NULL DEFAULT false,
    member_count                    INTEGER     NOT NULL DEFAULT 0,
    tags                            TEXT[],
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_members (
    id              UUID            DEFAULT gen_random_uuid(),
    community_id    UUID            NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id         UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status          member_status   NOT NULL DEFAULT 'approved',
    role            member_role     NOT NULL DEFAULT 'member',
    request_message TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID        NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    author_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content      TEXT        NOT NULL CHECK (char_length(content) <= 5000),
    media_url    TEXT,
    media_type   media_type,
    status       post_status NOT NULL DEFAULT 'published',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL CHECK (char_length(content) <= 2000),
    parent_id  UUID        REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID            NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content         TEXT            NOT NULL CHECK (char_length(content) <= 5000),
    attachment_url  TEXT,
    attachment_type attachment_type,
    is_read         BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS friendships (
    id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id  UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status       friendship_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (requester_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS community_events (
    id            UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id  UUID                NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_by    UUID                NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title         TEXT                NOT NULL CHECK (char_length(title) <= 200),
    description   TEXT                CHECK (char_length(description) <= 5000),
    start_time    TIMESTAMPTZ         NOT NULL,
    end_time      TIMESTAMPTZ,
    location_type event_location_type NOT NULL DEFAULT 'online',
    meeting_link  TEXT,
    address       TEXT,
    cover_image   TEXT,
    max_attendees INTEGER,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id   UUID             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       TEXT             NOT NULL CHECK (char_length(title) <= 200),
    description TEXT             CHECK (char_length(description) <= 5000),
    category    listing_category NOT NULL DEFAULT 'other',
    price       NUMERIC,
    image_url   TEXT,
    location    TEXT,
    status      listing_status   NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id  UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reported_id  UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason       TEXT          NOT NULL,
    description  TEXT,
    context_json JSONB,
    status       report_status NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────
CREATE INDEX idx_community_members_community  ON community_members(community_id);
CREATE INDEX idx_community_members_user       ON community_members(user_id);
CREATE INDEX idx_community_members_status     ON community_members(status);
CREATE INDEX idx_posts_community              ON posts(community_id);
CREATE INDEX idx_posts_author                 ON posts(author_id);
CREATE INDEX idx_posts_status                 ON posts(status);
CREATE INDEX idx_post_likes_post              ON post_likes(post_id);
CREATE INDEX idx_post_comments_post           ON post_comments(post_id);
CREATE INDEX idx_messages_conversation        ON messages(conversation_id);
CREATE INDEX idx_messages_sender              ON messages(sender_id);
CREATE INDEX idx_conversations_p1             ON conversations(participant_1);
CREATE INDEX idx_conversations_p2             ON conversations(participant_2);
CREATE INDEX idx_friendships_requester        ON friendships(requester_id);
CREATE INDEX idx_friendships_receiver         ON friendships(receiver_id);
CREATE INDEX idx_listings_seller              ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status              ON marketplace_listings(status);
CREATE INDEX idx_listings_category            ON marketplace_listings(category);
CREATE INDEX idx_reports_status               ON reports(status);
CREATE INDEX idx_reports_reporter             ON reports(reporter_id);
CREATE INDEX idx_events_community             ON community_events(community_id);

-- ────────────────────────────────────────
-- updated_at trigger
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at           BEFORE UPDATE ON profiles           FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_communities_updated_at         BEFORE UPDATE ON communities         FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_community_members_updated_at   BEFORE UPDATE ON community_members   FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_posts_updated_at               BEFORE UPDATE ON posts               FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_post_comments_updated_at       BEFORE UPDATE ON post_comments       FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_conversations_updated_at       BEFORE UPDATE ON conversations       FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_messages_updated_at            BEFORE UPDATE ON messages            FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_friendships_updated_at         BEFORE UPDATE ON friendships         FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_community_events_updated_at    BEFORE UPDATE ON community_events    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_reports_updated_at             BEFORE UPDATE ON reports             FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ────────────────────────────────────────
-- Auto-create profile on sign-up
-- ────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'member',
        'approved'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE handle_new_user();

-- member_count maintenance trigger
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = NEW.community_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count
    AFTER INSERT OR UPDATE OR DELETE ON community_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_community_member_count();

-- last_message_at maintenance trigger
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE PROCEDURE update_conversation_last_message();
