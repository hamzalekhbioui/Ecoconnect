-- Create marketplace_listings table
CREATE TABLE public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2),
    category TEXT NOT NULL CHECK (category IN ('SKILL', 'DOCUMENT', 'SERVICE', 'CONTACT', 'PROJECT', 'TOOL')),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
-- Public read access
CREATE POLICY "Allow public read access" 
ON public.marketplace_listings FOR SELECT USING (true);
-- Member/admin insert
CREATE POLICY "Allow member and admin insert" 
ON public.marketplace_listings FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('member', 'admin')
    )
);
-- Owner update
CREATE POLICY "Allow owner update" 
ON public.marketplace_listings FOR UPDATE 
USING (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('member', 'admin')
    )
);
-- Owner delete
CREATE POLICY "Allow owner delete" 
ON public.marketplace_listings FOR DELETE 
USING (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('member', 'admin')
    )
);

--Allow admins to delete any marketplace marketplace_listings
create POLICY "Admins can delete any marketplace listing"
ON marketplace_listings
FOR delete
TO authenticated
USING (
    EXISTS(
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Fix the SELECT policy to allow everyone to read listings
DROP POLICY IF EXISTS "Allow public read access" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can view own listings" ON public.marketplace_listings;
CREATE POLICY "Enable read access for all users" 
ON public.marketplace_listings 
FOR SELECT 
TO public
USING (true);





-- Allow authenticated users to upload to marketplace-images bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-images');