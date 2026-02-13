"use client"

import { useState, useRef, useEffect } from "react"
import {
    Send, Mic, Image as ImageIcon, X, Loader2, Brain, Sparkles,
    StopCircle, Sprout, Bug, Landmark, ShoppingCart, CloudSun,
    FlaskConical, TrendingUp, Plus, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const langCodeMap: Record<string, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" }

export type ActiveTool = 'crop-help' | 'disease-detect' | 'gov-schemes' | 'sell-produce' | 'weather' | 'soil-analysis' | 'market-prices' | null

interface ToolOption {
    id: ActiveTool
    icon: React.ReactNode
    labelKey: string
    color: string
    bgColor: string
    description: string
}

const FARMER_TOOLS: ToolOption[] = [
    {
        id: 'crop-help',
        icon: <Sprout size={18} />,
        labelKey: 'toolCropHelp',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
        description: 'toolCropHelpDesc',
    },
    {
        id: 'disease-detect',
        icon: <Bug size={18} />,
        labelKey: 'toolDiseaseDetect',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30',
        description: 'toolDiseaseDetectDesc',
    },
    {
        id: 'gov-schemes',
        icon: <Landmark size={18} />,
        labelKey: 'toolGovSchemes',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
        description: 'toolGovSchemesDesc',
    },
    {
        id: 'sell-produce',
        icon: <ShoppingCart size={18} />,
        labelKey: 'toolSellProduce',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
        description: 'toolSellProduceDesc',
    },
    {
        id: 'weather',
        icon: <CloudSun size={18} />,
        labelKey: 'toolWeather',
        color: 'text-sky-500',
        bgColor: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30',
        description: 'toolWeatherDesc',
    },
    {
        id: 'soil-analysis',
        icon: <FlaskConical size={18} />,
        labelKey: 'toolSoilAnalysis',
        color: 'text-orange-600',
        bgColor: 'bg-orange-600/10 hover:bg-orange-600/20 border-orange-600/30',
        description: 'toolSoilAnalysisDesc',
    },
    {
        id: 'market-prices',
        icon: <TrendingUp size={18} />,
        labelKey: 'toolMarketPrices',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
        description: 'toolMarketPricesDesc',
    },
]

interface ChatInputProps {
    input: string
    setInput: (value: string) => void
    isLoading: boolean
    onSubmit: (e?: React.FormEvent) => void
    onFilesSelect: (files: File[]) => void
    onClearFile: (index: number) => void
    onClearAllFiles: () => void
    selectedFiles: File[]
    stop: () => void | Promise<void>
    mode: 'think' | 'research'
    setMode: (mode: 'think' | 'research') => void
    activeTool: ActiveTool
    setActiveTool: (tool: ActiveTool) => void
}

export function ChatInput({
    input,
    setInput,
    isLoading,
    onSubmit,
    onFilesSelect,
    onClearFile,
    onClearAllFiles,
    selectedFiles,
    stop,
    mode,
    setMode,
    activeTool,
    setActiveTool,
}: ChatInputProps) {
    const { t, language } = useLanguage()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isListening, setIsListening] = useState(false)
    const [showTools, setShowTools] = useState(false)
    const recognitionRef = useRef<any>(null)
    const toolsRef = useRef<HTMLDivElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [input])

    // Close tools on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
                setShowTools(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Voice Input Logic
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
            return
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = false
            recognitionRef.current.lang = langCodeMap[language] || 'en-US'

            recognitionRef.current.onstart = () => setIsListening(true)

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setInput(input + (input ? " " : "") + transcript)
                setIsListening(false)
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error)
                setIsListening(false)
            }

            recognitionRef.current.onend = () => setIsListening(false)

            recognitionRef.current.start()
        } else {
            alert("Speech recognition is not supported in this browser.")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            onFilesSelect(Array.from(files))
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const activeToolData = FARMER_TOOLS.find(t => t.id === activeTool)

    return (
        <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto">
            {/* Mode & Active Tool Indicator */}
            <div className="flex justify-center gap-2 flex-wrap">
                <div className="bg-muted/50 p-0.5 rounded-full flex items-center gap-0.5 border border-border/50">
                    <button
                        onClick={() => setMode('think')}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
                            mode === 'think'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Brain size={13} className={mode === 'think' ? "text-primary" : ""} />
                        {t('modeThink')}
                    </button>
                    <button
                        onClick={() => setMode('research')}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all",
                            mode === 'research'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Sparkles size={13} className={mode === 'research' ? "text-accent" : ""} />
                        {t('modeResearch')}
                    </button>
                </div>

                {/* Active Tool Badge */}
                {activeTool && activeToolData && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all animate-in fade-in zoom-in-95 duration-200",
                        activeToolData.bgColor, activeToolData.color
                    )}>
                        {activeToolData.icon}
                        <span>{t(activeToolData.labelKey)}</span>
                        <button
                            onClick={() => setActiveTool(null)}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Main Input Container */}
            <div className={cn(
                "relative bg-background border rounded-[26px] shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
                isListening && "ring-2 ring-primary/50 border-primary animate-pulse",
                "flex flex-col"
            )}>

                {/* Multi-Image Preview Area */}
                {selectedFiles.length > 0 && (
                    <div className="px-4 pt-3 pb-0 flex gap-2 overflow-x-auto no-scrollbar">
                        {selectedFiles.map((file, idx) => (
                            <div key={`${file.name}-${idx}`} className="relative group animate-in zoom-in-50 duration-200 shrink-0">
                                <div className="h-16 w-16 rounded-xl border border-border overflow-hidden bg-muted">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={() => onClearFile(idx)}
                                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {selectedFiles.length > 1 && (
                            <button
                                onClick={onClearAllFiles}
                                className="text-[10px] text-muted-foreground hover:text-destructive transition-colors px-2 self-center"
                            >
                                {t('clearAll')}
                            </button>
                        )}
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-end gap-2 p-3 pl-4">
                    <div className="flex items-center gap-1 pb-1.5">
                        {/* Tools Button (+ icon like ChatGPT) */}
                        <div className="relative" ref={toolsRef}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-full shrink-0 transition-all",
                                    showTools
                                        ? "bg-primary/10 text-primary rotate-45"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                )}
                                onClick={() => setShowTools(!showTools)}
                                title={t('smartTools')}
                            >
                                <Plus size={20} />
                            </Button>

                            {/* Tools Dropdown */}
                            {showTools && (
                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden">
                                    <div className="p-3 border-b border-border">
                                        <h3 className="text-sm font-semibold text-foreground">{t('smartTools')}</h3>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{t('smartToolsDesc')}</p>
                                    </div>
                                    <div className="p-2 max-h-[320px] overflow-y-auto">
                                        {FARMER_TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => {
                                                    setActiveTool(activeTool === tool.id ? null : tool.id)
                                                    setShowTools(false)
                                                    textareaRef.current?.focus()
                                                }}
                                                className={cn(
                                                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                                                    activeTool === tool.id
                                                        ? `${tool.bgColor} ${tool.color} ring-1 ring-current/20`
                                                        : "hover:bg-muted/80"
                                                )}
                                            >
                                                <div className={cn(
                                                    "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                                                    activeTool === tool.id ? `${tool.bgColor}` : "bg-muted",
                                                    tool.color
                                                )}>
                                                    {tool.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        activeTool === tool.id ? tool.color : "text-foreground"
                                                    )}>
                                                        {t(tool.labelKey)}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                                                        {t(tool.description)}
                                                    </p>
                                                </div>
                                                {activeTool === tool.id && (
                                                    <div className={cn("text-xs font-medium px-1.5 py-0.5 rounded-full", tool.bgColor, tool.color)}>
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Upload Images from tools dropdown */}
                                    <div className="p-2 border-t border-border">
                                        <button
                                            onClick={() => {
                                                fileInputRef.current?.click()
                                                setShowTools(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/80 transition-all"
                                        >
                                            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted text-violet-500">
                                                <ImageIcon size={18} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium text-foreground">{t('uploadImages')}</p>
                                                <p className="text-[11px] text-muted-foreground">{t('uploadImagesDesc')}</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Image Upload Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            title={t("uploadImage")}
                        >
                            <ImageIcon size={20} />
                        </Button>

                        {/* Mic Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-9 w-9 hover:bg-primary/10 rounded-full shrink-0",
                                isListening ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground hover:text-primary"
                            )}
                            onClick={toggleListening}
                            title={isListening ? "Stop listening" : t("speakNow")}
                        >
                            <Mic size={20} />
                        </Button>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isListening
                                ? t("listening")
                                : activeTool
                                    ? t(`${activeTool.replace('-', '')}Placeholder`) || t("typeMessage")
                                    : t("typeMessage")
                        }
                        className="flex-1 max-h-[200px] min-h-[44px] py-2.5 bg-transparent resize-none focus:outline-none text-base text-foreground placeholder:text-muted-foreground leading-relaxed scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                        rows={1}
                    />

                    <div className="pb-1">
                        {isLoading ? (
                            <Button
                                size="icon"
                                onClick={stop}
                                className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shrink-0"
                            >
                                <StopCircle size={18} className="animate-pulse" />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                onClick={() => onSubmit()}
                                disabled={!input.trim() && selectedFiles.length === 0}
                                className={cn(
                                    "h-9 w-9 rounded-full transition-all duration-200 shrink-0",
                                    input.trim() || selectedFiles.length > 0
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transform hover:scale-105"
                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                )}
                            >
                                <Send size={18} className={input.trim() || selectedFiles.length > 0 ? "ml-0.5" : ""} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground/60 px-4">
                {t('aiDisclaimer')}
            </p>
        </div>
    )
}
