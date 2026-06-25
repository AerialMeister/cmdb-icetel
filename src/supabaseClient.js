import { createClient } from '@supabase/supabase-js'

// ── Cliente propio de la CMDB (base de datos de activos) ─────────────────────
const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    '[CMDB Icetel] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
    'Crea un archivo .env (ver .env.example) con los datos de tu proyecto Supabase.'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
  auth: { persistSession: false },   // La sesión la maneja sbDcsm
})

export const supabaseConfigured = Boolean(url && anonKey)

// ── Cliente compartido DCSM (autenticación unificada) ────────────────────────
const dcsmUrl     = import.meta.env.VITE_DCSM_SUPABASE_URL
const dcsmAnonKey = import.meta.env.VITE_DCSM_SUPABASE_ANON_KEY

if (!dcsmUrl || !dcsmAnonKey) {
  console.error(
    '[CMDB Icetel] Faltan VITE_DCSM_SUPABASE_URL o VITE_DCSM_SUPABASE_ANON_KEY. ' +
    'Estas variables son necesarias para la autenticación compartida.'
  )
}

export const sbDcsm = createClient(
  dcsmUrl     || 'http://localhost',
  dcsmAnonKey || 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'dcsm-auth',   // Clave de localStorage compartida con ITSM y horas-extra
    },
  }
)
