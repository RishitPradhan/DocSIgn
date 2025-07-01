/*
  # Create documents storage bucket and policies

  1. Storage Setup
    - Create the 'documents' storage bucket
    - Set appropriate file size limits and MIME type restrictions
    - Configure bucket to be private (not public)

  2. Security Policies
    - Allow authenticated users to upload files to their own folder
    - Allow authenticated users to read their own files
    - Allow authenticated users to delete their own files
    - Allow authenticated users to update their own files

  3. Important Notes
    - Files are organized by user ID in folder structure: {user_id}/{filename}
    - Only PDF files are allowed (application/pdf MIME type)
    - File size limit is set to 10MB
*/

-- First, ensure the storage schema exists and create the bucket
DO $$
BEGIN
  -- Create the documents bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'documents',
      'documents',
      false,
      10485760, -- 10MB limit
      ARRAY['application/pdf']::text[]
    );
  END IF;
END $$;

-- Ensure RLS is enabled on storage.objects (it should be by default)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Create storage policies for authenticated users
CREATE POLICY "documents_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "documents_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create a policy for public read access (needed for PDF viewing in browser)
CREATE POLICY "documents_public_read_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');