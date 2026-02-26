import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

const CLARIFY_KEY = 'clarifio-guest-clarified'

export function useGuestLimits(user: User | null) {
  const isGuest = user?.is_anonymous === true

  const [hasClarified, setHasClarified] = useState(
    () => localStorage.getItem(CLARIFY_KEY) === 'true'
  )

  const markClarified = () => {
    localStorage.setItem(CLARIFY_KEY, 'true')
    setHasClarified(true)
  }

  // Called after successful upgrade so the limit resets
  const clearClarifiedFlag = () => {
    localStorage.removeItem(CLARIFY_KEY)
    setHasClarified(false)
  }

  return { isGuest, hasClarified, markClarified, clearClarifiedFlag }
}
