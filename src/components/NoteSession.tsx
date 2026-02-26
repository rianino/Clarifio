import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTerms } from '../hooks/useTerms'
import { useAutoSave } from '../hooks/useAutoSave'
import { NotesPanel } from './NotesPanel'
import { TermsPanel } from './TermsPanel'
import { Breadcrumb } from './Breadcrumb'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { NoteSession as NoteSessionType, View } from '../types'

interface NoteSessionProps {
  session: NoteSessionType
  programName: string
  courseName: string
  view: View
  onNavigate: (view: View) => void
  onLogoClick: () => void
  onSignOut: () => void
  onSessionUpdate: (session: NoteSessionType) => void
  isGuest: boolean
  hasClarified: boolean
  onMarkClarified: () => void
  onClarifyLimitReached: () => void
  onShowSignIn: () => void
}

export function NoteSession({
  session,
  programName,
  courseName,
  view,
  onNavigate,
  onLogoClick,
  onSignOut,
  onSessionUpdate,
  isGuest,
  hasClarified,
  onMarkClarified,
  onClarifyLimitReached,
  onShowSignIn,
}: NoteSessionProps) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState(session.notes)
  const saveStatus = useAutoSave(session.id, notes)
  const { terms, addTerm, removeTerm, updateDefinition, updateDefinitions } = useTerms(session.id)

  useEffect(() => {
    setNotes(session.notes)
  }, [session.id, session.notes])

  useEffect(() => {
    if (saveStatus === 'saved') {
      onSessionUpdate({ ...session, notes, updated_at: new Date().toISOString() })
    }
  }, [saveStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header — language left, logo center, sign in/out right */}
      <header className="px-4 py-5 md:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
          <div>
            <LanguageSwitcher />
          </div>
          <div className="text-center">
            <button
              onClick={onLogoClick}
              className="text-brown-800 text-xl font-heading tracking-wide
                         hover:text-brown-600 transition-colors duration-200"
            >
              Clarifio
            </button>
          </div>
          <div className="flex justify-end">
            {isGuest ? (
              <button
                onClick={onShowSignIn}
                className="text-brown-300 text-xs hover:text-brown-600 transition-colors duration-200"
              >
                {t('nav.signIn')}
              </button>
            ) : (
              <button
                onClick={onSignOut}
                className="text-brown-300 text-xs hover:text-brown-600 transition-colors duration-200"
              >
                {t('nav.signOut')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8 md:px-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <Breadcrumb
              view={view}
              programName={programName}
              courseName={courseName}
              sessionName={session.name}
              onNavigate={onNavigate}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <div className="flex-[3] min-w-0">
              <h1 className="text-brown-900 font-heading text-xl font-normal mb-6">{session.name}</h1>
              <NotesPanel
                notes={notes}
                onChange={setNotes}
                saveStatus={saveStatus}
              />
            </div>

            <div
              className="flex-[2] min-w-0 bg-cream-100 rounded-lg px-5 py-5 self-start sticky top-8"
              style={{ minHeight: '300px' }}
            >
              <TermsPanel
                sessionId={session.id}
                notes={notes}
                terms={terms}
                onAddTerm={addTerm}
                onRemoveTerm={removeTerm}
                onDefinitionUpdate={updateDefinition}
                onUpdateDefinitions={updateDefinitions}
                isGuest={isGuest}
                hasClarified={hasClarified}
                onMarkClarified={onMarkClarified}
                onClarifyLimitReached={onClarifyLimitReached}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
