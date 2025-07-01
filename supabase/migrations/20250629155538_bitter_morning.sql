/*
  # Create documents table for PDF signature application

  1. New Tables
    - `documents`
      - `id` (uuid, primary key) - Unique identifier for each document
      - `user_id` (uuid, foreign key) - References the authenticated user
      - `name` (text) - Original filename of the uploaded document
      - `original_url` (text) - URL to the original uploaded PDF
      - `signed_url` (text, optional) - URL to the signed version of the PDF
      - `status` (text) - Document status: 'unsigned' or 'signed'
      - `created_at` (timestamptz) - When the document was uploaded
      - `updated_at` (timestamptz) - When the document was last modified

  2. Security
    - Enable RLS on `documents` table
    - Add policies for authenticated users to manage their own documents
    - Users can only view, insert, update, and delete their own documents

  3. Additional Features
    - Automatic updated_at timestamp trigger
    - Foreign key constraint to auth.users with CASCADE delete
    - Check constraint to ensure status is either 'unsigned' or 'signed'
*/

-- Create the documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  original_url text NOT NULL,
  signed_url text,
  status text NOT NULL DEFAULT 'unsigned' CHECK (status IN ('unsigned', 'signed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
CREATE POLICY "Users can view their own documents" 
  ON public.documents
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
  ON public.documents
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
  ON public.documents
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
  ON public.documents
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents(created_at DESC);