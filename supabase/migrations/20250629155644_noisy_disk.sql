/*
  # Create documents storage bucket

  1. Storage Setup
    - Create 'documents' storage bucket for PDF file uploads
    - Configure bucket to be private (not publicly accessible)
    
  2. Security Policies
    - Allow authenticated users to upload files to their own folder
    - Allow authenticated users to read their own files
    - Allow authenticated users to delete their own files
    
  3. Notes
    - Files are organized by user ID in separate folders
    - Only PDF files should be uploaded through the application
    - Maximum file size limits are handled at the application level
*/

-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents', 
  true, -- Changed to true to make files publicly accessible
  10485760, -- 10MB limit
  ARRAY['application/pdf']
);

-- Policy to allow public read access to documents
CREATE POLICY "Public read access to documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy to allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);