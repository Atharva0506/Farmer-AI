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
    Cloud,
    Thermometer,
    Droplets,
    ArrowRight,
    MapPin,
    AlertTriangle,
    Lightbulb,
    Sun,
    CloudRain,
    Wind
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { WeatherWidget } from "@/components/features/dashboard/weather-widget"
// import { useSession } from "next-auth/react" // TODO: Enable when session is needed

const quickActions = [
    { href: "/assistant", icon: Sprout, labelKey: "cropHelp", color: "bg-primary/10 text-primary" },
    { href: "/assistant", icon: Camera, labelKey: "diseaseCheck", color: "bg-accent/10 text-accent" }, // Direct to assistant
    { href: "/post-produce", icon: ShoppingBag, labelKey: "sellProduce", color: "bg-primary/10 text-primary" },
    { href: "/marketplace", icon: Users, labelKey: "findBuyers", color: "bg-accent/10 text-accent" },
    { href: "/schemes", icon: FileText, labelKey: "govSchemes", color: "bg-primary/10 text-primary" },
]

export default function FarmerDashboard() {
    const { t } = useLanguage()
    // const { data: session } = useSession()

    // TODO: Replace with real weather data
    const [location, setLocation] = useState<{ city: string, temp: string, condition: string }>({
        city: "Pune, Maharashtra",
        temp: "28",
        condition: "Partly Cloudy"
    })

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                // In production, call a reverse geocoding API with position.coords
                setLocation({ city: "Nashik, MH (Detected)", temp: "30", condition: "Sunny" })
            }, (error) => {
                console.error("Error getting location:", error)
            })
        }
    }, [])

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t("dashboard")}</h1>
                    <p className="text-muted-foreground text-sm">Welcome back, Farmer</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{location.city}</div>
                    <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* AI Recommendations */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sprout className="text-primary" size={20} />
                    {t("aiRecommendations")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-destructive/10 border-destructive/20">
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-destructive mb-1">Pest Alert: Fall Armyworm</h3>
                                <p className="text-sm text-destructive/80 mb-3">High risk for Maize crops in your area due to recent humidity.</p>
                                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                                    View Remedies
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-success/10 border-success/20">
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-success-foreground dark:text-success mb-1">Price Trend: Onion</h3>
                                <p className="text-sm text-success-foreground/80 dark:text-success/80 mb-3">Prices expected to rise by 15% next week. Hold your stock if possible.</p>
                                <Button size="sm" variant="outline" className="border-success/30 text-success-foreground dark:text-success hover:bg-success/10">
                                    Check Market
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
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

            {/* Market Prices Ticker */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">{t("market")}</h2>
                    <Link href="/marketplace" className="text-sm text-primary hover:underline">{t("viewAll")}</Link>
                </div>
                <Card>
                    <CardContent className="p-0">
                        {[
                            { crop: "Tomato", price: "₹25/kg", trend: "up" },
                            { crop: "Onion", price: "₹18/kg", trend: "down" },
                            { crop: "Potato", price: "₹30/kg", trend: "stable" }
                        ].map((item, i) => (
                            <div key={item.crop} className={`flex items-center justify-between p-4 ${i !== 2 ? 'border-b border-border' : ''}`}>
                                <div className="font-medium">{item.crop}</div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold">{item.price}</span>
                                    {item.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                                    {item.trend === 'down' && <TrendingUp size={16} className="text-red-500 transform rotate-180" />}
                                    {item.trend === 'stable' && <span className="text-muted-foreground text-xs">●</span>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
