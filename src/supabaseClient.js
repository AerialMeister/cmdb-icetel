import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    '[CMDB Icetel] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Crea un archivo .env (ver .env.example) con los datos de tu proyecto Supabase.'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const supabaseConfigured = Boolean(url && anonKey)
