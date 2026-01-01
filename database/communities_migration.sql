-- =============================================================================
-- Communities Migration Script
-- Run this FIRST if you have an existing communities table
-- =============================================================================

-- Add missing columns to existing communities table
DO $$ 
BEGIN
    -- Add slug column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN slug VARCHAR(255);
        -- Generate slugs from names for existing rows
        UPDATE public.communities SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));
        -- Make it NOT NULL and UNIQUE after populating
        ALTER TABLE public.communities ALTER COLUMN slug SET NOT NULL;
        ALTER TABLE public.communities ADD CONSTRAINT communities_slug_key UNIQUE (slug);
    END IF;

    -- Add mission column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'mission'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN mission TEXT;
    END IF;

    -- Add cover_image column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN cover_image TEXT;
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;

    -- Add is_private column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN is_private BOOLEAN DEFAULT false;
    END IF;

    -- Add member_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'member_count'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'communities' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.communities ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Now run the rest of the schema script...
