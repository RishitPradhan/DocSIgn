/*
  # Storage Policies for Documents Bucket

  1. Security
    - Enable RLS on storage.objects (if not already enabled)
    - Add policies for authenticated users to manage their own files
    - Add public read access for PDF viewing
    
  2. Policies
    - Users can upload files to their own folder
    - Users can view their own files
    - Public read access for documents (needed for PDF viewing)
    - Users can delete their own files
    - Users can update their own files
*/

-- Create storage policies for the documents bucket
-- Note: RLS is already enabled on storage.objects by default in Supabase

-- Policy to allow authenticated users to upload files to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload files to their own folder'
  ) THEN
    CREATE POLICY "Users can upload files to their own folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy to allow authenticated users to view their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own files'
  ) THEN
    CREATE POLICY "Users can view their own files"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'documents' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy to allow public read access to documents (needed for PDF viewing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for documents'
  ) THEN
    CREATE POLICY "Public read access for documents"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'documents');
  END IF;
END $$;

-- Policy to allow authenticated users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own files'
  ) THEN
    CREATE POLICY "Users can delete their own files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'documents' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Policy to allow authenticated users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own files'
  ) THEN
    CREATE POLICY "Users can update their own files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'documents' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;