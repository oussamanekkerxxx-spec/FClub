INSERT INTO storage.buckets (id, name, public) 
VALUES ('club-covers', 'club-covers', true) 
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Club covers are public') THEN CREATE POLICY "Club covers are public" ON storage.objects FOR SELECT USING (bucket_id = 'club-covers'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated users can upload club covers') THEN CREATE POLICY "Authenticated users can upload club covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'club-covers'); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own club covers') THEN CREATE POLICY "Users can update their own club covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'club-covers' AND owner = auth.uid()); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own club covers') THEN CREATE POLICY "Users can delete their own club covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'club-covers' AND owner = auth.uid()); END IF; END $$;
