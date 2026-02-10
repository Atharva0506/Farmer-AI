"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Upload, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"

export default function PostRequirementPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [formData, setFormData] = useState({
        crop: "",
        quantity: "",
        priceRange: "",
        description: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock submission
        setTimeout(() => {
            router.push("/buyer")
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4 gap-4">
                    <Link href="/buyer">
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-lg">{t("postRequirement")}</h1>
                </div>
            </header>

            <main className="flex-1 p-4 pb-24 md:max-w-xl md:mx-auto md:w-full">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <Label htmlFor="crop">{t("cropName")}</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, crop: val })}>
                            <SelectTrigger id="crop" className="h-12 bg-card">
                                <SelectValue placeholder="Select crop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tomato">Tomato / टमाटर</SelectItem>
                                <SelectItem value="onion">Onion / कांदा</SelectItem>
                                <SelectItem value="wheat">Wheat / गहू</SelectItem>
                                <SelectItem value="soybean">Soybean / सोयाबीन</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">{t("quantity")}</Label>
                            <div className="relative">
                                <Input
                                    id="quantity"
                                    placeholder="e.g. 500"
                                    className="h-12 bg-card pr-16"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                                <span className="absolute right-3 top-3.5 text-muted-foreground text-sm">kg</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">{t("price")}</Label>
                            <div className="relative">
                                <Input
                                    id="price"
                                    placeholder="e.g. 25"
                                    className="h-12 bg-card pr-16"
                                    value={formData.priceRange}
                                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                                />
                                <span className="absolute right-3 top-3.5 text-muted-foreground text-sm">/kg</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc">Additional Details</Label>
                        <div className="relative">
                            <textarea
                                id="desc"
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Quality requirements, delivery preference..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <Button type="button" size="icon" variant="ghost" className="absolute bottom-2 right-2 h-8 w-8 text-primary">
                                <Mic className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full font-bold text-lg h-12 shadow-md">
                        {t("postRequirement")}
                    </Button>
                </form>
            </main>
        </div>
    )
}
