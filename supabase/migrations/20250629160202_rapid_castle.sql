/*
  # Storage bucket policies for documents

  1. Storage Setup
    - Create policies for the 'documents' storage bucket
    - Allow authenticated users to upload their own files
    - Allow authenticated users to read their own files
    - Allow public access to files (for PDF viewing)

  2. Security
    - Users can only access files in folders named with their user ID
    - Public read access for document viewing
    - Authenticated write access for uploads
*/

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow authenticated users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow public read access to documents (needed for PDF viewing)
CREATE POLICY "Public read access for documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);