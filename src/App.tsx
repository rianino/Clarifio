import { useEffect, useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'
import { useSubscription } from './hooks/useSubscription'
import { Dashboard } from './components/Dashboard'
import { LanguageSwitcher } from './components/LanguageSwitcher'

export function App() {
  const { user, loading: authLoading, signIn, signUp } = useAuth()
  const { isSubscribed, loading: subLoading, refresh: refreshSub } = useSubscription(user?.id)
  const { t } = useTranslation()
  const [verifying, setVerifying] = useState(false)

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const success = params.get('checkout_success') === '1'

    if (!success || !sessionId || !user) return

    // Clear URL params immediately
    window.history.replaceState({}, '', window.location.pathname)

    const verify = async () => {
      setVerifying(true)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const res = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        })

        if (res.ok) await refreshSub()
      } finally {
        setVerifying(false)
      }
    }

    verify()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading || subLoading || verifying) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <span className="text-brown-200 text-sm animate-pulse">{t('common.loading')}</span>
      </div>
    )
  }

  // Anonymous auth failed (not enabled in Supabase, or network issue) — show sign-in fallback
  if (!user) {
    return <SignInFallback signIn={signIn} signUp={signUp} />
  }

  return (
    <Dashboard
      key={user.id}
      user={user}
      isSubscribed={isSubscribed}
      onSignOut={async () => { await supabase.auth.signOut() }}
    />
  )
}

type AuthFn = (email: string, password: string) => Promise<{ error: { message: string } | null }>

function SignInFallback({ signIn, signUp }: { signIn: AuthFn; signUp: AuthFn }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setNotice(t('auth.checkEmail'))
      }
      setLoading(false)
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
      }
      // On success, useAuth fires SIGNED_IN → App re-renders → this unmounts
    }
  }

  const switchMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(null)
    setNotice(null)
  }

  const isSignIn = mode === 'signin'

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4">
      <div className="absolute top-5 left-6">
        <LanguageSwitcher />
      </div>

      <p className="text-brown-800 font-heading text-3xl mb-10 tracking-wide">Clarifio</p>

      <div className="w-full max-w-sm">
        <h2 className="text-brown-900 font-heading text-2xl font-normal mb-1">
          {isSignIn ? t('signIn.title') : t('auth.signUp')}
        </h2>
        <p className="text-brown-400 text-sm mb-6">
          {isSignIn ? t('signIn.subtitle') : t('app.tagline')}
        </p>

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
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-brown-700 text-sm mb-1.5">{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={isSignIn ? undefined : 8}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-700 text-xs opacity-80">{error}</p>}
          {notice && <p className="text-accent text-xs">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium
                       hover:bg-accent-hover transition-all duration-200 mt-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (isSignIn ? t('auth.signingIn') : t('auth.creatingAccount'))
              : (isSignIn ? t('signIn.cta') : t('auth.signUp'))}
          </button>
        </form>

        <p className="mt-6 text-center text-brown-400 text-xs">
          {isSignIn ? t('auth.noAccount') : t('auth.alreadyHave')}{' '}
          <button
            onClick={switchMode}
            className="text-accent hover:text-accent-hover transition-colors duration-200"
          >
            {isSignIn ? t('auth.signUpLink') : t('auth.signInLink')}
          </button>
        </p>
      </div>
    </div>
  )
}
