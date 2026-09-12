import { createClient } from '@supabase/supabase-js'

// Supabase's browser key is intentionally public. Environment variables are preferred,
// but these fallbacks keep the production build working if Vercel env vars are missing.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://crfspikqmnqgdehqmajn.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_2OrbAxE_aRYRAnqzGlQx2Q_rfZArTpD'

export function supabaseBrowser() {
  return createClient(url, key)
}
