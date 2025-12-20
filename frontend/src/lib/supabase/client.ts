/**
 * Supabase Client for Browser
 *
 * Use this client in Client Components (components with 'use client' directive)
 * This creates a singleton Supabase client for the browser
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
