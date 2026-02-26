import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { Term } from '../types'

interface TermItemProps {
  term: Term
  notes: string
  sessionId: string
  onRemove: (id: string) => void
  onDefinitionUpdate: (id: string, definition: string) => void
  isGuest?: boolean
  hasClarified?: boolean
  onClarifyLimitReached?: () => void
  onMarkClarified?: () => void
}

export function TermItem({
  term, notes, sessionId, onRemove, onDefinitionUpdate,
  isGuest = false, hasClarified = false, onClarifyLimitReached, onMarkClarified,
}: TermItemProps) {
  const { t } = useTranslation()
  const [defining, setDefining] = useState(false)
  const [defineError, setDefineError] = useState(false)
  const [hovered, setHovered] = useState(false)

  const defineSingle = async () => {
    if (isGuest && hasClarified) {
      onClarifyLimitReached?.()
      return
    }
    setDefining(true)
    setDefineError(false)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const response = await fetch(`${supabaseUrl}/functions/v1/clarify-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ terms: [term.term], notes, sessionId }),
      })
      if (response.ok) {
        const data = await response.json() as Record<string, string>
        const def = data[term.term]
        if (def) {
          onDefinitionUpdate(term.id, def)
          if (isGuest) onMarkClarified?.()
        }
      } else {
        setDefineError(true)
      }
    } catch {
      setDefineError(true)
    } finally {
      setDefining(false)
    }
  }

  return (
    <li
      className="py-3 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-brown-800 text-sm font-medium">{term.term}</span>
            <span
              className={`transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'} flex items-center gap-1.5`}
            >
              {!term.definition && (
                <button
                  onClick={defineSingle}
                  disabled={defining}
                  title={isGuest && hasClarified ? t('terms.clarifyBlockedHint') : t('terms.defineTitle')}
                  className="text-xs text-brown-300 hover:text-accent transition-colors duration-200 disabled:opacity-40"
                >
                  {defining ? '…' : '✦'}
                </button>
              )}
              <button
                onClick={() => onRemove(term.id)}
                title={t('terms.removeTitle')}
                className="text-xs text-brown-300 hover:text-brown-600 transition-colors duration-200 leading-none"
              >
                ×
              </button>
            </span>
          </div>

          {defining && !term.definition && (
            <p className="text-brown-300 text-xs mt-1 animate-pulse">{t('terms.defining')}</p>
          )}

          {defineError && (
            <p className="text-brown-300 text-xs mt-1">{t('terms.clarifyError')}</p>
          )}

          {term.definition && (
            <p className="text-brown-600 text-xs mt-1 leading-relaxed fade-in">
              {term.definition}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
