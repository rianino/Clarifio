export interface Program {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  program_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface NoteSession {
  id: string
  course_id: string
  name: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Term {
  id: string
  session_id: string
  term: string
  definition: string | null
  created_at: string
}

export type View =
  | { type: 'dashboard' }
  | { type: 'course'; programId: string; courseId: string }
  | { type: 'session'; programId: string; courseId: string; sessionId: string }
