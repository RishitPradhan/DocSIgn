/*
  # Create documents storage bucket

  1. Storage Setup
    - Create 'documents' bucket for PDF file storage
    - Configure bucket with 10MB file size limit
    - Restrict to PDF files only
  2. Security Policies
    - Enable RLS on storage objects
    - Users can only access their own documents
    - Public read access for PDF viewing
  3. Organization
    - Files organized by user ID in folders
*/

-- Create the documents storage bucket using Supabase storage functions
DO $$
BEGIN
  -- Check if bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'documents',
      'documents',
      true,
      10485760, -- 10MB limit
      ARRAY['application/pdf']
    );
  END IF;
END $$;

-- Create storage policies using Supabase's policy system
-- Note: RLS is already enabled on storage.objects by default in Supabase

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload documents to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to documents" ON storage.objects;

-- Policy: Users can upload documents to their own folder
CREATE POLICY "Users can upload documents to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public access to documents for viewing (needed for PDF display)
CREATE POLICY "Allow public access to documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');