import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Course } from '../types'

export function useCourses(programId: string | undefined) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    if (!programId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('program_id', programId)
      .order('created_at', { ascending: true })
    setCourses(data ?? [])
    setLoading(false)
  }, [programId])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = async (name: string) => {
    if (!programId) return null
    const { data, error } = await supabase
      .from('courses')
      .insert({ name, program_id: programId })
      .select()
      .single()
    if (!error && data) setCourses(prev => [...prev, data])
    return error ? null : data
  }

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (!error) setCourses(prev => prev.filter(c => c.id !== id))
    return !error
  }

  return { courses, loading, createCourse, deleteCourse, refetch: fetchCourses }
}
