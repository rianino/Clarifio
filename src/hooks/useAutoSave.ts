import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type SaveStatus = 'idle' | 'saving' | 'saved'

export function useAutoSave(sessionId: string | undefined, notes: string, delay = 1000) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevNotesRef = useRef(notes)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!sessionId || notes === prevNotesRef.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('saving')

    timerRef.current = setTimeout(async () => {
      prevNotesRef.current = notes
      await supabase
        .from('note_sessions')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (mountedRef.current) {
        setStatus('saved')
        setTimeout(() => {
          if (mountedRef.current) setStatus('idle')
        }, 2000)
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sessionId, notes, delay])

  return status
}
