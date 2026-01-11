-- =============================================================================
-- REPORTS SCHEMA
-- User reporting system for moderation
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STEP 1: Create the reports table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'harassment_abusive',
        'spam_solicitation',
        'scam_fraud',
        'inappropriate_content',
        'community_values',
        'other'
    )),
    description TEXT,
    context_json JSONB,  -- Last 5 messages for context
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent self-reporting
    CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Add FK to profiles for PostgREST joins
ALTER TABLE public.reports
    ADD CONSTRAINT reports_reporter_id_profiles_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reports
    ADD CONSTRAINT reports_reported_id_profiles_fkey
    FOREIGN KEY (reported_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 2: Enable RLS and create policies
-- =============================================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports (insert)
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own submitted reports
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- Policy: Admins can view all reports (for moderation)
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Admins can update report status
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =============================================================================
-- STEP 3: Trigger to update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check policies are created:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reports';
