INSERT INTO storage.buckets (id, name, public) 
VALUES ('club-covers', 'club-covers', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Club covers are public" 
ON storage.objects FOR SELECT
USING (bucket_id = 'club-covers');

CREATE POLICY "Authenticated users can upload club covers" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'club-covers');

CREATE POLICY "Users can update their own club covers" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'club-covers' AND owner = auth.uid());

CREATE POLICY "Users can delete their own club covers" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'club-covers' AND owner = auth.uid());
