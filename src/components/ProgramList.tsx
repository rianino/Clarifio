import { useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Program, View } from '../types'

interface ProgramListProps {
  programs: Program[]
  loading: boolean
  onNavigate: (view: View) => void
  onCreateProgram: (name: string) => Promise<Program | null>
}

export function ProgramList({ programs, loading, onNavigate, onCreateProgram }: ProgramListProps) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setSaving(true)
    await onCreateProgram(trimmed)
    setNewName('')
    setCreating(false)
    setSaving(false)
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setCreating(false); setNewName('') }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-5 bg-cream-200 rounded w-1/3" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <ul className="space-y-1">
        {programs.map(program => (
          <li key={program.id}>
            <button
              onClick={() => onNavigate({ type: 'course', programId: program.id, courseId: '' })}
              className="text-left text-brown-800 hover:text-accent transition-colors duration-200
                         py-2 text-base w-full group flex items-center gap-2"
            >
              <span className="text-brown-200 group-hover:text-accent-light transition-colors duration-200 text-sm select-none">▸</span>
              {program.name}
            </button>
          </li>
        ))}
      </ul>

      {programs.length === 0 && !creating && (
        <p className="text-brown-300 text-sm mt-4 italic">{t('programs.empty')}</p>
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
              placeholder={t('programs.namePlaceholder')}
              className="inline-input flex-1"
              disabled={saving}
            />
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
              className="text-accent hover:text-accent-hover transition-colors duration-200 text-sm disabled:opacity-40"
            >
              {t('common.add')}
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
            <span>{t('programs.new')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
