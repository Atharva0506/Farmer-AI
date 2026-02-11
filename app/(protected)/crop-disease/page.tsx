"use client"

import { useState } from "react"
import {
  Camera,
  Upload,
  AlertTriangle,
  Pill,
  Droplets,
  MapPin,
  IndianRupee,
  Volume2,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VoiceInputButton } from "@/components/voice-input-button"
import { useLanguage } from "@/lib/language-context"

interface DiagnosisResult {
  disease: string
  confidence: number
  severity: "low" | "medium" | "high"
  description: string
  treatment: string[]
  fertilizer: string[]
  nearestStore: { name: string; distance: string }
  estimatedCost: string
}

const mockDiagnosis: DiagnosisResult = {
  disease: "Late Blight (Phytophthora infestans)",
  confidence: 92,
  severity: "high",
  description:
    "Late blight is a devastating disease that affects tomato and potato crops. Characterized by water-soaked lesions on leaves that turn brown and papery.",
  treatment: [
    "Apply Mancozeb 75% WP at 2g/L",
    "Spray Copper Oxychloride at 3g/L",
    "Remove and destroy infected leaves",
    "Improve air circulation between plants",
  ],
  fertilizer: [
    "NPK 19:19:19 - 5g/L foliar spray",
    "Potash - 50kg/acre",
    "Micronutrients zinc + boron mix",
  ],
  nearestStore: { name: "Krishna Agro Store", distance: "3.2 km" },
  estimatedCost: "Rs 800 - Rs 1,200 per acre",
}

export default function CropDiseasePage() {
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { t } = useLanguage()

  const handleUpload = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      setShowDiagnosis(true)
    }, 2000)
  }

  const severityColors = {
    low: "bg-primary/15 text-primary border-primary/30",
    medium: "text-accent bg-accent/15 border-accent/30",
    high: "bg-destructive/15 text-destructive border-destructive/30",
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-1">{t("diseaseCheck")}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("uploadImage")}</p>

      {/* Upload Area */}
      {!showDiagnosis && (
        <Card className="border-2 border-dashed border-border mb-6">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Camera size={36} className="text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">{t("uploadImage")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Take a photo or select from gallery
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <Button
                onClick={handleUpload}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={uploading}
              >
                <Camera size={18} className="mr-2" />
                {t("takePhoto")}
              </Button>
              <Button
                onClick={handleUpload}
                variant="outline"
                className="flex-1 text-foreground bg-transparent"
                disabled={uploading}
              >
                <Upload size={18} className="mr-2" />
                {t("upload")}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Or describe using voice</span>
              <VoiceInputButton size="sm" onResult={() => handleUpload()} />
            </div>
            {uploading && (
              <div className="w-full max-w-xs">
                <Progress value={65} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-2">Analyzing image...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Result */}
      {showDiagnosis && (
        <div className="flex flex-col gap-4">
          {/* Main Diagnosis Card */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-destructive" />
                  <h2 className="font-bold text-foreground text-lg">{t("diagnosis")}</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-primary" aria-label="Listen to diagnosis">
                  <Volume2 size={18} />
                </Button>
              </div>

              <h3 className="font-bold text-xl text-foreground mb-2">{mockDiagnosis.disease}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {mockDiagnosis.description}
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("confidence")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={mockDiagnosis.confidence} className="h-2 w-24" />
                    <span className="text-sm font-bold text-primary">{mockDiagnosis.confidence}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("severity")}</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold mt-1 ${severityColors[mockDiagnosis.severity]}`}
                  >
                    {t(mockDiagnosis.severity)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Treatment */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Pill size={16} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">{t("treatment")}</h3>
                </div>
                <ul className="flex flex-col gap-2">
                  {mockDiagnosis.treatment.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Fertilizer */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <Droplets size={16} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground">{t("fertilizer")}</h3>
                </div>
                <ul className="flex flex-col gap-2">
                  {mockDiagnosis.fertilizer.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle size={14} className="text-accent shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Nearest Store */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">{t("nearestStore")}</h3>
                </div>
                <p className="font-semibold text-foreground">{mockDiagnosis.nearestStore.name}</p>
                <p className="text-sm text-muted-foreground">{mockDiagnosis.nearestStore.distance}</p>
                <Button size="sm" className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90">
                  <MapPin size={14} className="mr-1" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <IndianRupee size={16} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground">{t("costEstimate")}</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{mockDiagnosis.estimatedCost}</p>
                <p className="text-sm text-muted-foreground mt-1">Total treatment cost per acre</p>
              </CardContent>
            </Card>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={() => setShowDiagnosis(false)}
            className="mt-2 text-foreground"
          >
            <Camera size={18} className="mr-2" />
            Check Another Crop
          </Button>
        </div>
      )}
    </div>
  )
}
