import { useTranslation } from 'react-i18next'

interface ClarifyButtonProps {
  onClick: () => void
  loading: boolean
  disabled: boolean
  blocked?: boolean        // guest who already clarified
  onBlockedClick?: () => void
}

export function ClarifyButton({ onClick, loading, disabled, blocked, onBlockedClick }: ClarifyButtonProps) {
  const { t } = useTranslation()

  const handleClick = () => {
    if (blocked) { onBlockedClick?.(); return }
    onClick()
  }

  const isInert = loading || (disabled && !blocked)

  return (
    <button
      onClick={handleClick}
      disabled={isInert}
      title={blocked ? t('terms.clarifyBlockedHint') : undefined}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isInert
          ? 'opacity-40 cursor-not-allowed bg-cream-200 text-brown-400'
          : blocked
            ? 'bg-cream-200 text-brown-400 hover:bg-accent hover:text-white cursor-pointer'
            : 'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow-md'
        }
      `}
      style={{ boxShadow: (!isInert && !blocked) ? '0 1px 4px rgba(59,90,64,0.25)' : undefined }}
    >
      <span className={loading ? 'animate-pulse' : ''}>✦</span>
      <span>{loading ? t('terms.clarifying') : t('terms.clarifyAll')}</span>
    </button>
  )
}
