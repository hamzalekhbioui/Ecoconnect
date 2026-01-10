-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text UNIQUE,
    avatar_url text,
    role text NOT NULL DEFAULT 'visitor' CHECK (role IN ('admin', 'member', 'visitor')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    credits numeric NOT NULL DEFAULT 0,
    bio text,
    industry text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Drop existing policies first to ensure idempotency
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read approved profiles" ON public.profiles;

-- Users can read and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- All authenticated users can read approved profiles
CREATE POLICY "Anyone can read approved profiles" ON public.profiles
FOR SELECT USING (status = 'approved');

-- 5. Auto-create profile on signup (TRIGGER)
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

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Add country and application_note columns
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS country text,
    ADD COLUMN IF NOT EXISTS application_note text;

-- Update status constraint to include 'pending_review'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('pending', 'approved', 'pending_review'));


-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');
-- Allow anyone to view avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');