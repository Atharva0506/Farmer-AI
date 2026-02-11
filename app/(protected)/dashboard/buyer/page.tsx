"use client"

import Link from "next/link"
import { Plus, MapPin, Phone, User, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"

const nearbyFarmers = [
    {
        id: "1",
        name: "Ramesh Patil",
        location: "Nashik (15 km)",
        crops: ["Tomato", "Onion"],
        rating: "4.8",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    {
        id: "2",
        name: "Suresh More",
        location: "Pune (25 km)",
        crops: ["Wheat", "Soybean"],
        rating: "4.5",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    {
        id: "3",
        name: "Vijay Shinde",
        location: "Kolhapur (55 km)",
        crops: ["Sugarcane", "Jaggery"],
        rating: "4.9",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
]

const recentRequirements = [
    { id: "1", crop: "Tomato", quantity: "2000 kg", status: "Active", date: "2h ago" },
    { id: "2", crop: "Onion", quantity: "500 kg", status: "Fulfilled", date: "1d ago" },
]

export default function BuyerDashboard() {
    const { t } = useLanguage()

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
            {/* Welcome & Post CTA */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">{t("buyerDashboard")}</h1>
                <p className="text-muted-foreground text-sm mb-6">{t("buyerDesc")}</p>

                <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 -skew-x-12 transform translate-x-8" />
                    <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold mb-1">{t("postRequirement")}</h2>
                            <p className="text-primary-foreground/80 text-sm">Let farmers know what you need.</p>
                        </div>
                        <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg" asChild>
                            <Link href="/buyer/post">
                                <Plus className="mr-2 h-5 w-5" />
                                {t("postRequirement")}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Nearby Farmers */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <User size={20} className="text-primary" />
                        {t("nearbyFarmers")}
                    </h2>
                    <Button variant="ghost" size="sm" className="text-primary">
                        {t("viewAll")}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nearbyFarmers.map((farmer) => (
                        <Card key={farmer.id} className="border border-border hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex gap-4">
                                <img
                                    src={farmer.image}
                                    alt={farmer.name}
                                    className="h-16 w-16 rounded-full object-cover border-2 border-primary/10"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-foreground">{farmer.name}</h3>
                                        <Badge variant="secondary" className="text-xs font-bold bg-warning/10 text-warning-foreground hover:bg-warning/20 border-warning/20">
                                            ★ {farmer.rating}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 mb-2">
                                        <MapPin size={12} />
                                        {farmer.location}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {farmer.crops.map((crop) => (
                                            <Badge key={crop} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                {crop}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary shrink-0 self-center">
                                    <Phone size={18} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recent Requirements */}
            <div>
                <h2 className="text-lg font-bold text-foreground mb-4">{t("myListings")}</h2>
                <Card className="border border-border">
                    <CardContent className="p-0">
                        {recentRequirements.map((req, i) => (
                            <div
                                key={req.id}
                                className={`p-4 flex items-center justify-between ${i < recentRequirements.length - 1 ? "border-b border-border" : ""
                                    }`}
                            >
                                <div>
                                    <h4 className="font-bold text-foreground">{req.crop}</h4>
                                    <p className="text-sm text-muted-foreground">{req.quantity} • {req.date}</p>
                                </div>
                                <Badge
                                    variant={req.status === "Active" ? "default" : "secondary"}
                                    className={req.status === "Active" ? "bg-success/10 text-success hover:bg-success/20 border-success/20" : ""}
                                >
                                    {req.status}
                                </Badge>
                            </div>
                        ))}
                        <div className="p-3 text-center border-t border-border">
                            <Button variant="link" className="text-sm h-auto p-0">{t("viewAll")}</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
