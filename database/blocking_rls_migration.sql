-- =============================================================================
-- BLOCKING RLS POLICY MIGRATION
-- Updates existing RLS policies to respect blocked_users table
-- Run this AFTER blocked_users_schema.sql
-- =============================================================================

-- =============================================================================
-- STEP 1: Update Messages Policies
-- Blocked users cannot send messages to users who blocked them
-- =============================================================================

-- Drop existing policy first
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create updated policy that checks for blocks
-- Rule: User A cannot send a message if User B (the other participant) has blocked them
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        -- Must be the sender
        auth.uid() = sender_id
        -- Must be participant of the conversation
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
        -- Must NOT be blocked by the other participant
        -- This checks: blocked_users WHERE blocker_id = OTHER_USER AND blocked_id = ME
        AND NOT EXISTS (
            SELECT 1 
            FROM public.blocked_users b
            INNER JOIN public.conversations c ON c.id = conversation_id
            WHERE b.blocked_id = auth.uid()
            AND b.blocker_id = CASE 
                WHEN c.participant_1 = auth.uid() THEN c.participant_2 
                ELSE c.participant_1 
            END
        )
    );

-- =============================================================================
-- STEP 2: Update Friendships Delete Policy
-- Both parties can now delete/unfriend accepted friendships
-- =============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can delete their friend requests" ON public.friendships;

-- Create updated policy allowing both parties to delete
CREATE POLICY "Users can delete their friend requests"
    ON public.friendships FOR DELETE
    USING (
        auth.uid() = requester_id 
        OR auth.uid() = receiver_id
    );

-- =============================================================================
-- STEP 3: Helper function to automatically unfriend when blocking
-- This is called after inserting into blocked_users
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_unfriend_on_block()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete any friendship between blocker and blocked
    DELETE FROM public.friendships
    WHERE (requester_id = NEW.blocker_id AND receiver_id = NEW.blocked_id)
       OR (requester_id = NEW.blocked_id AND receiver_id = NEW.blocker_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS block_unfriend_trigger ON public.blocked_users;
CREATE TRIGGER block_unfriend_trigger
    AFTER INSERT ON public.blocked_users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_unfriend_on_block();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check updated messages policy:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can send messages';

-- Check updated friendships policy:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can delete their friend requests';
