import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import pt from '../locales/pt.json'

const STORAGE_KEY = 'clarifio-lang'
const SUPPORTED = ['en', 'pt'] // add new language codes here when adding locales

const saved = localStorage.getItem(STORAGE_KEY)
const browser = navigator.language.split('-')[0]
const lng = saved && SUPPORTED.includes(saved)
  ? saved
  : SUPPORTED.includes(browser) ? browser : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
