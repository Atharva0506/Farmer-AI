"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { useLanguage } from "@/lib/language-context"

interface MarketplaceFiltersProps {
    categories: { key: string; label: string; labelKey?: string }[]
    selectedCategory: string
    onCategoryChange: (category: string) => void
    searchQuery: string
    onSearchChange: (query: string) => void
    maxDistance: number
    onMaxDistanceChange: (distance: number) => void
}

export function MarketplaceFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    maxDistance,
    onMaxDistanceChange
}: MarketplaceFiltersProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t("search")}
                        className="pl-10 h-11 bg-card rounded-xl"
                    />
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0">
                            <SlidersHorizontal size={18} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-3xl h-auto max-h-[80vh]">
                        <SheetHeader className="text-left mb-6">
                            <SheetTitle>{t("filter")}</SheetTitle>
                            <SheetDescription>
                                Refine listings by distance and category
                            </SheetDescription>
                        </SheetHeader>

                        <div className="space-y-6">
                            {/* Distance Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">{t("distance")}</label>
                                    <span className="text-sm font-bold text-primary">{maxDistance} {t("km")}</span>
                                </div>
                                <Slider
                                    defaultValue={[maxDistance]}
                                    max={100}
                                    step={5}
                                    onValueChange={(vals) => onMaxDistanceChange(vals[0])}
                                    className="py-4"
                                />
                            </div>

                            {/* Categories */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">{t("crop")}</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <Badge
                                            key={cat.key}
                                            variant={selectedCategory === cat.key ? "default" : "outline"}
                                            className={`text-sm py-1.5 px-3 cursor-pointer ${selectedCategory !== cat.key ? "hover:bg-accent/10 hover:text-accent hover:border-accent" : ""}`}
                                            onClick={() => onCategoryChange(cat.key)}
                                        >
                                            {cat.labelKey ? t(cat.labelKey) : cat.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SheetFooter className="mt-8">
                            <SheetClose asChild>
                                <Button size="lg" className="w-full h-12 text-base">{t("apply")}</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Horizontal Categories (Desktop/Tablet) */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => onCategoryChange(cat.key)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors border ${selectedCategory === cat.key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50"
                            }`}
                    >
                        {cat.labelKey ? t(cat.labelKey) : cat.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
