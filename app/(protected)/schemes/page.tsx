"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, MessageCircle, ArrowRight, Volume2, Loader2, Send, Mic, MicOff, Bot, Sparkles, ExternalLink, FileCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { VoiceInputButton } from "@/components/features/assistant/voice-input-button"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface Scheme {
  name: string
  type: string
  category: string
  benefit: string
  description: string
  howToApply: string
  documents: string[]
  deadline: string
  website: string
  matchScore: number
}

interface ConversationStep {
  questionKey: string
  question: Record<string, string>
  options: { label: Record<string, string>; value: string }[]
  answerKey: string
}

const conversationSteps: ConversationStep[] = [
  {
    questionKey: "incomeQuestion",
    question: { en: "What is your annual income?", hi: "आपकी वार्षिक आय क्या है?", mr: "तुमचे वार्षिक उत्पन्न किती आहे?" },
    options: [
      { label: { en: "Below ₹1 Lakh", hi: "₹1 लाख से कम", mr: "₹1 लाखापेक्षा कमी" }, value: "Below 1 Lakh" },
      { label: { en: "₹1-3 Lakh", hi: "₹1-3 लाख", mr: "₹1-3 लाख" }, value: "1-3 Lakh" },
      { label: { en: "₹3-5 Lakh", hi: "₹3-5 लाख", mr: "₹3-5 लाख" }, value: "3-5 Lakh" },
      { label: { en: "Above ₹5 Lakh", hi: "₹5 लाख से ऊपर", mr: "₹5 लाखापेक्षा जास्त" }, value: "Above 5 Lakh" },
    ],
    answerKey: "income",
  },
  {
    questionKey: "landQuestion",
    question: { en: "How much land do you own?", hi: "आपके पास कितनी ज़मीन है?", mr: "तुमच्याकडे किती जमीन आहे?" },
    options: [
      { label: { en: "Below 1 acre", hi: "1 एकड़ से कम", mr: "1 एकरापेक्षा कमी" }, value: "Below 1 acre" },
      { label: { en: "1-5 acres", hi: "1-5 एकड़", mr: "1-5 एकर" }, value: "1-5 acres" },
      { label: { en: "5-10 acres", hi: "5-10 एकड़", mr: "5-10 एकर" }, value: "5-10 acres" },
      { label: { en: "Above 10 acres", hi: "10 एकड़ से ऊपर", mr: "10 एकरांपेक्षा जास्त" }, value: "Above 10 acres" },
    ],
    answerKey: "landSize",
  },
  {
    questionKey: "cropQuestion",
    question: { en: "What is your main crop?", hi: "आपकी मुख्य फसल क्या है?", mr: "तुमचे मुख्य पीक कोणते?" },
    options: [
      { label: { en: "Wheat / Rice", hi: "गेहूं / चावल", mr: "गहू / भात" }, value: "Wheat / Rice" },
      { label: { en: "Vegetables", hi: "सब्ज़ियां", mr: "भाजीपाला" }, value: "Vegetables" },
      { label: { en: "Fruits", hi: "फल", mr: "फळे" }, value: "Fruits" },
      { label: { en: "Cotton / Sugarcane", hi: "कपास / गन्ना", mr: "कापूस / ऊस" }, value: "Cash Crops" },
    ],
    answerKey: "crop",
  },
  {
    questionKey: "stateQuestion",
    question: { en: "Which state are you from?", hi: "आप किस राज्य से हैं?", mr: "तुम्ही कोणत्या राज्यातून आहात?" },
    options: [
      { label: { en: "Maharashtra", hi: "महाराष्ट्र", mr: "महाराष्ट्र" }, value: "Maharashtra" },
      { label: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश", mr: "उत्तर प्रदेश" }, value: "Uttar Pradesh" },
      { label: { en: "Madhya Pradesh", hi: "मध्य प्रदेश", mr: "मध्य प्रदेश" }, value: "Madhya Pradesh" },
      { label: { en: "Other", hi: "अन्य", mr: "इतर" }, value: "Other" },
    ],
    answerKey: "state",
  },
]

export default function SchemesPage() {
  const [conversationStep, setConversationStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null)

  // AI Q&A
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const { t, language } = useLanguage()
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversationStep, schemes, aiAnswer])

  const handleAnswer = async (answer: string) => {
    const currentStep = conversationSteps[conversationStep]
    const newAnswers = { ...answers, [currentStep.answerKey]: answer }
    setAnswers(newAnswers)

    if (conversationStep < conversationSteps.length - 1) {
      setConversationStep(conversationStep + 1)
    } else {
      // Final step — fetch schemes from API
      setLoading(true)
      try {
        const res = await fetch("/api/schemes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newAnswers, language }),
        })
        const data = await res.json()
        if (data.success) {
          setSchemes(data.schemes)
        }
      } catch (err) {
        console.error("Failed to fetch schemes:", err)
      } finally {
        setLoading(false)
        setShowResults(true)
      }
    }
  }

  const askAIAboutSchemes = async () => {
    if (!aiQuestion.trim()) return
    setAiLoading(true)
    setAiAnswer("")

    try {
      const res = await fetch("/api/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, language, question: aiQuestion }),
      })

      if (!res.ok) throw new Error("Failed to get AI response")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let result = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += decoder.decode(value, { stream: true })
          setAiAnswer(result)
        }
      }
    } catch (err) {
      console.error("AI Q&A error:", err)
      setAiAnswer("Sorry, something went wrong. Please try again.")
    } finally {
      setAiLoading(false)
      setAiQuestion("")
    }
  }

  const filteredSchemes = schemes.filter(
    (s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.includes(searchQuery.toLowerCase())
  )

  const categoryColors: Record<string, string> = {
    income_support: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    insurance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    credit: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    soil_health: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    irrigation: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    market: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    organic: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    mechanization: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    micro_enterprise: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    horticulture: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
    innovation: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  }

  const categoryLabels: Record<string, Record<string, string>> = {
    income_support: { en: "Income Support", hi: "आय सहायता", mr: "उत्पन्न सहाय्य" },
    insurance: { en: "Insurance", hi: "बीमा", mr: "विमा" },
    credit: { en: "Credit", hi: "ऋण", mr: "कर्ज" },
    soil_health: { en: "Soil Health", hi: "मृदा स्वास्थ्य", mr: "मृदा आरोग्य" },
    irrigation: { en: "Irrigation", hi: "सिंचाई", mr: "सिंचन" },
    market: { en: "Market", hi: "बाजार", mr: "बाजार" },
    organic: { en: "Organic", hi: "जैविक", mr: "सेंद्रिय" },
    mechanization: { en: "Mechanization", hi: "मशीनीकरण", mr: "यंत्रीकरण" },
    micro_enterprise: { en: "Enterprise", hi: "उद्यम", mr: "उद्योग" },
    horticulture: { en: "Horticulture", hi: "बागवानी", mr: "फलोत्पादन" },
    innovation: { en: "Innovation", hi: "नवाचार", mr: "नवोपक्रम" },
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("schemesFinder")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === "mr" ? "तुमच्या प्रोफाइलनुसार योजना शोधा" : language === "hi" ? "अपनी प्रोफ़ाइल के अनुसार योजनाएं खोजें" : "Find schemes that match your profile"}
          </p>
        </div>
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
                  {step.question[language] || step.question.en}
                </div>
                <div className="self-end bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-2.5 text-sm">
                  {answers[step.answerKey]}
                </div>
              </div>
            ))}
          </div>

          {/* Current question */}
          {conversationStep < conversationSteps.length && (
            <Card className="border border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={18} className="text-primary" />
                  <p className="font-semibold text-foreground">
                    {conversationSteps[conversationStep]?.question[language] || conversationSteps[conversationStep]?.question.en}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {conversationSteps[conversationStep]?.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      {option.label[language] || option.label.en}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs text-muted-foreground">
                    {language === "mr" ? "किंवा आवाजाने उत्तर द्या" : language === "hi" ? "या आवाज़ से जवाब दें" : "Or answer with voice"}
                  </span>
                  <VoiceInputButton size="sm" onResult={(text) => handleAnswer(text)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {language === "mr" ? "योजना शोधत आहे..." : language === "hi" ? "योजनाएं खोज रहे हैं..." : "Finding matching schemes..."}
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {conversationSteps.map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= conversationStep ? "bg-primary" : "bg-muted")} />
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
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-primary" />
                <span className="font-semibold text-sm text-foreground">
                  {language === "mr" ? "AI विश्लेषण" : language === "hi" ? "AI विश्लेषण" : "AI Analysis"}
                </span>
              </div>
              <p className="text-sm text-foreground">
                {language === "mr"
                  ? `तुमच्या प्रोफाइलनुसार (${answers.income}, ${answers.landSize}, ${answers.crop}), आम्हाला `
                  : language === "hi"
                    ? `आपकी प्रोफ़ाइल (${answers.income}, ${answers.landSize}, ${answers.crop}) के अनुसार, हमें `
                    : `Based on your profile (${answers.income}, ${answers.landSize}, ${answers.crop}), we found `}
                <span className="font-bold text-primary">{filteredSchemes.length} {language === "mr" ? "जुळणाऱ्या योजना" : language === "hi" ? "मिलती-जुलती योजनाएं" : "matching schemes"}</span>
                {language === "en" ? "." : " " + (language === "mr" ? "सापडल्या." : "मिलीं।")}
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
              <Card key={i} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <FileCheck size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-foreground text-base leading-snug">{scheme.name}</h3>
                        <span className="shrink-0 inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-bold">
                          {scheme.matchScore}%
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1.5">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColors[scheme.category] || "bg-muted text-muted-foreground")}>
                          {categoryLabels[scheme.category]?.[language] || scheme.category}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {scheme.type === "central" ? (language === "mr" ? "केंद्र" : language === "hi" ? "केंद्र" : "Central") : (language === "mr" ? "राज्य" : language === "hi" ? "राज्य" : "State")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{scheme.description}</p>
                      <div className="mt-2 text-xs">
                        <span className="font-medium text-foreground">{language === "mr" ? "लाभ" : language === "hi" ? "लाभ" : "Benefit"}: </span>
                        <span className="text-primary font-medium">{scheme.benefit}</span>
                      </div>

                      {/* Expandable details */}
                      {expandedScheme === i && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="text-xs">
                            <span className="font-medium text-foreground">{language === "mr" ? "अर्ज कसा करावा" : language === "hi" ? "आवेदन कैसे करें" : "How to Apply"}: </span>
                            <span className="text-muted-foreground">{scheme.howToApply}</span>
                          </div>
                          <div className="text-xs">
                            <span className="font-medium text-foreground">{language === "mr" ? "आवश्यक कागदपत्रे" : language === "hi" ? "आवश्यक दस्तावेज़" : "Documents"}: </span>
                            <span className="text-muted-foreground">{scheme.documents.join(", ")}</span>
                          </div>
                          {scheme.deadline && (
                            <div className="text-xs">
                              <span className="font-medium text-foreground">{language === "mr" ? "अंतिम तारीख" : language === "hi" ? "अंतिम तिथि" : "Deadline"}: </span>
                              <span className="text-accent font-medium">{scheme.deadline}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <a href={scheme.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} className="mr-1" />
                        {t("apply")}
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" className="text-foreground bg-transparent" onClick={() => setExpandedScheme(expandedScheme === i ? null : i)}>
                      {expandedScheme === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span className="ml-1 text-xs">{language === "mr" ? "तपशील" : language === "hi" ? "विवरण" : "Details"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* AI Q&A Section */}
          <Card className="mt-6 border border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground text-sm">
                  {language === "mr" ? "योजनांबद्दल AI ला विचारा" : language === "hi" ? "योजनाओं के बारे में AI से पूछें" : "Ask AI about Schemes"}
                </h3>
              </div>

              {aiAnswer && (
                <div className="bg-muted/50 rounded-xl p-3 mb-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {aiAnswer}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder={
                    language === "mr" ? "उदा: PM-KISAN साठी मला पात्रता आहे का?" :
                    language === "hi" ? "उदा: क्या मैं PM-KISAN के लिए पात्र हूं?" :
                    "e.g. Am I eligible for PM-KISAN?"
                  }
                  onKeyDown={(e) => { if (e.key === "Enter") askAIAboutSchemes() }}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={aiLoading}
                />
                <Button size="sm" onClick={askAIAboutSchemes} disabled={aiLoading || !aiQuestion.trim()} className="shrink-0">
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </Button>
              </div>

              {/* Quick AI questions */}
              {!aiAnswer && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    { en: "Which scheme gives most money?", hi: "कौन सी योजना सबसे ज्यादा पैसा देती है?", mr: "कोणती योजना सर्वात जास्त पैसे देते?" },
                    { en: "How to apply for crop insurance?", hi: "फसल बीमा के लिए कैसे आवेदन करें?", mr: "पीक विम्यासाठी अर्ज कसा करावा?" },
                    { en: "Documents needed for KCC?", hi: "KCC के लिए कौन से दस्तावेज़ चाहिए?", mr: "KCC साठी कोणती कागदपत्रे लागतात?" },
                  ].map((q, i) => (
                    <button key={i} onClick={() => { setAiQuestion(q[language] || q.en); }}
                      className="px-3 py-1.5 text-xs rounded-full border border-border bg-card text-foreground hover:border-primary hover:bg-primary/5 transition-colors">
                      {q[language] || q.en}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reset */}
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false)
              setConversationStep(0)
              setAnswers({})
              setSearchQuery("")
              setSchemes([])
              setAiAnswer("")
              setAiQuestion("")
              setExpandedScheme(null)
            }}
            className="w-full mt-6 text-foreground"
          >
            <ArrowRight size={16} className="mr-2 rotate-180" />
            {language === "mr" ? "पुन्हा सुरू करा" : language === "hi" ? "फिर से शुरू करें" : "Start Over"}
          </Button>

          <div ref={chatEndRef} className="h-4" />
        </div>
      )}
    </div>
  )
}
