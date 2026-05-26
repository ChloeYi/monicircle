import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import i18n from '@/i18n'

type Lang = 'en' | 'ko'

type LanguageContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'ko', setLang: () => {} })

export function LanguageProvider({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState<Lang>((i18n.locale?.startsWith('ko') ? 'ko' : 'en') as Lang)

  const setLang = (l: Lang) => {
    i18n.locale = l
    setLangState(l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
