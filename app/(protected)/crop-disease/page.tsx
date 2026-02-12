"use client"

import { useState, useRef, useCallback } from "react"
import {
  Camera, Upload, AlertTriangle, Pill, Droplets, MapPin,
  Volume2, CheckCircle, Leaf, ShieldAlert,
  Clock, TrendingDown, Beaker, Sprout, ArrowLeft,
  Loader2, X, Mic, Share2, Bug
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import type { DiseaseReport } from "@/app/api/crop-disease/route"

type AnalysisStage = "upload" | "analyzing" | "result"

export default function CropDiseasePage() {
  const [stage, setStage] = useState<AnalysisStage>("upload")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [symptoms, setSymptoms] = useState("")
  const [cropName, setCropName] = useState("")
  const [report, setReport] = useState<DiseaseReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isListening, setIsListening] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { t, language } = useLanguage()

  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
    setError(null)
  }, [])

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-US"
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      setSymptoms((prev) => prev + (prev ? " " : "") + text)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleAnalyze = async () => {
    if (!selectedImage && !symptoms.trim()) {
      setError(t("diseaseUploadOrDescribe"))
      return
    }

    setStage("analyzing")
    setError(null)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(progressInterval); return 90 }
        return p + Math.random() * 15
      })
    }, 500)

    try {
      const formData = new FormData()
      if (selectedImage) formData.append("image", selectedImage)
      if (symptoms.trim()) formData.append("symptoms", symptoms)
      if (cropName.trim()) formData.append("cropName", cropName)
      formData.append("language", language)

      const res = await fetch("/api/crop-disease", { method: "POST", body: formData })
      const data = await res.json()

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Analysis failed")
      }

      setTimeout(() => {
        setReport(data.report)
        setStage("result")
      }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      setError(err.message || "Something went wrong")
      setStage("upload")
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-US"
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleReset = () => {
    setStage("upload")
    setSelectedImage(null)
    setImagePreview(null)
    setSymptoms("")
    setCropName("")
    setReport(null)
    setError(null)
    setProgress(0)
  }

  const handleShare = () => {
    if (!report) return
    const text = `${t("diagnosis")}: ${report.disease}\n${t("severity")}: ${report.severity}\n${report.description}\n\n${t("treatment")}:\n${report.treatment.map(tr => `- ${tr.name}: ${tr.dosage}`).join("\n")}`
    if (navigator.share) {
      navigator.share({ title: t("diseaseReport"), text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  const severityColors = {
    low: "bg-primary/15 text-primary border-primary/30",
    medium: "bg-warning/15 text-warning-foreground border-warning/30",
    high: "bg-destructive/15 text-destructive border-destructive/30",
  }

  const severityIcons = {
    low: <Leaf size={16} />,
    medium: <AlertTriangle size={16} />,
    high: <ShieldAlert size={16} />,
  }

  // ─── UPLOAD STAGE ──────────────────────────
  if (stage === "upload") {
    return (
      <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t("diseaseCheck")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("diseaseCheckSubtitle")}</p>

        <Card className="border-2 border-dashed border-border mb-4">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img src={imagePreview} alt="Crop" className="w-full rounded-xl object-cover max-h-64" />
                <button onClick={() => { setSelectedImage(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <Camera size={36} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground text-lg">{t("uploadImage")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("diseaseUploadHint")}</p>
                </div>
              </>
            )}
            <div className="flex gap-3 w-full max-w-xs">
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} />
              <Button onClick={() => cameraInputRef.current?.click()} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Camera size={18} className="mr-2" />{t("takePhoto")}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 text-foreground bg-transparent">
                <Upload size={18} className="mr-2" />{t("upload")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border mb-4">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-foreground mb-2 block">{t("cropName")} ({t("optional")})</label>
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={cropName} onChange={(e) => setCropName(e.target.value)}
                placeholder={t("cropNamePlaceholder")}
                className="flex-1 min-w-[180px] rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex gap-1 flex-wrap">
                {["Tomato", "Rice", "Wheat", "Cotton", "Potato"].map((crop) => (
                  <button key={crop} onClick={() => setCropName(crop)}
                    className={cn("px-3 py-1.5 text-xs rounded-full border transition-colors",
                      cropName === crop ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary")}>
                    {crop}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border mb-6">
          <CardContent className="p-4">
            <label className="text-sm font-medium text-foreground mb-2 block">{t("describeSymptoms")} ({t("optional")})</label>
            <div className="relative">
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                placeholder={t("symptomsPlaceholder")} rows={3}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              <button onClick={handleVoiceInput}
                className={cn("absolute bottom-3 right-3 p-2 rounded-full transition-colors",
                  isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20")}>
                <Mic size={16} />
              </button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <Button onClick={handleAnalyze} className="w-full h-14 text-lg rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          disabled={!selectedImage && !symptoms.trim()}>
          <Bug size={20} className="mr-2" />{t("analyzeDisease")}
        </Button>
      </div>
    )
  }

  // ─── ANALYZING STAGE ──────────────────────────
  if (stage === "analyzing") {
    return (
      <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto pb-24">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          {imagePreview && (
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/30">
              <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-primary animate-spin" />
            <h2 className="text-xl font-bold text-foreground">{t("analyzingCrop")}</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs">{t("analyzingHint")}</p>
          </div>
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center mt-2">{Math.round(progress)}%</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className={cn("flex items-center gap-2", progress > 20 && "text-primary")}>
              <CheckCircle size={14} /> {t("stepImageProcessing")}
            </div>
            <div className={cn("flex items-center gap-2", progress > 50 && "text-primary")}>
              <CheckCircle size={14} /> {t("stepDiseaseMatching")}
            </div>
            <div className={cn("flex items-center gap-2", progress > 80 && "text-primary")}>
              <CheckCircle size={14} /> {t("stepTreatmentPlan")}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── RESULT STAGE ──────────────────────────
  if (!report) return null

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleReset} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> {t("back")}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => speakText(`${report.disease}. ${report.description}`)} className="text-primary">
            <Volume2 size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-primary">
            <Share2 size={18} />
          </Button>
        </div>
      </div>

      {/* Disease Header */}
      <Card className="border border-border mb-4 overflow-hidden">
        <div className={cn("h-1.5 w-full", report.severity === "low" ? "bg-primary" : report.severity === "medium" ? "bg-warning" : "bg-destructive")} />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {imagePreview && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
                <img src={imagePreview} alt="Crop" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Bug size={18} className="text-destructive" />
                <h2 className="font-bold text-lg text-foreground">{report.disease}</h2>
              </div>
              <p className="text-xs text-muted-foreground italic mb-2">{report.scientificName}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("confidence")}</p>
              <div className="flex items-center justify-center gap-1.5">
                <Progress value={report.confidence} className="h-1.5 w-12" />
                <span className="text-sm font-bold text-primary">{report.confidence}%</span>
              </div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("severity")}</p>
              <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold", severityColors[report.severity])}>
                {severityIcons[report.severity]} {t(report.severity)}
              </span>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("crop")}</p>
              <span className="text-sm font-bold text-foreground">{report.affectedCrop}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10"><AlertTriangle size={16} className="text-destructive" /></div>
            <h3 className="font-bold text-foreground">{t("symptoms")}</h3>
            <Button variant="ghost" size="sm" className="ml-auto text-primary" onClick={() => speakText(report.symptoms.join(". "))}><Volume2 size={14} /></Button>
          </div>
          <ul className="flex flex-col gap-2">
            {report.symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <ShieldAlert size={14} className="text-destructive shrink-0 mt-0.5" /> {s}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Treatment */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Pill size={16} className="text-primary" /></div>
            <h3 className="font-bold text-foreground">{t("treatment")}</h3>
            <Button variant="ghost" size="sm" className="ml-auto text-primary"
              onClick={() => speakText(report.treatment.map(tr => `${tr.name}. ${tr.dosage}`).join(". "))}><Volume2 size={14} /></Button>
          </div>
          <div className="flex flex-col gap-3">
            {report.treatment.map((tr, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                  tr.type === "chemical" ? "bg-accent/10 text-accent" : tr.type === "organic" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground")}>
                  {tr.type === "chemical" ? <Beaker size={14} /> : tr.type === "organic" ? <Leaf size={14} /> : <Sprout size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">{tr.name}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      tr.type === "chemical" ? "bg-accent/10 text-accent" : tr.type === "organic" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning-foreground")}>
                      {tr.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tr.dosage}</p>
                  <p className="text-xs font-medium text-primary mt-1">₹ {tr.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fertilizer */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10"><Droplets size={16} className="text-accent" /></div>
            <h3 className="font-bold text-foreground">{t("fertilizer")}</h3>
          </div>
          <div className="flex flex-col gap-2">
            {report.fertilizer.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground p-2 rounded-lg bg-muted/20">
                <CheckCircle size={14} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{f.name}</span>
                  <span className="text-muted-foreground"> – {f.dosage}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.timing}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preventive Measures */}
      <Card className="border border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><ShieldAlert size={16} className="text-primary" /></div>
            <h3 className="font-bold text-foreground">{t("preventiveMeasures")}</h3>
          </div>
          <ul className="flex flex-col gap-2">
            {report.preventiveMeasures.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" /> {m}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Impact & Recovery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-destructive" /><h3 className="font-bold text-foreground text-sm">{t("estimatedLoss")}</h3></div>
            <p className="text-lg font-bold text-destructive">{report.estimatedLoss}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-primary" /><h3 className="font-bold text-foreground text-sm">{t("recoveryTime")}</h3></div>
            <p className="text-lg font-bold text-primary">{report.recoveryTime}</p>
          </CardContent>
        </Card>
      </div>

      {/* Nearby Resources */}
      {report.nearbyResources.length > 0 && (
        <Card className="border border-border mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><MapPin size={16} className="text-primary" /></div>
              <h3 className="font-bold text-foreground">{t("nearbyResources")}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {report.nearbyResources.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    r.type === "store" ? "bg-primary/10 text-primary" : r.type === "expert" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning-foreground")}>
                    {r.type}
                  </span>
                  <span className="text-sm text-foreground">{r.suggestion}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 text-foreground">
          <Camera size={18} className="mr-2" />{t("checkAnother")}
        </Button>
        <Button onClick={() => window.location.href = "/assistant"} className="flex-1 bg-primary text-primary-foreground">
          <Sprout size={18} className="mr-2" />{t("askAI")}
        </Button>
      </div>
    </div>
  )
}
