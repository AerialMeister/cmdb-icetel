import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { sbDcsm, supabase } from '../supabaseClient.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [role, setRole]         = useState(null)   // 'admin' | 'viewer' | null
  const [loading, setLoading]   = useState(true)

  // Carga el rol del usuario desde la tabla cmdb_roles del proyecto CMDB propio
  const loadRole = useCallback(async (userId) => {
    if (!userId) { setRole(null); return }
    const { data } = await supabase
      .from('cmdb_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
    setRole(data?.role ?? null)
  }, [])

  useEffect(() => {
    let active = true

    sbDcsm.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadRole(data.session?.user?.id)
      setLoading(false)
    })

    const { data: sub } = sbDcsm.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      await loadRole(sess?.user?.id)
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadRole])

  const signIn = async (email, password) => {
    const { error } = await sbDcsm.auth.signInWithPassword({ email, password })
    return error
  }
  const signOut = () => sbDcsm.auth.signOut()

  const user        = session?.user ?? null
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name      ||
    user?.email || ''

  const value = {
    session,
    user,
    loading,
    displayName,
    role,
    isAdmin:  role === 'admin',
    canEdit:  role === 'admin',      // solo admins pueden editar
    signIn,
    signOut,
    refreshRole: () => loadRole(user?.id),
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
