"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Sprout,
    Camera,
    ShoppingBag,
    Users,
    FileText,
    TrendingUp,
    ArrowRight,
    Loader2,
    AlertCircle,
    ShieldCheck,
    Activity,
    CalendarDays,
    MapPin,
    AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { WeatherWidget } from "@/components/features/dashboard/weather-widget"

interface DashboardData {
    marketPrices: { crop: string; avgPrice: number; unit: string; listingCount: number }[]
    userListings: { id: string; cropName: string; quantity: string; unit: string; pricePerUnit: number; status: string; createdAt: string }[]
    diseaseReports: { id: string; cropName: string; disease: string; severity: string; confidence: number; createdAt: string }[]
    profile: { name: string | null; crops: string[]; landSizeAcres: number | null; state: string | null; onboarded: boolean } | null
    stats: { activeListings: number; totalDiseaseChecks: number }
}

interface NearbyAlert {
    disease: string
    cropName: string
    reportCount: number
    severity: string
    states: string[]
    isNearby: boolean
    isRelevantCrop: boolean
    latestDate: string
}

const quickActions = [
    { href: "/assistant", icon: Sprout, labelKey: "cropHelp", color: "bg-primary/10 text-primary" },
    { href: "/crop-health", icon: Activity, labelKey: "cropHealth", color: "bg-accent/10 text-accent" },
    { href: "/crop-calendar", icon: CalendarDays, labelKey: "cropCalendar", color: "bg-primary/10 text-primary" },
    { href: "/assistant", icon: Camera, labelKey: "diseaseCheck", color: "bg-accent/10 text-accent" },
    { href: "/post-produce", icon: ShoppingBag, labelKey: "sellProduce", color: "bg-primary/10 text-primary" },
    { href: "/schemes", icon: FileText, labelKey: "govSchemes", color: "bg-accent/10 text-accent" },
]

const severityColors: Record<string, string> = {
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function FarmerDashboard() {
    const { t } = useLanguage()
    const [data, setData] = useState<DashboardData | null>(null)
    const [nearbyAlerts, setNearbyAlerts] = useState<NearbyAlert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/dashboard-data")
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()

        // Fetch nearby alerts (community disease data)
        async function fetchAlerts() {
            try {
                const res = await fetch("/api/nearby-alerts")
                if (res.ok) {
                    const json = await res.json()
                    setNearbyAlerts(json.alerts || [])
                }
            } catch { /* ignore */ }
        }
        fetchAlerts()
    }, [])

    const greeting = data?.profile?.name
        ? `${t("dashboard")}, ${data.profile.name}!`
        : t("dashboard")

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
                    <p className="text-muted-foreground text-sm">
                        {data?.profile?.crops?.length
                            ? `🌾 ${data.profile.crops.join(", ")} • ${data.profile.landSizeAcres || "?"} acres${data.profile.state ? ` • ${data.profile.state}` : ""}`
                            : new Date().toLocaleDateString()}
                    </p>
                </div>
                {data?.profile && !data.profile.onboarded && (
                    <Link href="/onboarding">
                        <Button size="sm" variant="outline" className="text-xs">
                            Complete Profile <ArrowRight size={14} className="ml-1" />
                        </Button>
                    </Link>
                )}
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Crop Health Section */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="text-primary" size={20} />
                    {t("aiRecommendations")}
                </h2>

                {loading ? (
                    <Card>
                        <CardContent className="p-8 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </CardContent>
                    </Card>
                ) : data?.diseaseReports && data.diseaseReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.diseaseReports.slice(0, 4).map((report) => (
                            <Card key={report.id} className="border border-border hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex gap-4 items-start">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${report.severity === "high"
                                        ? "bg-destructive/20 text-destructive"
                                        : report.severity === "medium"
                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        }`}>
                                        {report.severity === "high" ? (
                                            <AlertCircle size={20} />
                                        ) : (
                                            <ShieldCheck size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-foreground text-sm truncate">{report.disease}</h3>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${severityColors[report.severity] || ""}`}>
                                                {report.severity}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {report.cropName} • {Math.round(report.confidence)}% confidence
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-2">
                        <CardContent className="p-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <ShieldCheck size={24} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">No crop health alerts</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Upload a crop photo or describe symptoms to get AI diagnosis
                            </p>
                            <Link href="/assistant">
                                <Button size="sm" variant="outline">
                                    <Camera size={14} className="mr-2" />
                                    Check Crop Health
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4">{t("home")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <Link href={action.href} key={action.labelKey} className="group">
                            <Card className="h-full border border-border hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} group-hover:scale-110 transition-transform`}>
                                        <action.icon size={24} />
                                    </div>
                                    <span className="font-medium text-sm text-foreground">{t(action.labelKey)}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Nearby Disease Alerts — Community Intelligence */}
            {nearbyAlerts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="text-red-500" size={20} />
                        Nearby Disease Alerts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {nearbyAlerts.slice(0, 4).map((alert, i) => (
                            <Card key={i} className={`border ${alert.isNearby || alert.isRelevantCrop
                                    ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                                    : "border-border"
                                }`}>
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${alert.severity === "high"
                                            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                            : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400"
                                        }`}>
                                        <AlertTriangle size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-sm text-foreground truncate">{alert.disease}</h3>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${severityColors[alert.severity] || ""}`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            🌿 {alert.cropName} • {alert.reportCount} report{alert.reportCount > 1 ? "s" : ""}
                                            {alert.states.length > 0 && ` • ${alert.states.slice(0, 2).join(", ")}`}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            {alert.isNearby && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    📍 Your State
                                                </span>
                                            )}
                                            {alert.isRelevantCrop && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                    🌾 Your Crop
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Market Prices */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">{t("market")}</h2>
                    <Link href="/marketplace" className="text-sm text-primary hover:underline">{t("viewAll")}</Link>
                </div>

                {loading ? (
                    <Card>
                        <CardContent className="p-8 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </CardContent>
                    </Card>
                ) : data?.marketPrices && data.marketPrices.length > 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            {data.marketPrices.map((item, i) => (
                                <div key={item.crop} className={`flex items-center justify-between p-4 ${i !== data.marketPrices.length - 1 ? 'border-b border-border' : ''}`}>
                                    <div>
                                        <div className="font-medium text-foreground">{item.crop}</div>
                                        <div className="text-xs text-muted-foreground">{item.listingCount} listings</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-foreground">₹{item.avgPrice}/{item.unit}</span>
                                        <TrendingUp size={16} className="text-green-500" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed border-2">
                        <CardContent className="p-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                                <ShoppingBag size={24} className="text-accent" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">No market prices yet</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Be the first to list your produce and set the price
                            </p>
                            <Link href="/post-produce">
                                <Button size="sm" variant="outline">
                                    <ShoppingBag size={14} className="mr-2" />
                                    List Your Produce
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
