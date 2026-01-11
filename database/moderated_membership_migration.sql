-- =============================================================================
-- NUCLEAR FIX: Drop ALL policies on community_members
-- Run this FIRST in Supabase SQL Editor, then run the second block
-- =============================================================================

-- BLOCK 1: Run this FIRST to see what policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'community_members';

-- =============================================================================
-- BLOCK 2: Run these commands ONE BY ONE after seeing the list above
-- Replace the policy names with what you see in BLOCK 1 results
-- =============================================================================

-- Drop each policy that shows up in the list above:
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'community_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.community_members';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Verify all policies are dropped
SELECT policyname FROM pg_policies WHERE tablename = 'community_members';
-- This should return 0 rows

-- =============================================================================
-- BLOCK 3: Create fresh, simple policies (NO SELF-REFERENCES)
-- =============================================================================

-- Fix default status
ALTER TABLE public.community_members ALTER COLUMN status SET DEFAULT 'pending';

-- 1. Users can view their OWN memberships
CREATE POLICY "view_own_memberships"
    ON public.community_members FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Community creators can view members (uses subquery to communities table)
CREATE POLICY "creators_view_members"
    ON public.community_members FOR SELECT
    USING (
        community_id IN (SELECT id FROM public.communities WHERE created_by = auth.uid())
    );

-- 3. Users can insert their own memberships
CREATE POLICY "insert_own_membership"
    ON public.community_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own memberships
CREATE POLICY "delete_own_membership"
    ON public.community_members FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Creators can update members in their communities
-- NOTE: Both USING and WITH CHECK are required for UPDATE policies
-- USING = which rows can be selected for update
-- WITH CHECK = validates the new row values are allowed
CREATE POLICY "creators_update_members"
    ON public.community_members FOR UPDATE
    USING (
        community_id IN (SELECT id FROM public.communities WHERE created_by = auth.uid())
    )
    WITH CHECK (
        community_id IN (SELECT id FROM public.communities WHERE created_by = auth.uid())
    );

-- 6. Creators can delete members in their communities
CREATE POLICY "creators_delete_members"
    ON public.community_members FOR DELETE
    USING (
        community_id IN (SELECT id FROM public.communities WHERE created_by = auth.uid())
    );

-- Verify new policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'community_members';
