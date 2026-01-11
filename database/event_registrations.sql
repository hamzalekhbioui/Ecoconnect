
-- ----------------------------------------------------------------------------
-- 1. CREATE EVENTS TABLE (if not exists)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    date timestamp with time zone NOT NULL,
    location_type text NOT NULL DEFAULT 'online' CHECK (location_type IN ('online', 'offline')),
    community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    start_time time DEFAULT '09:00',
    end_time time DEFAULT '17:00',
    category text DEFAULT 'workshop' CHECK (category IN ('workshop', 'webinar', 'meetup', 'cleanup', 'fundraiser', 'conference', 'other')),
    status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_community_id ON public.events(community_id);


-- ----------------------------------------------------------------------------
-- 2. CREATE EVENT REGISTRATIONS TABLE (if not exists)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);


-- ----------------------------------------------------------------------------
-- 3. ENABLE RLS & CREATE POLICIES (with DROP IF EXISTS to avoid conflicts)
-- ----------------------------------------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can manage events" ON public.events;
DROP POLICY IF EXISTS "Registrations are viewable by everyone" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
DROP POLICY IF EXISTS "Users can cancel their registrations" ON public.event_registrations;

-- Create policies
CREATE POLICY "Events are viewable by everyone" 
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage events" 
    ON public.events FOR ALL TO authenticated USING (true);

CREATE POLICY "Registrations are viewable by everyone" 
    ON public.event_registrations FOR SELECT USING (true);

CREATE POLICY "Users can register for events" 
    ON public.event_registrations FOR INSERT 
    TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their registrations" 
    ON public.event_registrations FOR DELETE 
    TO authenticated USING (auth.uid() = user_id);

