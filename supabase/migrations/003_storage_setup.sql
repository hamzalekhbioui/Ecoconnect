-- ============================================================
-- EcoConnect — Storage Buckets & Policies
-- Run after 002_rls_policies.sql
-- ============================================================

-- ────────────────────────────────────────
-- Buckets
-- ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'avatars',
        'avatars',
        true,
        5242880,  -- 5 MB
        ARRAY['image/jpeg','image/png','image/gif','image/webp']
    ),
    (
        'community-covers',
        'community-covers',
        true,
        5242880,
        ARRAY['image/jpeg','image/png','image/gif','image/webp']
    ),
    (
        'post-media',
        'post-media',
        true,
        5242880,
        ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm']
    ),
    (
        'chat-attachments',
        'chat-attachments',
        false,  -- private
        10485760, -- 10 MB
        ARRAY[
            'image/jpeg','image/png','image/gif','image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    )
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────
-- Storage: avatars (public read, own write)
-- ────────────────────────────────────────
CREATE POLICY "avatars_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ────────────────────────────────────────
-- Storage: community-covers (public read, authenticated write)
-- ────────────────────────────────────────
CREATE POLICY "community_covers_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'community-covers');

CREATE POLICY "community_covers_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-covers');

CREATE POLICY "community_covers_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'community-covers');

CREATE POLICY "community_covers_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'community-covers');

-- ────────────────────────────────────────
-- Storage: post-media (public read, authenticated write)
-- ────────────────────────────────────────
CREATE POLICY "post_media_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "post_media_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "post_media_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'post-media');

CREATE POLICY "post_media_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'post-media');

-- ────────────────────────────────────────
-- Storage: chat-attachments (private — sender's folder)
-- ────────────────────────────────────────
CREATE POLICY "chat_attachments_read" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'chat-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "chat_attachments_upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'chat-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "chat_attachments_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'chat-attachments' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
