import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Document = {
  id: string
  user_id: string
  name: string
  original_url: string
  signed_url?: string
  status: 'unsigned' | 'signed'
  created_at: string
  updated_at: string
}