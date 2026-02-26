import { useTranslation } from 'react-i18next'
import type { View } from '../types'

interface BreadcrumbProps {
  view: View
  programName?: string
  courseName?: string
  sessionName?: string
  onNavigate: (view: View) => void
}

export function Breadcrumb({ view, programName, courseName, sessionName, onNavigate }: BreadcrumbProps) {
  const { t } = useTranslation()
  if (view.type === 'dashboard') return null

  const sep = <span className="text-brown-300 mx-2 select-none">·</span>

  return (
    <nav className="flex items-center text-sm text-brown-400 mb-8 flex-wrap gap-y-1">
      <button
        onClick={() => onNavigate({ type: 'dashboard' })}
        className="hover:text-brown-700 transition-colors duration-200"
      >
        {t('dashboard.yourPrograms')}
      </button>

      {view.type === 'course' && programName && (
        <>
          {sep}
          {view.courseId ? (
            <button
              onClick={() => onNavigate({ type: 'course', programId: view.programId, courseId: '' })}
              className="hover:text-brown-700 transition-colors duration-200"
            >
              {programName}
            </button>
          ) : (
            <span className="text-brown-600">{programName}</span>
          )}
          {view.courseId && (
            <>
              {sep}
              <span className="text-brown-800">{courseName}</span>
            </>
          )}
        </>
      )}

      {view.type === 'session' && (
        <>
          {sep}
          <button
            onClick={() => onNavigate({ type: 'course', programId: view.programId, courseId: '' })}
            className="hover:text-brown-700 transition-colors duration-200"
          >
            {programName}
          </button>
          {sep}
          <button
            onClick={() => onNavigate({ type: 'course', programId: view.programId, courseId: view.courseId })}
            className="hover:text-brown-700 transition-colors duration-200"
          >
            {courseName}
          </button>
          {sep}
          <span className="text-brown-800">{sessionName}</span>
        </>
      )}
    </nav>
  )
}
