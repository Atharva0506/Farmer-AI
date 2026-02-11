"use client"

import { Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/language-context"
import { languages } from "@/lib/i18n"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const current = languages.find((l) => l.code === language)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Change language"
                    className="gap-1.5 text-foreground"
                >
                    <Globe size={18} />
                    <span className="hidden sm:inline">{current?.nativeLabel}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={
                            language === lang.code ? "bg-primary/10 text-primary font-medium" : ""
                        }
                        aria-current={language === lang.code ? "true" : undefined}
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                                <span className="mr-2">{lang.nativeLabel}</span>
                                <span className="text-muted-foreground text-xs">({lang.label})</span>
                            </div>
                            {language === lang.code && <Check size={16} className="text-primary" />}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
