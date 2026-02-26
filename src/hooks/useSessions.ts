import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { NoteSession } from '../types'

export function useSessions(courseId: string | undefined) {
  const [sessions, setSessions] = useState<NoteSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!courseId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('note_sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
    setSessions(data ?? [])
    setLoading(false)
  }, [courseId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = async (name: string) => {
    if (!courseId) return null
    const { data, error } = await supabase
      .from('note_sessions')
      .insert({ name, course_id: courseId, notes: '' })
      .select()
      .single()
    if (!error && data) setSessions(prev => [...prev, data])
    return error ? null : data
  }

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('note_sessions').delete().eq('id', id)
    if (!error) setSessions(prev => prev.filter(s => s.id !== id))
    return !error
  }

  const updateSession = (updated: NoteSession) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  return { sessions, loading, createSession, deleteSession, updateSession, refetch: fetchSessions }
}
