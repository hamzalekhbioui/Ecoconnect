-- =============================================================================
-- Member Count Fix Migration
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Fix the trigger function
-- Bug: DELETE case was decrementing count even for pending members
-- =============================================================================

CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Only increment if the new member is approved
        IF NEW.status = 'approved' THEN
            UPDATE public.communities 
            SET member_count = member_count + 1 
            WHERE id = NEW.community_id;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Only decrement if the deleted member was approved
        IF OLD.status = 'approved' THEN
            UPDATE public.communities 
            SET member_count = GREATEST(member_count - 1, 0) 
            WHERE id = OLD.community_id;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Status changed TO approved: increment
        IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
            UPDATE public.communities 
            SET member_count = member_count + 1 
            WHERE id = NEW.community_id;
        -- Status changed FROM approved: decrement
        ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
            UPDATE public.communities 
            SET member_count = GREATEST(member_count - 1, 0) 
            WHERE id = NEW.community_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- =============================================================================
-- STEP 2: Recalculate all existing member counts
-- This fixes any incorrect counts from before
-- =============================================================================

UPDATE public.communities c
SET member_count = (
    SELECT COUNT(*) 
    FROM public.community_members cm 
    WHERE cm.community_id = c.id 
    AND cm.status = 'approved'
);

-- =============================================================================
-- STEP 3: Verify the fix
-- =============================================================================

-- Check community member counts vs actual approved members
SELECT 
    c.id,
    c.name,
    c.member_count as cached_count,
    (SELECT COUNT(*) FROM public.community_members cm 
     WHERE cm.community_id = c.id AND cm.status = 'approved') as actual_count
FROM public.communities c;



-- =============================================================================
-- Add Foreign Key from community_members to profiles for JOIN support
-- This enables Supabase PostgREST to recognize the relationship
-- =============================================================================

-- Since profiles.id and auth.users.id are the same (profiles is created with user id),
-- we add a direct FK relationship from community_members.user_id to profiles.id

-- First check if the constraint exists, drop it if so (idempotent)
DO $$ 
BEGIN
    -- Try to drop if exists (won't error if doesn't exist due to IF EXISTS)
    ALTER TABLE public.community_members 
        DROP CONSTRAINT IF EXISTS community_members_user_id_profiles_fkey;
EXCEPTION WHEN OTHERS THEN
    -- Ignore any errors
    NULL;
END $$;

-- Add the foreign key relationship
-- This allows Supabase PostgREST to do: .select('*, profile:profiles(...)')
ALTER TABLE public.community_members
    ADD CONSTRAINT community_members_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Verify the relationship was created
-- SELECT conname FROM pg_constraint WHERE conrelid = 'community_members'::regclass;
