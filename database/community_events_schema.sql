-- =============================================================================
-- Community Events Schema
-- Idempotent SQL for Supabase (PostgreSQL)
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.community_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('remote', 'in_person')),
    meeting_link TEXT,      -- For remote events (Zoom, Meet, Teams, etc.)
    address TEXT,           -- For in-person events
    cover_image TEXT,       -- Optional event banner
    max_attendees INTEGER,  -- Optional capacity limit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_community_events_community ON public.community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_created_by ON public.community_events(created_by);
CREATE INDEX IF NOT EXISTS idx_community_events_start_time ON public.community_events(start_time);
-- Note: Partial index on upcoming events not possible with NOW() as it's not IMMUTABLE
-- Query-time filtering on start_time will use the regular index above

-- =============================================================================
-- TRIGGER FOR updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_community_events_updated_at ON public.community_events;
CREATE TRIGGER update_community_events_updated_at
    BEFORE UPDATE ON public.community_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- SELECT: All approved community members can view events
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community members can view events" ON public.community_events;
CREATE POLICY "Community members can view events"
    ON public.community_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm
            WHERE cm.community_id = community_events.community_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'approved'
        )
        OR
        -- Community creator can always view
        EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_events.community_id
            AND c.created_by = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- INSERT: Only community creator can create events
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community creator can create events" ON public.community_events;
CREATE POLICY "Community creator can create events"
    ON public.community_events
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id
            AND c.created_by = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- UPDATE: Only community creator can update events
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community creator can update events" ON public.community_events;
CREATE POLICY "Community creator can update events"
    ON public.community_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id
            AND c.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id
            AND c.created_by = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- DELETE: Only community creator can delete events
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Community creator can delete events" ON public.community_events;
CREATE POLICY "Community creator can delete events"
    ON public.community_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.communities c
            WHERE c.id = community_id
            AND c.created_by = auth.uid()
        )
    );

-- =============================================================================
-- NOTIFICATION TRIGGER: Auto-notify community members on new event
-- =============================================================================

CREATE OR REPLACE FUNCTION public.notify_community_members_on_event()
RETURNS TRIGGER AS $$
DECLARE
    member_record RECORD;
    community_name TEXT;
BEGIN
    -- Get community name for the notification message
    SELECT name INTO community_name
    FROM public.communities
    WHERE id = NEW.community_id;
    
    -- Fan-out: Insert notification for each approved community member
    FOR member_record IN
        SELECT user_id FROM public.community_members
        WHERE community_id = NEW.community_id
        AND status = 'approved'
        AND user_id != NEW.created_by  -- Don't notify the creator
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
            member_record.user_id,
            'community_event',
            'New Event: ' || NEW.title,
            community_name || ' has a new event scheduled',
            jsonb_build_object(
                'event_id', NEW.id,
                'event_title', NEW.title,
                'community_id', NEW.community_id,
                'community_name', community_name,
                'start_time', NEW.start_time,
                'location_type', NEW.location_type
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on INSERT
DROP TRIGGER IF EXISTS community_event_notify_trigger ON public.community_events;
CREATE TRIGGER community_event_notify_trigger
    AFTER INSERT ON public.community_events
    FOR EACH ROW EXECUTE FUNCTION public.notify_community_members_on_event();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check table was created
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_events'
) AS table_exists;

-- Check policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'community_events';

-- Check trigger was created
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.community_events'::regclass;
