import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Term } from '../types'

export function useTerms(sessionId: string | undefined) {
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTerms = useCallback(async () => {
    if (!sessionId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('terms')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setTerms(data ?? [])
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    fetchTerms()
  }, [fetchTerms])

  const addTerm = async (termText: string) => {
    if (!sessionId) return null
    const { data, error } = await supabase
      .from('terms')
      .insert({ term: termText, session_id: sessionId, definition: null })
      .select()
      .single()
    if (!error && data) setTerms(prev => [...prev, data])
    return error ? null : data
  }

  const removeTerm = async (id: string) => {
    const { error } = await supabase.from('terms').delete().eq('id', id)
    if (!error) setTerms(prev => prev.filter(t => t.id !== id))
    return !error
  }

  const updateDefinition = async (id: string, definition: string) => {
    const { error } = await supabase
      .from('terms')
      .update({ definition })
      .eq('id', id)
    if (!error) {
      setTerms(prev => prev.map(t => t.id === id ? { ...t, definition } : t))
    }
    return !error
  }

  const updateDefinitions = async (updates: { id: string; definition: string }[]) => {
    const results = await Promise.all(updates.map(u => updateDefinition(u.id, u.definition)))
    return results.every(Boolean)
  }

  return { terms, loading, addTerm, removeTerm, updateDefinition, updateDefinitions }
}
