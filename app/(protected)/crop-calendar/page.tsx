"use client"

import { useState } from "react"
import Link from "next/link"
import {
    CalendarDays,
    Loader2,
    Sprout,
    Droplets,
    Bug,
    FlaskConical,
    Wheat,
    AlertTriangle,
    CheckCircle2,
    Info,
    ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface CalendarTask {
    task: string
    priority: "high" | "medium" | "low"
    category: "irrigation" | "fertilizer" | "pest_control" | "harvesting" | "general"
}

interface WeekEntry {
    week: number
    dateRange: string
    phase: string
    tasks: CalendarTask[]
    weatherTip: string
}

interface CalendarAlert {
    message: string
    daysFromNow: number
    type: "critical" | "warning" | "info"
}

interface CalendarData {
    cropName: string
    totalDuration: string
    currentWeek: number
    currentPhase: string
    phases: { name: string; weekStart: number; weekEnd: number; color: string }[]
    weeklyTasks: WeekEntry[]
    upcomingAlerts: CalendarAlert[]
}

const categoryIcons: Record<string, typeof Sprout> = {
    irrigation: Droplets,
    fertilizer: FlaskConical,
    pest_control: Bug,
    harvesting: Wheat,
    general: Sprout,
}

const categoryColors: Record<string, string> = {
    irrigation: "text-blue-500",
    fertilizer: "text-orange-500",
    pest_control: "text-red-500",
    harvesting: "text-green-500",
    general: "text-primary",
}

const alertIcons: Record<string, typeof AlertTriangle> = {
    critical: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
}

const alertColors: Record<string, string> = {
    critical: "bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400",
    warning: "bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400",
    info: "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",
}

export default function CropCalendarPage() {
    const { language } = useLanguage()
    const [crop, setCrop] = useState("")
    const [sowingDate, setSowingDate] = useState("")
    const [calendar, setCalendar] = useState<CalendarData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleGenerate = async () => {
        if (!crop || !sowingDate) return
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/farming-calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ crop, sowingDate, language }),
            })
            if (!res.ok) throw new Error("Failed to generate calendar")
            const json = await res.json()
            setCalendar(json.calendar)
        } catch {
            setError("Failed to generate calendar. Try asking in the AI assistant instead.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <CalendarDays className="text-primary" size={24} />
                    AI Farming Calendar
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Personalized week-by-week farming plan powered by AI
                </p>
            </div>

            {/* Input Form */}
            {!calendar && (
                <Card className="mb-6">
                    <CardContent className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                {language === "mr" ? "पीक" : language === "hi" ? "फसल" : "Crop Name"}
                            </label>
                            <input
                                type="text"
                                value={crop}
                                onChange={(e) => setCrop(e.target.value)}
                                placeholder={language === "mr" ? "उदा. गहू, टोमॅटो" : language === "hi" ? "उदा. गेहूं, टमाटर" : "e.g. Wheat, Tomato"}
                                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-2 block">
                                {language === "mr" ? "पेरणी तारीख" : language === "hi" ? "बुवाई तिथि" : "Sowing Date"}
                            </label>
                            <input
                                type="date"
                                value={sowingDate}
                                onChange={(e) => setSowingDate(e.target.value)}
                                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={!crop || !sowingDate || loading}
                            className="w-full h-12"
                        >
                            {loading ? (
                                <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                            ) : (
                                <><CalendarDays size={16} className="mr-2" /> Generate Calendar</>
                            )}
                        </Button>
                        {error && (
                            <p className="text-sm text-destructive text-center">{error}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Calendar Display */}
            {calendar && (
                <div className="space-y-6">
                    {/* Header Card */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">🌾 {calendar.cropName}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {calendar.totalDuration} • Week {calendar.currentWeek}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-primary">{calendar.currentPhase}</div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setCalendar(null)}
                                        className="mt-1 text-xs"
                                    >
                                        New Calendar
                                    </Button>
                                </div>
                            </div>

                            {/* Phase Progress Bar */}
                            <div className="mt-4 flex rounded-full overflow-hidden h-3 bg-muted">
                                {calendar.phases.map((phase, i) => {
                                    const totalWeeks = calendar.phases[calendar.phases.length - 1].weekEnd
                                    const width = ((phase.weekEnd - phase.weekStart + 1) / totalWeeks) * 100
                                    const isActive = calendar.currentWeek >= phase.weekStart && calendar.currentWeek <= phase.weekEnd
                                    return (
                                        <div
                                            key={i}
                                            title={`${phase.name} (Week ${phase.weekStart}-${phase.weekEnd})`}
                                            className={cn(
                                                "h-full transition-all relative",
                                                isActive ? "ring-2 ring-white dark:ring-background z-10" : "",
                                                phase.color === "green" ? "bg-green-500" :
                                                    phase.color === "blue" ? "bg-blue-500" :
                                                        phase.color === "yellow" ? "bg-yellow-500" :
                                                            phase.color === "orange" ? "bg-orange-500" :
                                                                phase.color === "red" ? "bg-red-500" :
                                                                    phase.color === "purple" ? "bg-purple-500" :
                                                                        "bg-primary"
                                            )}
                                            style={{ width: `${width}%` }}
                                        />
                                    )
                                })}
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                {calendar.phases.map((p, i) => (
                                    <span key={i} className="truncate px-0.5">{p.name}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Alerts */}
                    {calendar.upcomingAlerts.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-foreground">⚡ Upcoming Alerts</h3>
                            {calendar.upcomingAlerts.map((alert, i) => {
                                const AlertIcon = alertIcons[alert.type] || Info
                                return (
                                    <div key={i} className={cn("p-3 rounded-xl border text-sm flex items-start gap-2", alertColors[alert.type])}>
                                        <AlertIcon size={16} className="mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-medium">{alert.message}</span>
                                            <span className="text-xs opacity-70 ml-2">
                                                (in {alert.daysFromNow} days)
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Weekly Tasks */}
                    <div className="space-y-3">
                        {calendar.weeklyTasks.map((week) => {
                            const isCurrent = week.week === calendar.currentWeek
                            return (
                                <Card key={week.week} className={cn(
                                    "transition-all",
                                    isCurrent ? "border-primary/50 ring-2 ring-primary/20 shadow-md" : "border-border"
                                )}>
                                    <CardHeader className="pb-2 pt-4 px-4">
                                        <CardTitle className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                {isCurrent && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                                <span className={cn(isCurrent ? "text-primary font-bold" : "text-foreground")}>
                                                    Week {week.week} {isCurrent && "← NOW"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-normal">{week.dateRange}</span>
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">{week.phase}</p>
                                    </CardHeader>
                                    <CardContent className="pt-0 px-4 pb-4">
                                        <div className="space-y-2">
                                            {week.tasks.map((task, ti) => {
                                                const TaskIcon = categoryIcons[task.category] || Sprout
                                                const iconColor = categoryColors[task.category] || "text-primary"
                                                return (
                                                    <div key={ti} className="flex items-start gap-2 text-sm">
                                                        <TaskIcon size={14} className={cn(iconColor, "mt-0.5 shrink-0")} />
                                                        <span className="text-foreground">{task.task}</span>
                                                        {task.priority === "high" && (
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                                                                !!
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {week.weatherTip && (
                                            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground flex items-start gap-1">
                                                <span>☁️</span>
                                                <span>{week.weatherTip}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Footer CTA */}
                    <Card className="border-dashed border-2">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                Want more detailed advice? Ask the AI assistant about specific weeks.
                            </p>
                            <Link href="/assistant">
                                <Button size="sm" variant="outline">
                                    <Sprout size={14} className="mr-2" /> Ask AI Assistant
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
