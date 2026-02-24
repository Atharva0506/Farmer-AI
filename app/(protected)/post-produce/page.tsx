"use client"

import { useState, useCallback } from "react"
import {
  Sprout,
  Scale,
  MapPin,
  IndianRupee,
  Camera,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Mic,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { useGeolocation } from "@/hooks/use-geolocation"
import { toast } from "sonner"

const crops = [
  { name: "Tomato", nameLocal: "टमाटर" },
  { name: "Onion", nameLocal: "कांदा" },
  { name: "Wheat", nameLocal: "गहू" },
  { name: "Rice", nameLocal: "तांदूळ" },
  { name: "Soybean", nameLocal: "सोयाबीन" },
  { name: "Cotton", nameLocal: "कापूस" },
  { name: "Sugarcane", nameLocal: "ऊस" },
  { name: "Grapes", nameLocal: "द्राक्षे" },
]

const quantities = ["100 kg", "250 kg", "500 kg", "1000 kg", "5 quintal", "10 quintal", "50 quintal"]

export default function PostProducePage() {
  const [step, setStep] = useState(0)
  const [selectedCrop, setSelectedCrop] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { t } = useLanguage()
  const { latitude, longitude } = useGeolocation()

  const totalSteps = 4

  // Parse quantity into number + unit
  const parseQuantity = useCallback((q: string) => {
    const match = q.match(/^([\d,]+)\s*(.+)$/)
    if (!match) return { value: q, unit: "kg" }
    return { value: match[1].replace(",", ""), unit: match[2].trim() }
  }, [])

  // Parse price string to number
  const parsePrice = useCallback((p: string) => {
    const num = p.replace(/[^\d.]/g, "")
    return parseFloat(num) || 0
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const parsed = parseQuantity(selectedQuantity)
      const priceNum = parsePrice(price)

      const body: Record<string, any> = {
        cropName: selectedCrop,
        quantity: parsed.value,
        unit: parsed.unit,
        pricePerUnit: priceNum,
      }

      if (latitude !== null && longitude !== null) {
        body.location = { lat: latitude, lng: longitude }
      }

      // TODO: Upload image to cloud storage and pass URL
      // For now, we skip imageUrl if no upload service is configured

      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to post listing")
      }

      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to post listing. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="px-4 py-5 md:px-6 lg:px-8 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("done")}!</h1>
            <p className="text-muted-foreground mt-2">
              Your produce has been listed. Buyers will be able to find and contact you.
            </p>
          </div>
          <div className="w-full">
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("cropName")}</span>
                    <span className="font-medium text-foreground">{selectedCrop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("quantity")}</span>
                    <span className="font-medium text-foreground">{selectedQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("price")}</span>
                    <span className="font-medium text-foreground">{price || "Market Rate"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Button
            onClick={() => {
              setSubmitted(false)
              setStep(0)
              setSelectedCrop("")
              setSelectedQuantity("")
              setPrice("")
              setImageFile(null)
              setImagePreview(null)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Post Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-1">{t("postProduce")}</h1>
      <p className="text-sm text-muted-foreground mb-6">Step {step + 1} of {totalSteps}</p>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step 1: Select Crop */}
      {step === 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sprout size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t("cropName")}</h2>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 transition-colors">
              <Mic size={16} className="text-primary" />
              Voice input
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {crops.map((crop) => (
              <button
                key={crop.name}
                onClick={() => setSelectedCrop(crop.name)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  selectedCrop === crop.name
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <Sprout size={24} className={selectedCrop === crop.name ? "text-primary" : "text-muted-foreground"} />
                <div className="text-center">
                  <p className="font-semibold text-foreground text-sm">{crop.nameLocal}</p>
                  <p className="text-xs text-muted-foreground">{crop.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Quantity */}
      {step === 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Scale size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t("quantity")}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {quantities.map((qty) => (
              <button
                key={qty}
                onClick={() => setSelectedQuantity(qty)}
                className={cn(
                  "rounded-xl border-2 px-5 py-3 text-sm font-medium transition-all",
                  selectedQuantity === qty
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Price & Location */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t("price")}</h2>
            </div>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. Rs 28/kg"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-2">AI suggests: Rs 25-30/kg based on market rates</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">{t("location")}</h2>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              {latitude !== null && longitude !== null
                ? `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : "Detecting location..."}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Photo */}
      {step === 3 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Camera size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t("uploadImage")}</h2>
          </div>
          <Card className="border-2 border-dashed border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => document.getElementById('produce-file-upload')?.click()}>
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Camera size={32} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {selectedQuantity ? `Photo of ${selectedCrop} (${selectedQuantity})` : "Take or upload a photo of your produce"}
              </p>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-40 object-cover rounded-lg"
                  onLoad={() => URL.revokeObjectURL(imagePreview)}
                />
              )}

              <input
                id="produce-file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    const url = URL.createObjectURL(file)
                    setImagePreview(url)
                    toast.success(`Selected: ${file.name}`)
                  }
                }}
              />

              <div className="flex gap-3">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); document.getElementById('produce-file-upload')?.click() }}>
                  <Camera size={16} className="mr-1" />
                  {t("takePhoto")}
                </Button>
                <Button variant="outline" className="text-foreground bg-transparent" onClick={(e) => { e.stopPropagation(); document.getElementById('produce-file-upload')?.click() }}>
                  {t("upload")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep(step - 1)}
            className="flex-1 h-14 text-foreground"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t("back")}
          </Button>
        )}
        <Button
          size="lg"
          onClick={() => {
            if (step < totalSteps - 1) setStep(step + 1)
            else handleSubmit()
          }}
          className="flex-1 h-14 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={(step === 0 && !selectedCrop) || isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 size={18} className="mr-2 animate-spin" /> Posting...</>
          ) : step === totalSteps - 1 ? t("submit") : t("next")}
          {!isSubmitting && step < totalSteps - 1 && <ArrowRight size={18} className="ml-2" />}
        </Button>
      </div>
    </div>
  )
}
