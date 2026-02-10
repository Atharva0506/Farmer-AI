"use client"

import { useState } from "react"
import { Search, MessageCircle, ArrowRight, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SchemeCard } from "@/components/scheme-card"
import { VoiceInputButton } from "@/components/voice-input-button"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface ConversationStep {
  question: string
  options: string[]
  answerKey: string
}

const conversationSteps: ConversationStep[] = [
  {
    question: "What is your annual income?",
    options: ["Below 1 Lakh", "1-3 Lakh", "3-5 Lakh", "Above 5 Lakh"],
    answerKey: "income",
  },
  {
    question: "How much land do you own?",
    options: ["Below 1 acre", "1-5 acres", "5-10 acres", "Above 10 acres"],
    answerKey: "landSize",
  },
  {
    question: "What is your main crop?",
    options: ["Wheat / Rice", "Vegetables", "Fruits", "Cash Crops"],
    answerKey: "crop",
  },
]

const schemesData = [
  {
    title: "PM-KISAN Samman Nidhi",
    description: "Direct income support of Rs 6,000 per year to farmer families in three installments.",
    eligibility: "All farmer families with cultivable land",
    benefit: "Rs 6,000 per year in 3 installments",
    deadline: "March 31, 2026",
    matchScore: 95,
  },
  {
    title: "Pradhan Mantri Fasal Bima Yojana",
    description: "Crop insurance scheme to protect farmers from crop loss due to natural calamities.",
    eligibility: "All farmers growing notified crops",
    benefit: "Insurance coverage up to full sum insured",
    deadline: "Kharif: July 31",
    matchScore: 88,
  },
  {
    title: "Soil Health Card Scheme",
    description: "Provides information on soil nutrient status and recommendations for improving soil health.",
    eligibility: "All farmers",
    benefit: "Free soil testing and nutrient recommendations",
    matchScore: 82,
  },
  {
    title: "National Agriculture Market (eNAM)",
    description: "Online trading platform for agricultural commodities providing better price discovery.",
    eligibility: "Farmers, traders, commission agents",
    benefit: "Better prices through transparent online auction",
    matchScore: 76,
  },
  {
    title: "Kisan Credit Card (KCC)",
    description: "Credit facility for farmers for purchasing agricultural inputs and other needs.",
    eligibility: "Farmers owning agricultural land",
    benefit: "Credit up to Rs 3 lakh at 4% interest rate",
    deadline: "Ongoing",
    matchScore: 70,
  },
]

export default function SchemesPage() {
  const [conversationStep, setConversationStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  const handleAnswer = (answer: string) => {
    const currentStep = conversationSteps[conversationStep]
    setAnswers((prev) => ({ ...prev, [currentStep.answerKey]: answer }))

    if (conversationStep < conversationSteps.length - 1) {
      setConversationStep(conversationStep + 1)
    } else {
      setShowResults(true)
    }
  }

  const filteredSchemes = schemesData.filter(
    (s) => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("schemesFinder")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Find schemes that match your profile</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary" aria-label="Listen">
          <Volume2 size={18} />
        </Button>
      </div>

      {/* Conversational AI Form */}
      {!showResults && (
        <div className="mb-6">
          {/* Previous answers */}
          <div className="flex flex-col gap-3 mb-4">
            {conversationSteps.slice(0, conversationStep).map((step, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="self-start bg-card border border-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-foreground">
                  <MessageCircle size={12} className="inline mr-1.5 text-primary" />
                  {step.question}
                </div>
                <div className="self-end bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2.5 text-sm">
                  {answers[step.answerKey]}
                </div>
              </div>
            ))}
          </div>

          {/* Current question */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={18} className="text-primary" />
                <p className="font-semibold text-foreground">
                  {conversationSteps[conversationStep]?.question}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {conversationSteps[conversationStep]?.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Or answer with voice</span>
                <VoiceInputButton size="sm" onResult={(text) => handleAnswer(text)} />
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {conversationSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= conversationStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div>
          {/* Summary */}
          <Card className="border border-primary/30 bg-primary/5 mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-foreground">
                Based on your profile ({answers.income}, {answers.landSize}, {answers.crop}), we found{" "}
                <span className="font-bold text-primary">{filteredSchemes.length} matching schemes</span>.
              </p>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Scheme Cards */}
          <div className="flex flex-col gap-4">
            {filteredSchemes.map((scheme, i) => (
              <SchemeCard key={i} {...scheme} />
            ))}
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false)
              setConversationStep(0)
              setAnswers({})
              setSearchQuery("")
            }}
            className="w-full mt-6 text-foreground"
          >
            <ArrowRight size={16} className="mr-2 rotate-180" />
            Start Over
          </Button>
        </div>
      )}
    </div>
  )
}
