"use client"

import { Loader2, CheckCircle2, CloudSun, Search, ShoppingBag, Users, TrendingUp, Bug, FlaskConical, Compass, CalendarDays, BarChart3, HandCoins, FileCheck, CloudLightning } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolCallIndicatorProps {
    toolName: string
    state: "call" | "partial-call" | "result"
}

const TOOL_CONFIG: Record<string, { icon: typeof Search; label: string; color: string }> = {
    weatherAdvice: { icon: CloudSun, label: "Checking weather", color: "text-sky-500" },
    findSchemes: { icon: Search, label: "Searching schemes", color: "text-violet-500" },
    sellProduce: { icon: ShoppingBag, label: "Creating listing", color: "text-emerald-500" },
    findBuyers: { icon: Users, label: "Finding buyers", color: "text-indigo-500" },
    marketPrices: { icon: TrendingUp, label: "Fetching market prices", color: "text-amber-500" },
    diseaseCheck: { icon: Bug, label: "Analyzing crop disease", color: "text-red-500" },
    soilAnalysis: { icon: FlaskConical, label: "Analyzing soil health", color: "text-orange-500" },
    navigate: { icon: Compass, label: "Navigating", color: "text-blue-500" },
    yieldForecast: { icon: BarChart3, label: "Predicting yield & revenue", color: "text-teal-500" },
    farmingCalendar: { icon: CalendarDays, label: "Generating farming calendar", color: "text-lime-600" },
    priceNegotiation: { icon: HandCoins, label: "Analyzing best price", color: "text-yellow-600" },
    schemeAutoApply: { icon: FileCheck, label: "Preparing scheme application", color: "text-pink-500" },
    weatherCalendarAlerts: { icon: CloudLightning, label: "Generating weather alerts", color: "text-cyan-500" },
}

export function ToolCallIndicator({ toolName, state }: ToolCallIndicatorProps) {
    const config = TOOL_CONFIG[toolName] || { icon: Search, label: toolName, color: "text-muted-foreground" }
    const Icon = config.icon
    const isComplete = state === "result"

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-300",
                isComplete
                    ? "bg-primary/5 border-primary/20 text-primary"
                    : "bg-muted/50 border-border text-muted-foreground animate-pulse"
            )}
        >
            <Icon size={14} className={cn(config.color, "shrink-0")} />
            <span>{config.label}</span>
            {isComplete ? (
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            ) : (
                <Loader2 size={14} className="animate-spin shrink-0" />
            )}
        </div>
    )
}
