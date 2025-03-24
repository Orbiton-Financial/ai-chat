// src/lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

/**
 * This is the Supabase client for use in React components (client-side).
 * For server-side usage, you may need a different client from `createServerComponentClient`
 * or the standard `createClient` from '@supabase/supabase-js'.
 */
export const supabaseClient = createClientComponentClient<Database>()
