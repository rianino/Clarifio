import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSubscription(userId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  const check = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      setIsSubscribed(!!data)
    } catch {
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { check() }, [check])

  return { isSubscribed, loading, refresh: check }
}
