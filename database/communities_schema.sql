-- =============================================================================
-- Communities Module - Complete Schema
-- Idempotent SQL for Supabase (PostgreSQL)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT,
    is_private BOOLEAN DEFAULT false,
    member_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members Table (link between users and communities)
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_tags ON public.communities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON public.community_members(status);

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_communities_updated_at ON public.communities;
CREATE TRIGGER update_communities_updated_at
    BEFORE UPDATE ON public.communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRIGGER: Auto-update member_count when members change
-- =============================================================================

CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.communities 
        SET member_count = member_count + 1 
        WHERE id = NEW.community_id AND NEW.status = 'approved';
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.communities 
        SET member_count = GREATEST(member_count - 1, 0) 
        WHERE id = OLD.community_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If status changed to approved, increment
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE public.communities 
            SET member_count = member_count + 1 
            WHERE id = NEW.community_id;
        -- If status changed from approved, decrement
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE public.communities 
            SET member_count = GREATEST(member_count - 1, 0) 
            WHERE id = NEW.community_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_member_count_trigger ON public.community_members;
CREATE TRIGGER update_member_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.community_members
    FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Communities Policies
-- -----------------------------------------------------------------------------

-- PUBLIC: Everyone can view community details
DROP POLICY IF EXISTS "Public can view communities" ON public.communities;
CREATE POLICY "Public can view communities"
    ON public.communities
    FOR SELECT
    USING (true);

-- ADMIN: Only admins can manage communities
DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
CREATE POLICY "Admins can manage communities"
    ON public.communities
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- MEMBERS: Members can create communities
DROP POLICY IF EXISTS "Members can create communities" ON public.communities;
CREATE POLICY "Members can create communities"
    ON public.communities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('member', 'admin')
        )
    );

-- MEMBERS: Creators can update their own communities (future: add created_by column)
DROP POLICY IF EXISTS "Creators can update own communities" ON public.communities;
CREATE POLICY "Creators can update own communities"
    ON public.communities
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('member', 'admin')
        )
    );

-- -----------------------------------------------------------------------------
-- Community Members Policies
-- -----------------------------------------------------------------------------

-- Authenticated users can view membership (to check their own status)
DROP POLICY IF EXISTS "Users can view memberships" ON public.community_members;
CREATE POLICY "Users can view memberships"
    ON public.community_members
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Authenticated users with 'member' or 'admin' role can insert (join request)
DROP POLICY IF EXISTS "Members can join communities" ON public.community_members;
CREATE POLICY "Members can join communities"
    ON public.community_members
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('member', 'admin')
        )
    );

-- Users can delete their own membership (leave community)
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
CREATE POLICY "Users can leave communities"
    ON public.community_members
    FOR DELETE
    USING (auth.uid() = user_id);

-- Community admins can update membership status
DROP POLICY IF EXISTS "Community admins can manage members" ON public.community_members;
CREATE POLICY "Community admins can manage members"
    ON public.community_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = community_members.community_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- =============================================================================
-- SEED DATA: 3 Realistic Communities
-- =============================================================================

INSERT INTO public.communities (name, slug, description, cover_image, is_private, member_count, tags)
VALUES 
    (
        'Regenerative Agriculture',
        'regenerative-agriculture',
        'A community dedicated to techniques for soil restoration, permaculture, and sustainable farming practices. Share knowledge about crop rotation, composting, and natural pest control.',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80',
        false,
        1240,
        ARRAY['Agriculture', 'Sustainability', 'Permaculture', 'Soil Health']
    ),
    (
        'Circular Tech Repair',
        'circular-tech-repair',
        'Join us to learn and share skills for fixing electronics, reducing e-waste, and extending the life of devices. From smartphones to laptops, we believe in repair over replace.',
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
        false,
        850,
        ARRAY['Technology', 'Repair', 'E-waste', 'DIY']
    ),
    (
        'Local Currency Network',
        'local-currency-network',
        'A private community exploring alternative economic systems including local currencies, time banking, and community credit systems. Building resilient local economies together.',
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        true,
        320,
        ARRAY['Economics', 'Local Currency', 'Community', 'Finance']
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    cover_image = EXCLUDED.cover_image,
    is_private = EXCLUDED.is_private,
    tags = EXCLUDED.tags;
