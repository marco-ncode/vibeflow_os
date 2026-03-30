import { createClient } from '@supabase/supabase-js'

const envUrlRaw = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envUrl = envUrlRaw && envUrlRaw.trim().length > 0 ? envUrlRaw : undefined
const supabaseUrl = envUrl ?? `${window.location.origin}/supabase`
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
