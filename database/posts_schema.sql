-- =============================================================================
-- Community Posts Schema
-- Idempotent SQL for Supabase (PostgreSQL)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- POSTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IS NULL OR media_type = 'image'),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- POST LIKES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- =============================================================================
-- POST COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);

-- =============================================================================
-- TRIGGERS: Auto-update like_count and comment_count
-- =============================================================================

-- Like count trigger
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_like_count_trigger ON public.post_likes;
CREATE TRIGGER post_like_count_trigger
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Comment count trigger
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comment_count_trigger ON public.post_comments;
CREATE TRIGGER post_comment_count_trigger
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- POSTS Policies
-- -----------------------------------------------------------------------------

-- SELECT: Approved community members can view posts
DROP POLICY IF EXISTS "Community members can view posts" ON public.posts;
CREATE POLICY "Community members can view posts"
    ON public.posts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = posts.community_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
        OR
        -- Community creator can always view
        EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = posts.community_id
            AND c.created_by = auth.uid()
        )
    );

-- INSERT: Only approved community members can create posts (CRUCIAL RLS)
DROP POLICY IF EXISTS "Approved members can create posts" ON public.posts;
CREATE POLICY "Approved members can create posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = posts.community_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
    );

-- UPDATE: Authors can update their own posts
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
CREATE POLICY "Authors can update own posts"
    ON public.posts
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- DELETE: Authors can delete their own posts
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
CREATE POLICY "Authors can delete own posts"
    ON public.posts
    FOR DELETE
    USING (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- POST LIKES Policies
-- -----------------------------------------------------------------------------

-- SELECT: Approved community members can view likes
DROP POLICY IF EXISTS "Community members can view post likes" ON public.post_likes;
CREATE POLICY "Community members can view post likes"
    ON public.post_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.community_members cm ON cm.community_id = p.community_id
            WHERE p.id = post_likes.post_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
    );

-- INSERT: Approved community members can like posts
DROP POLICY IF EXISTS "Approved members can like posts" ON public.post_likes;
CREATE POLICY "Approved members can like posts"
    ON public.post_likes
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.community_members cm ON cm.community_id = p.community_id
            WHERE p.id = post_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
    );

-- DELETE: Users can remove their own likes
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts"
    ON public.post_likes
    FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- POST COMMENTS Policies
-- -----------------------------------------------------------------------------

-- SELECT: Approved community members can view comments
DROP POLICY IF EXISTS "Community members can view comments" ON public.post_comments;
CREATE POLICY "Community members can view comments"
    ON public.post_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.community_members cm ON cm.community_id = p.community_id
            WHERE p.id = post_comments.post_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
    );

-- INSERT: Approved community members can comment on posts
DROP POLICY IF EXISTS "Approved members can comment on posts" ON public.post_comments;
CREATE POLICY "Approved members can comment on posts"
    ON public.post_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.community_members cm ON cm.community_id = p.community_id
            WHERE p.id = post_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
    );

-- DELETE: Authors can delete their own comments
DROP POLICY IF EXISTS "Authors can delete own comments" ON public.post_comments;
CREATE POLICY "Authors can delete own comments"
    ON public.post_comments
    FOR DELETE
    USING (auth.uid() = author_id);

-- =============================================================================
-- STORAGE BUCKET: post-media
-- =============================================================================

-- Create the bucket (run in Supabase Dashboard > Storage or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated users can upload to post-media
DROP POLICY IF EXISTS "Authenticated users can upload post media" ON storage.objects;
CREATE POLICY "Authenticated users can upload post media"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'post-media'
        AND auth.role() = 'authenticated'
    );

-- Storage RLS: Public read access for post media
DROP POLICY IF EXISTS "Public can view post media" ON storage.objects;
CREATE POLICY "Public can view post media"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'post-media');

-- Storage RLS: Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'post-media'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check tables were created
SELECT 'posts' AS table_name, EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'posts'
) AS exists
UNION ALL
SELECT 'post_likes', EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'post_likes'
)
UNION ALL
SELECT 'post_comments', EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'post_comments'
);

-- Check policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('posts', 'post_likes', 'post_comments');
