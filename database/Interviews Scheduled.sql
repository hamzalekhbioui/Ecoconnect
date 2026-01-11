-- ============================================================================
-- USER MANAGEMENT MODULE - COMPLETE SUPABASE SETUP
-- ============================================================================
-- This script is idempotent and can be run multiple times safely.
-- Run this in Supabase SQL Editor.
-- ============================================================================
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
-- Matches User interface in UserManagementView.tsx:
-- id, full_name, email, avatar_url, role, status, credits, created_at,
-- country (optional), application_note (optional)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text UNIQUE,
    avatar_url text,
    role text NOT NULL DEFAULT 'visitor' CHECK (role IN ('admin', 'member', 'visitor')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'pending_review', 'rejected')),
    credits numeric NOT NULL DEFAULT 0,
    bio text,
    industry text,
    phone text,
    country text,
    application_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
-- ============================================================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'visitor',
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop and recreate trigger to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================================
-- 3. VETTING SESSIONS TABLE
-- ============================================================================
-- For interview scheduling functionality
CREATE TABLE IF NOT EXISTS public.vetting_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
-- Index for faster queries on scheduled sessions
CREATE INDEX IF NOT EXISTS idx_vetting_sessions_scheduled 
    ON public.vetting_sessions(status, scheduled_at) 
    WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_vetting_sessions_user_id 
    ON public.vetting_sessions(user_id);
-- ============================================================================
-- 4. ROW LEVEL SECURITY - PROFILES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read approved profiles" ON public.profiles;
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
-- Admins can SELECT, UPDATE, DELETE any profile
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
-- Anyone can read approved profiles (for member directory, etc.)
CREATE POLICY "Anyone can read approved profiles" ON public.profiles
    FOR SELECT USING (status = 'approved');
-- ============================================================================
-- 5. ROW LEVEL SECURITY - VETTING SESSIONS
-- ============================================================================
ALTER TABLE public.vetting_sessions ENABLE ROW LEVEL SECURITY;
-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Admins can manage vetting sessions" ON public.vetting_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.vetting_sessions;
-- Admins can manage all vetting sessions
CREATE POLICY "Admins can manage vetting sessions" ON public.vetting_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.vetting_sessions
    FOR SELECT USING (user_id = auth.uid());




-- Step 1: Create a security definer function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
-- Step 2: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
-- Step 3: Create simple, working policies
-- ALL authenticated users can read their own profile (CRITICAL!)
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());
-- ALL authenticated users can update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
-- Admins can read all profiles (uses security definer function)
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());
-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin());
-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());