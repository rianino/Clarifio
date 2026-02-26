import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface UpgradeModalProps {
  reason: 'program' | 'course' | 'clarify'
  onClose: () => void
}

const MONTHLY_PRICE = '€5.99'
const ANNUAL_PRICE = '€49.99'

const REASON_MESSAGES = {
  program: 'upgrade.limitProgram',
  course:  'upgrade.limitCourse',
  clarify: 'upgrade.limitClarify',
}

export function UpgradeModal({ reason, onClose }: UpgradeModalProps) {
  const { t } = useTranslation()
  const { linkEmail } = useAuth()
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'pricing' | 'form' | 'processing'>('pricing')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setStep('processing')

    // Step 1: Link email+password to the anonymous account
    const { error: linkError } = await linkEmail(email, password)
    if (linkError) {
      setError(linkError.message)
      setStep('form')
      return
    }

    // Step 2: Create Stripe checkout session via Edge Function
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, email }),
      })

      if (!res.ok) throw new Error('Could not create checkout session.')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('form')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(42,33,24,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-cream-50 rounded-xl w-full max-w-md py-10 px-8 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-brown-300 hover:text-brown-600
                     transition-colors duration-200 text-xl leading-none"
        >
          ×
        </button>

        {step === 'pricing' && (
          <>
            <p className="text-xs text-accent uppercase tracking-widest mb-3">
              {t(REASON_MESSAGES[reason])}
            </p>
            <h2 className="text-brown-900 font-heading text-2xl font-normal mb-6">
              {t('upgrade.title')}
            </h2>

            {/* Plan toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setPlan('monthly')}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200
                  ${plan === 'monthly'
                    ? 'bg-accent text-white'
                    : 'bg-cream-100 text-brown-600 hover:bg-cream-200'}`}
              >
                {t('upgrade.monthly')} · {MONTHLY_PRICE}
              </button>
              <button
                onClick={() => setPlan('annual')}
                className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 relative
                  ${plan === 'annual'
                    ? 'bg-accent text-white'
                    : 'bg-cream-100 text-brown-600 hover:bg-cream-200'}`}
              >
                {t('upgrade.annual')} · {ANNUAL_PRICE}
                <span className={`absolute -top-2 -right-2 text-xs px-1.5 py-0.5 rounded-full
                  ${plan === 'annual' ? 'bg-white text-accent' : 'bg-accent text-white'}`}>
                  −30%
                </span>
              </button>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-8">
              {(['feature1','feature2','feature3','feature4'] as const).map(k => (
                <li key={k} className="flex items-start gap-2.5 text-sm text-brown-700">
                  <span className="text-accent mt-0.5 select-none">✦</span>
                  {t(`upgrade.${k}`)}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setStep('form')}
              className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium
                         hover:bg-accent-hover transition-all duration-200"
              style={{ boxShadow: '0 1px 6px rgba(59,90,64,0.3)' }}
            >
              {t('upgrade.cta', {
                price: plan === 'monthly'
                  ? `${MONTHLY_PRICE} ${t('upgrade.monthlyLabel')}`
                  : `${ANNUAL_PRICE} ${t('upgrade.annualLabel')}`
              })}
            </button>
          </>
        )}

        {step === 'form' && (
          <>
            <h2 className="text-brown-900 font-heading text-2xl font-normal mb-1">
              {t('upgrade.createAccount')}
            </h2>
            <p className="text-brown-400 text-sm mb-6">
              {plan === 'monthly'
                ? `${MONTHLY_PRICE} ${t('upgrade.monthlyLabel')}`
                : `${ANNUAL_PRICE} ${t('upgrade.annualLabel')}`}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-brown-700 text-sm mb-1.5">{t('upgrade.email')}</label>
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
                <label className="block text-brown-700 text-sm mb-1.5">{t('upgrade.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-700 text-xs opacity-80">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent text-white text-sm font-medium
                           hover:bg-accent-hover transition-all duration-200 mt-2"
              >
                {t('upgrade.proceedToPayment')}
              </button>
            </form>

            <button
              onClick={() => setStep('pricing')}
              className="mt-4 text-brown-300 text-xs hover:text-brown-600 transition-colors duration-200"
            >
              ← {t('common.back')}
            </button>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-6">
            <p className="text-brown-600 text-sm animate-pulse">{t('upgrade.processing')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
