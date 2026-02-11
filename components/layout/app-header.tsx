"use client"

import { usePathname } from "next/navigation"
import { Leaf } from "lucide-react"
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { useLanguage } from "@/lib/language-context"

export function AppHeader() {
    const { t } = useLanguage()
    const pathname = usePathname()

    if (pathname === "/onboarding") return null

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Leaf size={16} className="text-primary-foreground" />
                </div>
                <span className="text-base font-bold text-foreground">{t("appName")}</span>
            </div>
            <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>
        </header>
    )
}
