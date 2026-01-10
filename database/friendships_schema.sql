-- =============================================================================
-- FRIENDSHIPS SCHEMA
-- Friend request system restricted to community members
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: Create the friendships table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-friending
    CONSTRAINT no_self_friendship CHECK (requester_id != receiver_id),
    
    -- Unique constraint: only one relationship per pair (in one direction)
    CONSTRAINT unique_friendship_pair UNIQUE (requester_id, receiver_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Add FK to profiles for PostgREST joins
ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_requester_id_profiles_fkey
    FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_receiver_id_profiles_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 2: Create check_shared_community RPC function
-- Returns true if user_a and user_b share at least one approved community
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_shared_community(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_shared BOOLEAN;
BEGIN
    -- Check if there exists at least one community where both users are approved members
    SELECT EXISTS (
        SELECT 1 
        FROM public.community_members cm1
        INNER JOIN public.community_members cm2 
            ON cm1.community_id = cm2.community_id
        WHERE cm1.user_id = user_a 
            AND cm2.user_id = user_b
            AND cm1.status = 'approved'
            AND cm2.status = 'approved'
    ) INTO has_shared;
    
    RETURN has_shared;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_shared_community(UUID, UUID) TO authenticated;

-- =============================================================================
-- STEP 3: Create helper function to check friendship status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_friendship_status(user_a UUID, user_b UUID)
RETURNS TABLE (
    friendship_id UUID,
    status VARCHAR,
    is_requester BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.status,
        CASE WHEN f.requester_id = user_a THEN true ELSE false END,
        f.created_at
    FROM public.friendships f
    WHERE (f.requester_id = user_a AND f.receiver_id = user_b)
       OR (f.requester_id = user_b AND f.receiver_id = user_a)
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friendship_status(UUID, UUID) TO authenticated;

-- =============================================================================
-- STEP 4: Enable RLS and create policies
-- =============================================================================

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view friendships where they are requester or receiver
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
    ON public.friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Policy: Users can insert friend requests only if they share a community
DROP POLICY IF EXISTS "Users can send friend requests to community members" ON public.friendships;
CREATE POLICY "Users can send friend requests to community members"
    ON public.friendships FOR INSERT
    WITH CHECK (
        auth.uid() = requester_id 
        AND public.check_shared_community(requester_id, receiver_id) = true
    );

-- Policy: Receivers can update (accept/reject) requests sent to them
DROP POLICY IF EXISTS "Receivers can update friend requests" ON public.friendships;
CREATE POLICY "Receivers can update friend requests"
    ON public.friendships FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- Policy: Users can delete their own requests (as requester) or rejected requests (as receiver)
DROP POLICY IF EXISTS "Users can delete their friend requests" ON public.friendships;
CREATE POLICY "Users can delete their friend requests"
    ON public.friendships FOR DELETE
    USING (
        auth.uid() = requester_id 
        OR (auth.uid() = receiver_id AND status = 'rejected')
    );

-- =============================================================================
-- STEP 5: Create trigger for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friendships_updated_at ON public.friendships;
CREATE TRIGGER friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION update_friendships_updated_at();

-- =============================================================================
-- STEP 6: Auto-create conversation when friendship is accepted
-- This trigger automatically provisions a conversation and welcome message
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_create_conversation_on_friendship()
RETURNS TRIGGER AS $$
DECLARE
    new_conversation_id UUID;
    p1 UUID;
    p2 UUID;
BEGIN
    -- Only trigger when status changes from 'pending' to 'accepted'
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        
        -- Normalize user order (lower UUID first) to match conversation convention
        IF NEW.requester_id < NEW.receiver_id THEN
            p1 := NEW.requester_id;
            p2 := NEW.receiver_id;
        ELSE
            p1 := NEW.receiver_id;
            p2 := NEW.requester_id;
        END IF;
        
        -- Check if conversation already exists between these users
        SELECT id INTO new_conversation_id
        FROM public.conversations
        WHERE (participant_1 = p1 AND participant_2 = p2)
           OR (participant_1 = p2 AND participant_2 = p1)
        LIMIT 1;
        
        -- If no conversation exists, create one
        IF new_conversation_id IS NULL THEN
            INSERT INTO public.conversations (participant_1, participant_2)
            VALUES (p1, p2)
            RETURNING id INTO new_conversation_id;
            
            -- Insert a system welcome message
            -- Using the receiver_id (who accepted) as sender to indicate they initiated the connection
            INSERT INTO public.messages (conversation_id, sender_id, content)
            VALUES (
                new_conversation_id,
                NEW.receiver_id,
                '👋 You are now connected! Say hi!'
            );
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS friendship_accepted_create_conversation ON public.friendships;
CREATE TRIGGER friendship_accepted_create_conversation
    AFTER UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_conversation_on_friendship();

-- =============================================================================
-- VERIFICATION: Test the check_shared_community function
-- =============================================================================

-- Example test (replace with real user IDs):
-- SELECT check_shared_community('user-a-uuid', 'user-b-uuid');

-- Check policies are created:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'friendships';

-- Check triggers are created:
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.friendships'::regclass;
