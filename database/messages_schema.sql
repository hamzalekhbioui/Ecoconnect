-- =============================================================================
-- Messages Schema for Internal Messaging
-- Idempotent SQL for Supabase (PostgreSQL)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Conversations Table (1-to-1 messaging)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =============================================================================
-- FOREIGN KEY RELATIONSHIPS FOR POSTGREST JOINS
-- =============================================================================

-- Add FK from conversations to profiles for participant joins
-- Drop if exists first (idempotent)
DO $$ 
BEGIN
    ALTER TABLE public.conversations 
        DROP CONSTRAINT IF EXISTS conversations_participant_1_fkey;
    ALTER TABLE public.conversations 
        DROP CONSTRAINT IF EXISTS conversations_participant_2_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_participant_1_fkey
    FOREIGN KEY (participant_1) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_participant_2_fkey
    FOREIGN KEY (participant_2) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add FK from messages to profiles for sender joins
DO $$ 
BEGIN
    ALTER TABLE public.messages 
        DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Conversations Policies
-- -----------------------------------------------------------------------------

-- Users can view their own conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Users can create conversations they're part of
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- -----------------------------------------------------------------------------
-- Messages Policies
-- -----------------------------------------------------------------------------

-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
CREATE POLICY "Users can view messages in own conversations"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Users can send messages to their conversations
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Users can mark messages as read in their conversations
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read"
    ON public.messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- =============================================================================
-- TRIGGER: Update last_message_at on new message
-- =============================================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_last_message_trigger ON public.messages;
CREATE TRIGGER update_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
