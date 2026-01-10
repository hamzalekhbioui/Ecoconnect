-- =============================================================================
-- BLOCKED USERS SCHEMA
-- One-directional blocking system for user safety
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: Create the blocked_users table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-blocking
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
    
    -- Unique constraint: one block record per pair
    CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- Add FK to profiles for PostgREST joins
ALTER TABLE public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_profiles_fkey
    FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_profiles_fkey
    FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 2: Enable RLS and create policies
-- =============================================================================

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view blocks involving them (either as blocker or blocked)
-- This allows users to check if they've been blocked by someone
DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocked_users;
CREATE POLICY "Users can view own blocks"
    ON public.blocked_users FOR SELECT
    USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Policy: Users can block other users
DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others"
    ON public.blocked_users FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

-- Policy: Users can unblock (delete their blocks)
DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock"
    ON public.blocked_users FOR DELETE
    USING (auth.uid() = blocker_id);

-- =============================================================================
-- STEP 3: Helper function to check if user is blocked
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_user_blocked(user_id UUID, by_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_users
        WHERE blocker_id = by_user_id AND blocked_id = user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_user_blocked(UUID, UUID) TO authenticated;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check policies are created:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'blocked_users';
