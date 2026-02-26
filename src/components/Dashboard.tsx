import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import { usePrograms } from '../hooks/usePrograms'
import { useCourses } from '../hooks/useCourses'
import { useSessions } from '../hooks/useSessions'
import { useGuestLimits } from '../hooks/useGuestLimits'
import { ProgramList } from './ProgramList'
import { CourseList } from './CourseList'
import { SessionList } from './SessionList'
import { Breadcrumb } from './Breadcrumb'
import { NoteSession } from './NoteSession'
import { LanguageSwitcher } from './LanguageSwitcher'
import { UpgradeModal } from './UpgradeModal'
import { SignInModal } from './SignInModal'
import type { View } from '../types'

interface DashboardProps {
  user: User
  isSubscribed: boolean
  onSignOut: () => void
}

type ModalState =
  | null
  | { type: 'upgrade'; reason: 'program' | 'course' | 'clarify' }
  | { type: 'signin' }

export function Dashboard({ user, isSubscribed, onSignOut }: DashboardProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<View>({ type: 'dashboard' })
  const [modal, setModal] = useState<ModalState>(null)

  const { isGuest: isAnonymous, hasClarified, markClarified } = useGuestLimits(user)
  // Paid non-anonymous users always have full access
  const isGuest = isAnonymous && !isSubscribed

  const { programs, loading: programsLoading, createProgram } = usePrograms(user.id)

  const selectedProgramId = view.type !== 'dashboard' ? view.programId : undefined
  const selectedCourseId = view.type === 'course' && view.courseId
    ? view.courseId
    : view.type === 'session' ? view.courseId : undefined

  const { courses, loading: coursesLoading, createCourse } = useCourses(selectedProgramId)
  const { sessions, loading: sessionsLoading, createSession, updateSession } = useSessions(
    view.type === 'course' && view.courseId ? view.courseId :
    view.type === 'session' ? view.courseId : undefined
  )

  const selectedProgram = programs.find(p => p.id === selectedProgramId)
  const selectedCourse = courses.find(c => c.id === selectedCourseId)
  const selectedSession = view.type === 'session'
    ? sessions.find(s => s.id === view.sessionId)
    : undefined

  const handleNavigate = (newView: View) => setView(newView)
  const handleLogoClick = () => setView({ type: 'dashboard' })

  // Guest-aware create handlers
  const handleCreateProgram = async (name: string) => {
    if (isGuest && programs.length >= 1) {
      setModal({ type: 'upgrade', reason: 'program' })
      return null
    }
    return createProgram(name)
  }

  const handleCreateCourse = async (name: string) => {
    if (isGuest && courses.length >= 1) {
      setModal({ type: 'upgrade', reason: 'course' })
      return null
    }
    return createCourse(name)
  }

  const handleClarifyLimitReached = () => setModal({ type: 'upgrade', reason: 'clarify' })

  // ── Header shared across all views ────────────────────────────────────────
  const Header = () => (
    <header className="px-4 py-5 md:px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
        {/* Left — language */}
        <div>
          <LanguageSwitcher />
        </div>
        {/* Center — logo */}
        <div className="text-center">
          <button
            onClick={handleLogoClick}
            className="text-brown-800 text-xl font-heading tracking-wide
                       hover:text-brown-600 transition-colors duration-200"
          >
            Clarifio
          </button>
        </div>
        {/* Right — sign in / sign out */}
        <div className="flex justify-end">
          {isGuest ? (
            <button
              onClick={() => setModal({ type: 'signin' })}
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
  )

  // ── Session view ───────────────────────────────────────────────────────────
  if (view.type === 'session') {
    if (!selectedSession) {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center">
          <span className="text-brown-200 text-sm animate-pulse">{t('common.loading')}</span>
        </div>
      )
    }
    return (
      <>
        <NoteSession
          session={selectedSession}
          programName={selectedProgram?.name ?? ''}
          courseName={selectedCourse?.name ?? ''}
          view={view}
          onNavigate={handleNavigate}
          onLogoClick={handleLogoClick}
          onSignOut={onSignOut}
          onSessionUpdate={updateSession}
          isGuest={isGuest}
          hasClarified={hasClarified}
          onMarkClarified={markClarified}
          onClarifyLimitReached={handleClarifyLimitReached}
          onShowSignIn={() => setModal({ type: 'signin' })}
        />
        {modal?.type === 'upgrade' && (
          <UpgradeModal
            reason={modal.reason}
            onClose={() => setModal(null)}
          />
        )}
        {modal?.type === 'signin' && (
          <SignInModal
            onClose={() => setModal(null)}
            onShowUpgrade={() => setModal({ type: 'upgrade', reason: 'clarify' })}
          />
        )}
      </>
    )
  }

  // ── Dashboard / Course / Program views ────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream-50">
      <Header />

      {/* Guest banner */}
      {isGuest && (
        <div className="px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-cream-100 mb-1">
              <p className="text-brown-400 text-xs">{t('guest.banner')}</p>
              <button
                onClick={() => setModal({ type: 'upgrade', reason: 'program' })}
                className="text-accent text-xs hover:text-accent-hover transition-colors duration-200 ml-4 shrink-0"
              >
                {t('guest.upgrade')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="px-6 pb-16 md:px-8">
        <div className="max-w-2xl mx-auto pt-10">
          {view.type === 'dashboard' && (
            <>
              <h1 className="text-brown-900 font-heading text-2xl font-normal mb-8">
                {t('dashboard.yourPrograms')}
              </h1>
              <ProgramList
                programs={programs}
                loading={programsLoading}
                onNavigate={handleNavigate}
                onCreateProgram={handleCreateProgram}
              />
            </>
          )}

          {view.type === 'course' && (
            <>
              <Breadcrumb
                view={view}
                programName={selectedProgram?.name}
                courseName={selectedCourse?.name}
                onNavigate={handleNavigate}
              />
              {!view.courseId ? (
                <>
                  <h1 className="text-brown-900 font-heading text-2xl font-normal mb-8">
                    {selectedProgram?.name}
                  </h1>
                  <CourseList
                    programId={view.programId}
                    courses={courses}
                    loading={coursesLoading}
                    onNavigate={handleNavigate}
                    onCreateCourse={handleCreateCourse}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-brown-900 font-heading text-2xl font-normal mb-8">
                    {selectedCourse?.name}
                  </h1>
                  <SessionList
                    programId={view.programId}
                    courseId={view.courseId}
                    sessions={sessions}
                    loading={sessionsLoading}
                    onNavigate={handleNavigate}
                    onCreateSession={createSession}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal?.type === 'upgrade' && (
        <UpgradeModal
          reason={modal.reason}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'signin' && (
        <SignInModal
          onClose={() => setModal(null)}
          onShowUpgrade={() => setModal({ type: 'upgrade', reason: 'clarify' })}
        />
      )}
    </div>
  )
}
