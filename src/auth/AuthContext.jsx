import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase
      .from('cmdb_profiles')
      .select('id, email, full_name, role, active')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess)
      await loadProfile(sess?.user?.id)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }
  const signOut = () => supabase.auth.signOut()

  const role = profile?.role || null
  const value = {
    session, profile, loading, role,
    isAdmin: role === 'admin',
    canEdit: role === 'admin' || role === 'editor',
    signIn, signOut,
    refreshProfile: () => loadProfile(session?.user?.id),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
