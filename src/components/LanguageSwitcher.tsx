import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('pt') ? 'pt' : 'en'

  const toggle = () => {
    const next = current === 'en' ? 'pt' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('clarifio-lang', next)
  }

  return (
    <button
      onClick={toggle}
      className="text-brown-300 text-xs hover:text-brown-600 transition-colors duration-200
                 font-mono uppercase tracking-wider"
      title={current === 'en' ? 'Mudar para Português' : 'Switch to English'}
    >
      {current === 'en' ? 'PT' : 'EN'}
    </button>
  )
}
