"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Activity,
    ArrowRight,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    AlertCircle,
    Camera,
    TrendingDown,
    TrendingUp,
    Minus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

interface DiseaseReport {
    id: string
    cropName: string
    disease: string
    severity: string
    confidence: number
    treatments: string[]
    createdAt: string
}

const severityConfig: Record<string, { color: string; bg: string; icon: typeof AlertCircle }> = {
    low: { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: ShieldCheck },
    medium: { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", icon: AlertTriangle },
    high: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
}

export default function CropHealthPage() {
    const { t } = useLanguage()
    const [reports, setReports] = useState<DiseaseReport[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch("/api/disease-history")
                if (res.ok) {
                    const json = await res.json()
                    setReports(json.reports || [])
                }
            } catch (err) {
                console.error("Failed to fetch disease history:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    // Group reports by crop
    const cropGroups = reports.reduce((acc, r) => {
        if (!acc[r.cropName]) acc[r.cropName] = []
        acc[r.cropName].push(r)
        return acc
    }, {} as Record<string, DiseaseReport[]>)

    // Determine severity trend for each crop
    function getSeverityTrend(cropReports: DiseaseReport[]) {
        if (cropReports.length < 2) return "stable"
        const severityOrder = { low: 1, medium: 2, high: 3 }
        const latest = severityOrder[cropReports[0].severity as keyof typeof severityOrder] || 2
        const previous = severityOrder[cropReports[1].severity as keyof typeof severityOrder] || 2
        if (latest < previous) return "improving"
        if (latest > previous) return "worsening"
        return "stable"
    }

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Activity className="text-primary" size={24} />
                        Crop Health Timeline
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        AI-powered disease progression tracking
                    </p>
                </div>
                <Link href="/assistant">
                    <Button size="sm" className="gap-2">
                        <Camera size={14} />
                        New Scan
                    </Button>
                </Link>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="p-12 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            ) : reports.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="p-8 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={32} className="text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">No health reports yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload crop photos or describe symptoms in the AI assistant to start tracking crop health over time.
                        </p>
                        <Link href="/assistant">
                            <Button>
                                Start First Scan <ArrowRight size={14} className="ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl font-bold text-foreground">{reports.length}</div>
                                <div className="text-xs text-muted-foreground mt-1">Total Scans</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl font-bold text-foreground">{Object.keys(cropGroups).length}</div>
                                <div className="text-xs text-muted-foreground mt-1">Crops Monitored</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <div className="text-3xl font-bold text-red-500">
                                    {reports.filter(r => r.severity === "high").length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">High Severity</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Per-Crop Timelines */}
                    {Object.entries(cropGroups).map(([crop, cropReports]) => {
                        const trend = getSeverityTrend(cropReports)
                        return (
                            <Card key={crop}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-lg">🌿 {crop}</span>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${trend === "improving"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : trend === "worsening"
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-muted text-muted-foreground"
                                            }`}>
                                            {trend === "improving" && <><TrendingDown size={12} /> Improving</>}
                                            {trend === "worsening" && <><TrendingUp size={12} /> Worsening</>}
                                            {trend === "stable" && <><Minus size={12} /> Stable</>}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {/* Timeline */}
                                    <div className="relative pl-6 space-y-4">
                                        {/* Vertical line */}
                                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

                                        {cropReports.map((report, idx) => {
                                            const cfg = severityConfig[report.severity] || severityConfig.medium
                                            const SevIcon = cfg.icon
                                            const isLatest = idx === 0

                                            return (
                                                <div key={report.id} className="relative flex gap-3">
                                                    {/* Timeline dot */}
                                                    <div className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-background ${cfg.bg} flex items-center justify-center z-10 ${isLatest ? 'ring-2 ring-primary/30' : ''}`}>
                                                        <div className={`h-2 w-2 rounded-full ${cfg.color.includes('green') ? 'bg-green-500' : cfg.color.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className={`flex-1 p-3 rounded-xl border ${isLatest ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <SevIcon size={14} className={cfg.color} />
                                                                <span className="font-bold text-sm text-foreground">{report.disease}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                                {report.severity.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {Math.round(report.confidence)}% confidence •{" "}
                                                            {new Date(report.createdAt).toLocaleDateString("en-IN", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </div>
                                                        {isLatest && report.treatments && report.treatments.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-border">
                                                                <div className="text-xs font-medium text-foreground mb-1">Latest Treatment:</div>
                                                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                                                    {report.treatments.slice(0, 2).map((t, i) => (
                                                                        <li key={i} className="flex items-start gap-1">
                                                                            <span className="text-primary mt-0.5">→</span>
                                                                            <span>{typeof t === 'string' ? t : JSON.stringify(t)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
