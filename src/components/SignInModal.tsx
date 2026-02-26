import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

interface SignInModalProps {
  onClose: () => void
  onShowUpgrade: () => void
}

export function SignInModal({ onClose, onShowUpgrade }: SignInModalProps) {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, onAuthStateChange in useAuth fires → App re-renders → modal unmounts
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(42,33,24,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-cream-50 rounded-xl w-full max-w-sm py-10 px-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-brown-300 hover:text-brown-600
                     transition-colors duration-200 text-xl leading-none"
        >
          ×
        </button>

        <h2 className="text-brown-900 font-heading text-2xl font-normal mb-1">
          {t('signIn.title')}
        </h2>
        <p className="text-brown-400 text-sm mb-6">{t('signIn.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-brown-700 text-sm mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="auth-input"
              placeholder="you@university.edu"
            />
          </div>
          <div>
            <label className="block text-brown-700 text-sm mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-700 text-xs opacity-80">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium
                       hover:bg-accent-hover transition-all duration-200 mt-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.signingIn') : t('signIn.cta')}
          </button>
        </form>

        <p className="mt-6 text-center text-brown-400 text-xs">
          {t('signIn.noAccount')}{' '}
          <button
            onClick={() => { onClose(); onShowUpgrade() }}
            className="text-accent hover:text-accent-hover transition-colors duration-200"
          >
            {t('signIn.upgradeLink')}
          </button>
        </p>
      </div>
    </div>
  )
}
