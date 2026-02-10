"use client"

import Link from "next/link"
import { Sprout, ShoppingBag, Mic, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="text-primary-foreground h-5 w-5" />
          </div>
          <span className="font-bold text-xl text-foreground">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 py-8 md:py-12 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            {t("landingHeroTitle")} 🌾
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            {t("landingHeroSubtitle")}
          </p>
          <div className="pt-4">
            <Link href="/assistant">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <Mic className="mr-2 h-5 w-5" />
                {t("talkToAI")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full">
          {/* Farmer Card */}
          <Link href="/auth/phone?role=farmer" className="group">
            <Card className="h-full border-2 border-border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sprout size={120} />
              </div>
              <CardContent className="p-8 flex flex-col h-full gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t("farmer")}</h2>
                  <p className="text-muted-foreground">{t("farmerDesc")}</p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-primary font-semibold">
                  {t("getStarted")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Buyer Card */}
          <Link href="/auth/phone?role=buyer" className="group">
            <Card className="h-full border-2 border-border hover:border-accent/50 transition-all hover:shadow-md cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag size={120} />
              </div>
              <CardContent className="p-8 flex flex-col h-full gap-4">
                <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{t("buyer")}</h2>
                  <p className="text-muted-foreground">{t("buyerDesc")}</p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-accent font-semibold">
                  {t("getStarted")} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
