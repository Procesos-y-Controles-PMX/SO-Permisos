/**
 * Browser anon client. Do not use this for Shared business tables
 * (perfiles, permisos, solicitudes, etc.). Those go through /api/* +
 * SUPABASE_SERVICE_ROLE_KEY so RLS can be enabled later.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}