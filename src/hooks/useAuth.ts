import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Try existing session first; if none, create anonymous guest session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        setSession(session)
        setUser(session.user)
        setLoading(false)
      } else {
        const { data } = await supabase.auth.signInAnonymously()
        if (!mounted) return
        setSession(data.session)
        setUser(data.user ?? null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        // Restore guest access immediately with a fresh anonymous session
        await supabase.auth.signInAnonymously()
        // The resulting SIGNED_IN event will set the user
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  // Links an anonymous account to a permanent email+password identity
  const linkEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.updateUser({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // onAuthStateChange SIGNED_OUT will auto-create a new anonymous session
  }

  return { user, session, loading, signIn, signUp, linkEmail, signOut }
}
