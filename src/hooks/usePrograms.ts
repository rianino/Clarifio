import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Program } from '../types'

export function usePrograms(userId: string | undefined) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPrograms = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: true })
    setPrograms(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const createProgram = async (name: string) => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('programs')
      .insert({ name, user_id: userId })
      .select()
      .single()
    if (!error && data) setPrograms(prev => [...prev, data])
    return error ? null : data
  }

  const deleteProgram = async (id: string) => {
    const { error } = await supabase.from('programs').delete().eq('id', id)
    if (!error) setPrograms(prev => prev.filter(p => p.id !== id))
    return !error
  }

  return { programs, loading, createProgram, deleteProgram, refetch: fetchPrograms }
}
