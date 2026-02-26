import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SaveIndicator } from './SaveIndicator'

type SaveStatus = 'idle' | 'saving' | 'saved'

interface NotesPanelProps {
  notes: string
  onChange: (notes: string) => void
  saveStatus: SaveStatus
}

export function NotesPanel({ notes, onChange, saveStatus }: NotesPanelProps) {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(ta.scrollHeight, 400)}px`
  }, [notes])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-brown-600 text-xs uppercase tracking-widest">{t('notes.title')}</h2>
        <SaveIndicator status={saveStatus} />
      </div>

      <textarea
        ref={textareaRef}
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder={t('notes.placeholder')}
        className="flex-1 w-full bg-transparent border-none outline-none resize-none
                   text-brown-900 placeholder-brown-200 text-base leading-relaxed
                   min-h-[400px]"
        spellCheck
      />
    </div>
  )
}
