
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;


-- Storage RLS: Users can upload documents to their own folder
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS: Users can read their own ID documents
CREATE POLICY "Users can read their own ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage RLS: Users can update their own ID documents
CREATE POLICY "Users can update their own ID documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- In case edge function uses a standard client or an admin needs access
CREATE POLICY "Admins can read all ID documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'id-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
