"use client"

import { useState } from "react"
import Link from "next/link"
import {
    FileCheck,
    Loader2,
    CheckCircle2,
    Circle,
    ArrowRight,
    Phone,
    MapPin,
    Calendar,
    ExternalLink,
    FileText,
    Building2,
    AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface DocumentItem {
    document: string
    details: string
    available: boolean
    tip: string
}

interface ApplicationStep {
    step: number
    title: string
    description: string
    mode: "online" | "offline" | "both"
    link?: string
}

interface SchemeData {
    schemeName: string
    schemeCategory: string
    overview: string
    eligibility: string[]
    benefits: string[]
    requiredDocuments: DocumentItem[]
    preFilledInfo: {
        name: string
        phone: string
        crops: string
        landSize: string
        state: string
        additionalFields: { field: string; value: string; source: string }[]
    }
    applicationSteps: ApplicationStep[]
    importantDates: { event: string; date: string; isDeadline: boolean }[]
    nearestOffice: {
        name: string
        type: string
        suggestedOffice: string
    }
}

const POPULAR_SCHEMES = [
    "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    "Kisan Credit Card (KCC)",
    "Soil Health Card Scheme",
    "Pradhan Mantri Krishi Sinchai Yojana",
    "National Mission on Sustainable Agriculture",
]

export default function SchemeApplyPage() {
    const { language } = useLanguage()
    const [schemeName, setSchemeName] = useState("")
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<SchemeData | null>(null)
    const [error, setError] = useState("")

    const handleGenerate = async (name?: string) => {
        const scheme = name || schemeName
        if (!scheme) return
        setSchemeName(scheme)
        setLoading(true)
        setError("")
        setData(null)

        try {
            const res = await fetch("/api/scheme-apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schemeName: scheme, language }),
            })
            if (!res.ok) throw new Error("Failed")
            const json = await res.json()
            setData(json.application)
        } catch {
            setError("Failed to generate application guide. Try the AI assistant instead.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-4xl mx-auto pb-24">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileCheck className="text-primary" size={24} />
                    {language === "mr" ? "योजना अर्ज सहाय्यक" : language === "hi" ? "योजना आवेदन सहायक" : "Scheme Application Assistant"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {language === "mr" ? "AI तुमचा अर्ज तयार करेल" : language === "hi" ? "AI आपका आवेदन तैयार करेगा" : "AI prepares your application with pre-filled data"}
                </p>
            </div>

            {/* Input */}
            {!data && (
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                {language === "mr" ? "योजनेचे नाव" : language === "hi" ? "योजना का नाम" : "Scheme Name"}
                            </label>
                            <input
                                type="text"
                                value={schemeName}
                                onChange={(e) => setSchemeName(e.target.value)}
                                placeholder="e.g. PM-KISAN, Fasal Bima Yojana"
                                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
                            />
                            <Button onClick={() => handleGenerate()} disabled={!schemeName || loading} className="w-full h-12">
                                {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</> : <><FileCheck size={16} className="mr-2" /> Generate Application Guide</>}
                            </Button>
                            {error && <p className="text-sm text-destructive text-center mt-3">{error}</p>}
                        </CardContent>
                    </Card>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Popular Schemes</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {POPULAR_SCHEMES.map((scheme) => (
                                <button
                                    key={scheme}
                                    onClick={() => handleGenerate(scheme)}
                                    disabled={loading}
                                    className="text-left p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-foreground"
                                >
                                    📋 {scheme}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {data && (
                <div className="space-y-6">
                    {/* Header */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold text-foreground">{data.schemeName}</h2>
                                <Button size="sm" variant="ghost" onClick={() => setData(null)}>New Scheme</Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{data.overview}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {data.benefits.slice(0, 3).map((b, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                        ✅ {b}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Important Dates */}
                    {data.importantDates.length > 0 && (
                        <div className="space-y-2">
                            {data.importantDates.filter(d => d.isDeadline).map((d, i) => (
                                <div key={i} className="p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 text-sm flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                    <span className="font-medium text-red-700 dark:text-red-400">{d.event}: {d.date}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Document Checklist */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                Document Checklist
                                <span className="text-xs font-normal text-muted-foreground ml-auto">
                                    {data.requiredDocuments.filter(d => d.available).length}/{data.requiredDocuments.length} ready
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {data.requiredDocuments.map((doc, i) => (
                                <div key={i} className={cn(
                                    "p-3 rounded-xl border flex gap-3",
                                    doc.available
                                        ? "border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-800"
                                        : "border-border bg-card"
                                )}>
                                    {doc.available ? (
                                        <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                        <div className="font-medium text-sm text-foreground">{doc.document}</div>
                                        <div className="text-xs text-muted-foreground">{doc.details}</div>
                                        {!doc.available && (
                                            <div className="text-xs text-primary mt-1">💡 {doc.tip}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Pre-Filled Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Your Pre-Filled Info</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Name</div>
                                    <div className="text-sm font-medium text-foreground">{data.preFilledInfo.name}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Phone</div>
                                    <div className="text-sm font-medium text-foreground">{data.preFilledInfo.phone}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Crops</div>
                                    <div className="text-sm font-medium text-foreground">{data.preFilledInfo.crops}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/50">
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Land</div>
                                    <div className="text-sm font-medium text-foreground">{data.preFilledInfo.landSize}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Application Steps */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Application Steps</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {data.applicationSteps.map((step) => (
                                <div key={step.step} className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                                        {step.step}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-foreground">{step.title}</div>
                                        <div className="text-xs text-muted-foreground">{step.description}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-[10px] px-2 py-0.5 rounded-full font-medium",
                                                step.mode === "online" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : step.mode === "offline" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                            )}>
                                                {step.mode === "online" ? "🌐 Online" : step.mode === "offline" ? "🏢 Offline" : "🔄 Both"}
                                            </span>
                                            {step.link && (
                                                <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                    <ExternalLink size={10} /> Visit Portal
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Nearest Office */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Building2 size={20} className="text-primary shrink-0 mt-1" />
                            <div>
                                <div className="font-medium text-sm text-foreground">{data.nearestOffice.name}</div>
                                <div className="text-xs text-muted-foreground">{data.nearestOffice.type}</div>
                                <div className="text-xs text-primary mt-1">{data.nearestOffice.suggestedOffice}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <Card className="border-dashed border-2">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                Need more help? Ask the AI assistant for specific questions.
                            </p>
                            <Link href="/assistant">
                                <Button size="sm" variant="outline">
                                    Ask AI Assistant <ArrowRight size={14} className="ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
