import { useState, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { ClarifyButton } from './ClarifyButton'
import { TermItem } from './TermItem'
import type { Term } from '../types'

interface TermsPanelProps {
  sessionId: string
  notes: string
  terms: Term[]
  onAddTerm: (term: string) => Promise<Term | null>
  onRemoveTerm: (id: string) => void
  onDefinitionUpdate: (id: string, definition: string) => void
  onUpdateDefinitions: (updates: { id: string; definition: string }[]) => Promise<boolean>
  isGuest?: boolean
  hasClarified?: boolean
  onMarkClarified?: () => void
  onClarifyLimitReached?: () => void
}

export function TermsPanel({
  sessionId,
  notes,
  terms,
  onAddTerm,
  onRemoveTerm,
  onDefinitionUpdate,
  onUpdateDefinitions,
  isGuest = false,
  hasClarified = false,
  onMarkClarified,
  onClarifyLimitReached,
}: TermsPanelProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [clarifying, setClarifying] = useState(false)
  const [clarifyError, setClarifyError] = useState<string | null>(null)

  const handleAdd = async () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    await onAddTerm(trimmed)
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleClarifyAll = async () => {
    // Guest limit check
    if (isGuest && hasClarified) {
      onClarifyLimitReached?.()
      return
    }

    const undefinedTerms = terms.filter(t => !t.definition)
    if (!undefinedTerms.length) return

    setClarifying(true)
    setClarifyError(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch(`${supabaseUrl}/functions/v1/clarify-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          terms: undefinedTerms.map(t => t.term),
          notes,
          sessionId,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to clarify terms')
      }

      const data = await response.json() as Record<string, string>
      const updates = undefinedTerms
        .filter(t => data[t.term])
        .map(t => ({ id: t.id, definition: data[t.term] }))

      if (updates.length) {
        await onUpdateDefinitions(updates)
        // Mark guest's free clarify as used
        if (isGuest) onMarkClarified?.()
      }
    } catch (err) {
      setClarifyError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setClarifying(false)
    }
  }

  const hasUndefined = terms.some(t => !t.definition)
  // Guest who has already clarified: show the button disabled with a hint
  const clarifyBlocked = isGuest && hasClarified

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-brown-600 text-xs uppercase tracking-widest">{t('terms.title')}</h2>
        <ClarifyButton
          onClick={handleClarifyAll}
          loading={clarifying}
          disabled={(!hasUndefined && !clarifyBlocked) || terms.length === 0}
          blocked={clarifyBlocked}
          onBlockedClick={onClarifyLimitReached}
        />
      </div>

      <div className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('terms.placeholder')}
          className="flex-1 bg-transparent border-none outline-none text-brown-800
                     placeholder-brown-200 text-sm py-1
                     border-b border-cream-300 focus:border-brown-300
                     transition-colors duration-200"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="text-brown-300 hover:text-accent transition-colors duration-200
                     text-xl leading-none disabled:opacity-30"
          title={t('terms.addTitle')}
        >
          +
        </button>
      </div>

      {clarifyError && (
        <p className="text-red-700 text-xs opacity-70 mb-4">{clarifyError}</p>
      )}

      {terms.length === 0 && (
        <p className="text-brown-200 text-sm italic">{t('terms.empty')}</p>
      )}

      <ul className="flex-1 overflow-y-auto divide-y divide-cream-200">
        {terms.map(term => (
          <TermItem
            key={term.id}
            term={term}
            notes={notes}
            sessionId={sessionId}
            onRemove={onRemoveTerm}
            onDefinitionUpdate={onDefinitionUpdate}
            isGuest={isGuest}
            hasClarified={hasClarified}
            onClarifyLimitReached={onClarifyLimitReached}
            onMarkClarified={onMarkClarified}
          />
        ))}
      </ul>
    </div>
  )
}
