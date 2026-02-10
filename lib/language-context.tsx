"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { type Language, t as translate, languages } from "./i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function detectNavigatorLanguage(): Language {
  try {
    const nav = navigator.language || (navigator as any).userLanguage || "en"
    if (nav.startsWith("mr")) return "mr"
    if (nav.startsWith("hi")) return "hi"
  } catch (e) {
    // ignore
  }
  return "en"
}

function getStoredLanguage(): Language | null {
  try {
    const v = localStorage.getItem("language")
    if (!v) return null
    if (languages.find((l) => l.code === v)) return v as Language
  } catch (e) {
    // ignore
  }
  return null
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // prefer stored -> navigator -> default (mr for farmer-first UX)
    try {
      const stored = typeof window !== "undefined" ? getStoredLanguage() : null
      if (stored) return stored
    } catch (e) {
      // ignore
    }
    return detectNavigatorLanguage() || "mr"
  })

  useEffect(() => {
    try {
      localStorage.setItem("language", language)
    } catch (e) {
      // ignore storage errors
    }
    try {
      document.documentElement.lang = language
    } catch (e) {
      // ignore
    }
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const t = useCallback((key: string) => translate(language, key), [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
