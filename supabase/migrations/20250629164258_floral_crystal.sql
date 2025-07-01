/*
  # Create documents storage bucket

  1. Storage Setup
    - Create 'documents' storage bucket
    - Configure bucket for file uploads
    - Set appropriate access policies for authenticated users

  2. Security
    - Enable RLS on storage objects
    - Add policies for authenticated users to upload/read their own documents
    - Restrict access to user's own files only

  3. Configuration
    - Allow PDF file uploads
    - Set reasonable file size limits
    - Enable public access for document viewing
*/

-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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