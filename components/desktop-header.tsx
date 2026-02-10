"use client"

import { usePathname } from "next/navigation"
import { LanguageSwitcher } from "./language-switcher"
import { ThemeToggle } from "./theme-toggle"

export function DesktopHeader() {
  const pathname = usePathname()

  if (pathname === "/onboarding") return null

  return (
    <header className="hidden md:flex items-center justify-end gap-2 border-b border-border bg-card/95 backdrop-blur px-6 py-3 sticky top-0 z-20">
      <LanguageSwitcher />
      <ThemeToggle />
    </header>
  )
}
