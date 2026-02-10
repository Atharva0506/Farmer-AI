"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Camera, Leaf, ArrowRight, Volume2, Sprout, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { languages, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const steps = [
  { key: "language", icon: Leaf },
  { key: "permissions", icon: Mic },
  { key: "intro", icon: Sprout },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress */}
      <div className="flex items-center gap-2 px-6 pt-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= currentStep ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Step 1: Language */}
        {currentStep === 0 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Leaf size={40} className="text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t("chooseLanguage")}</h1>
              <p className="text-muted-foreground mt-2 text-sm">{t("onboardingDesc1")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={cn(
                    "flex items-center justify-between w-full rounded-xl border-2 px-5 py-4 text-left transition-all",
                    language === lang.code
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className={language === lang.code ? "text-primary" : "text-muted-foreground"} />
                    <div>
                      <span className="font-semibold text-foreground text-lg">{lang.nativeLabel}</span>
                      <span className="block text-xs text-muted-foreground">{lang.label}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-colors",
                      language === lang.code
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {language === lang.code && (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Permissions */}
        {currentStep === 1 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15">
              <Mic size={40} className="text-accent" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t("onboardingStep2")}</h1>
              <p className="text-muted-foreground mt-2 text-sm">{t("onboardingDesc2")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button className="flex items-center gap-4 w-full rounded-xl border-2 border-border bg-card px-5 py-4 hover:border-primary/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Mic size={24} className="text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">{t("allowMic")}</span>
                  <span className="block text-xs text-muted-foreground">{t("speakNow")}</span>
                </div>
              </button>
              <button className="flex items-center gap-4 w-full rounded-xl border-2 border-border bg-card px-5 py-4 hover:border-primary/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Camera size={24} className="text-accent" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-foreground">{t("allowCamera")}</span>
                  <span className="block text-xs text-muted-foreground">{t("uploadImage")}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Intro */}
        {currentStep === 2 && (
          <div className="w-full max-w-sm flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingBag size={40} className="text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t("onboardingStep3")}</h1>
              <p className="text-muted-foreground mt-2 text-sm">{t("onboardingDesc3")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { icon: Sprout, label: t("cropHelp") },
                { icon: Camera, label: t("diseaseCheck") },
                { icon: ShoppingBag, label: t("sellProduce") },
                { icon: Volume2, label: t("govSchemes") },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-6 pb-8 flex flex-col gap-3">
        <Button
          onClick={handleNext}
          size="lg"
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {currentStep === steps.length - 1 ? t("getStarted") : t("next")}
          <ArrowRight size={18} className="ml-2" />
        </Button>
        {currentStep < steps.length - 1 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push("/")}
            className="text-muted-foreground"
          >
            {t("skip")}
          </Button>
        )}
      </div>
    </div>
  )
}
