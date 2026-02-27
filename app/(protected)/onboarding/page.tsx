"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Camera, Leaf, ArrowRight, Volume2, Sprout, ShoppingBag, MapPin, Wheat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { languages, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
]

const COMMON_CROPS = [
  { en: "Wheat", hi: "गेहूं", mr: "गहू" },
  { en: "Rice", hi: "चावल", mr: "भात" },
  { en: "Cotton", hi: "कपास", mr: "कापूस" },
  { en: "Sugarcane", hi: "गन्ना", mr: "ऊस" },
  { en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन" },
  { en: "Tomato", hi: "टमाटर", mr: "टोमॅटो" },
  { en: "Onion", hi: "प्याज", mr: "कांदा" },
  { en: "Potato", hi: "आलू", mr: "बटाटा" },
  { en: "Maize", hi: "मक्का", mr: "मका" },
  { en: "Groundnut", hi: "मूंगफली", mr: "भुईमूग" },
  { en: "Grapes", hi: "अंगूर", mr: "द्राक्षे" },
  { en: "Banana", hi: "केला", mr: "केळी" },
]

const LAND_SIZES = [
  { label: { en: "Below 1 acre", hi: "1 एकड़ से कम", mr: "1 एकरापेक्षा कमी" }, value: 0.5 },
  { label: { en: "1-3 acres", hi: "1-3 एकड़", mr: "1-3 एकर" }, value: 2 },
  { label: { en: "3-5 acres", hi: "3-5 एकड़", mr: "3-5 एकर" }, value: 4 },
  { label: { en: "5-10 acres", hi: "5-10 एकड़", mr: "5-10 एकर" }, value: 7.5 },
  { label: { en: "Above 10 acres", hi: "10 एकड़ से ऊपर", mr: "10 एकरांपेक्षा जास्त" }, value: 15 },
]

const steps = [
  { key: "language", icon: Leaf },
  { key: "permissions", icon: Mic },
  { key: "farm_profile", icon: Wheat },
  { key: "intro", icon: Sprout },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const { t, language, setLanguage } = useLanguage()
  const router = useRouter()

  // Farm profile state
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])
  const [selectedLandSize, setSelectedLandSize] = useState<number | null>(null)
  const [selectedState, setSelectedState] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    )
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crops: selectedCrops,
          landSizeAcres: selectedLandSize,
          state: selectedState || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success(
        language === "mr" ? "प्रोफाइल सेव्ह केले!" :
          language === "hi" ? "प्रोफ़ाइल सहेजा गया!" :
            "Profile saved!"
      )
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    // If leaving farm profile step, save the profile
    if (currentStep === 2 && (selectedCrops.length > 0 || selectedLandSize || selectedState)) {
      await saveProfile()
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/dashboard")
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

        {/* Step 3: Farm Profile (NEW) */}
        {currentStep === 2 && (
          <div className="w-full max-w-md flex flex-col items-center gap-6 overflow-y-auto max-h-[70vh]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
              <Wheat size={40} className="text-primary" />
            </div>
            <div className="text-center shrink-0">
              <h1 className="text-2xl font-bold text-foreground">
                {language === "mr" ? "तुमची शेती" : language === "hi" ? "आपकी खेती" : "Your Farm"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {language === "mr"
                  ? "AI तुमच्यासाठी वैयक्तिक सल्ला देईल"
                  : language === "hi"
                    ? "AI आपको व्यक्तिगत सलाह देगा"
                    : "AI will give you personalized advice"}
              </p>
            </div>

            {/* Crops Selection */}
            <div className="w-full">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {language === "mr" ? "तुमची पिके निवडा" : language === "hi" ? "अपनी फसलें चुनें" : "Select your crops"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COMMON_CROPS.map((crop) => (
                  <button
                    key={crop.en}
                    onClick={() => toggleCrop(crop.en)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all text-center",
                      selectedCrops.includes(crop.en)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    {crop[language as keyof typeof crop] || crop.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Land Size */}
            <div className="w-full">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                {language === "mr" ? "जमीन" : language === "hi" ? "ज़मीन" : "Land size"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LAND_SIZES.map((ls) => (
                  <button
                    key={ls.value}
                    onClick={() => setSelectedLandSize(ls.value)}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all",
                      selectedLandSize === ls.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    {ls.label[language as keyof typeof ls.label] || ls.label.en}
                  </button>
                ))}
              </div>
            </div>

            {/* State Selector */}
            <div className="w-full">
              <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
                <MapPin size={14} />
                {language === "mr" ? "राज्य" : language === "hi" ? "राज्य" : "State"}
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">
                  {language === "mr" ? "राज्य निवडा" : language === "hi" ? "राज्य चुनें" : "Select state"}
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Intro */}
        {currentStep === 3 && (
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
          disabled={saving}
        >
          {saving
            ? (language === "mr" ? "सेव्ह करत आहे..." : language === "hi" ? "सहेज रहे हैं..." : "Saving...")
            : currentStep === steps.length - 1
              ? t("getStarted")
              : t("next")}
          {!saving && <ArrowRight size={18} className="ml-2" />}
        </Button>
        {currentStep < steps.length - 1 && (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              if (currentStep === steps.length - 2) {
                router.push("/dashboard")
              } else {
                setCurrentStep(currentStep + 1)
              }
            }}
            className="text-muted-foreground"
          >
            {t("skip")}
          </Button>
        )}
      </div>
    </div>
  )
}
