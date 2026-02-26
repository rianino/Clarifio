import { useTranslation } from 'react-i18next'

type SaveStatus = 'idle' | 'saving' | 'saved'

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useTranslation()
  if (status === 'idle') return null

  return (
    <span
      className={`text-xs text-brown-300 transition-opacity duration-300 ${
        status === 'saving' ? 'animate-pulse' : 'opacity-100'
      }`}
    >
      {status === 'saving' ? t('notes.saving') : t('notes.saved')}
    </span>
  )
}
