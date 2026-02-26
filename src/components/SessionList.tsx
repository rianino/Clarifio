import { useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { NoteSession, View } from '../types'

interface SessionListProps {
  programId: string
  courseId: string
  sessions: NoteSession[]
  loading: boolean
  onNavigate: (view: View) => void
  onCreateSession: (name: string) => Promise<NoteSession | null>
}

export function SessionList({ programId, courseId, sessions, loading, onNavigate, onCreateSession }: SessionListProps) {
  const { t, i18n } = useTranslation()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const locale = i18n.language.startsWith('pt') ? 'pt-PT' : 'en-GB'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setSaving(true)
    const session = await onCreateSession(trimmed)
    setNewName('')
    setCreating(false)
    setSaving(false)
    if (session) {
      onNavigate({ type: 'session', programId, courseId, sessionId: session.id })
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setCreating(false); setNewName('') }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-5 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1">
            <div className="h-5 bg-cream-200 rounded w-2/3" />
            <div className="h-3 bg-cream-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-1">
        {sessions.map(session => (
          <li key={session.id}>
            <button
              onClick={() => onNavigate({ type: 'session', programId, courseId, sessionId: session.id })}
              className="text-left py-3 w-full group transition-opacity duration-200 hover:opacity-80"
            >
              <div className="text-brown-800 text-base group-hover:text-accent transition-colors duration-200">
                {session.name}
              </div>
              <div className="text-brown-300 text-xs mt-0.5">
                {formatDate(session.updated_at)}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {sessions.length === 0 && !creating && (
        <p className="text-brown-300 text-sm mt-4 italic">{t('sessions.empty')}</p>
      )}

      <div className="mt-6">
        {creating ? (
          <div className="flex items-center gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('sessions.namePlaceholder')}
              className="inline-input flex-1"
              disabled={saving}
            />
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="text-accent hover:text-accent-hover transition-colors duration-200 text-sm disabled:opacity-40"
            >
              {t('sessions.create')}
            </button>
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="text-brown-300 hover:text-brown-600 transition-colors duration-200 text-sm"
            >
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="text-brown-300 hover:text-accent transition-colors duration-200 text-sm flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>{t('sessions.new')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
