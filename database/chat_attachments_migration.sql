-- =============================================================================
-- Chat Attachments Migration
-- Adds file sharing support to the messaging system
-- Idempotent SQL for Supabase (PostgreSQL)
-- =============================================================================

-- =============================================================================
-- 1. ADD ATTACHMENT COLUMNS TO MESSAGES TABLE
-- =============================================================================

-- Add attachment_url column (nullable, stores the public URL of the attachment)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_url TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add attachment_type column (nullable, 'image' or 'document')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'attachment_type'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN attachment_type TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add check constraint for attachment_type values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'messages' 
        AND constraint_name = 'messages_attachment_type_check'
    ) THEN
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_attachment_type_check 
        CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'document'));
    END IF;
END $$;

-- =============================================================================
-- 2. CREATE STORAGE BUCKET (CRITICAL - RUN THIS FIRST)
-- =============================================================================

-- Create the bucket if it doesn't exist
-- IMPORTANT: The bucket must be created before any policies can be applied
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments', 
    'chat-attachments', 
    false,  -- private bucket (RLS controls access)
    10485760,  -- 10MB file size limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- 3. STORAGE RLS POLICIES
-- =============================================================================

-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "chat_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_select" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete" ON storage.objects;

-- Policy 1: Authenticated users can upload files to chat-attachments bucket
-- Path structure: {conversation_id}/{timestamp}_{filename}
-- No need to create folders first - Supabase creates them automatically
CREATE POLICY "chat_attachments_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-attachments'
);

-- Policy 2: Users can read files from conversations they participate in
-- The folder name is the conversation_id, used for access control
CREATE POLICY "chat_attachments_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-attachments'
    AND (
        -- Allow access if user is a participant in the conversation
        -- The first folder in the path is the conversation_id
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id::text = (string_to_array(name, '/'))[1]
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    )
);

-- Policy 3: Users can delete files they uploaded
CREATE POLICY "chat_attachments_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-attachments'
    AND owner = auth.uid()
);

-- =============================================================================
-- VERIFICATION QUERIES (optional, run manually to verify)
-- =============================================================================

-- Check if columns were added:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'messages' AND column_name LIKE 'attachment%';

-- Check storage bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'chat-attachments';

-- Check storage policies:
-- SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%attachment%';
