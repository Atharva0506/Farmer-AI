"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, Image as ImageIcon, X, Loader2, Brain, Sparkles, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const langCodeMap: Record<string, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" }

interface ChatInputProps {
    input: string
    setInput: (value: string) => void
    isLoading: boolean
    onSubmit: (e?: React.FormEvent) => void
    onFileSelect: (file: File) => void
    onClearFile: () => void
    selectedFile: File | null
    stop: () => void | Promise<void>
    mode: 'think' | 'research'
    setMode: (mode: 'think' | 'research') => void
}

export function ChatInput({
    input,
    setInput,
    isLoading,
    onSubmit,
    onFileSelect,
    onClearFile,
    selectedFile,
    stop,
    mode,
    setMode
}: ChatInputProps) {
    const { t, language } = useLanguage()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [input])

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
            // Default to English, but ideal to match app language
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

    return (
        <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-2">
                <div className="bg-muted/50 p-1 rounded-full flex items-center gap-1 border border-border/50">
                    <button
                        onClick={() => setMode('think')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all",
                            mode === 'think'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Brain size={14} className={mode === 'think' ? "text-primary" : ""} />
                        Think
                    </button>
                    <button
                        onClick={() => setMode('research')}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all",
                            mode === 'research'
                                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <Sparkles size={14} className={mode === 'research' ? "text-accent" : ""} />
                        Research
                    </button>
                </div>
            </div>

            <div className={cn(
                "relative bg-background border rounded-[26px] shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
                isListening && "ring-2 ring-primary/50 border-primary animate-pulse",
                "flex flex-col"
            )}>

                {/* Image Preview Area */}
                {selectedFile && (
                    <div className="px-4 pt-4 pb-0 flex gap-2 overflow-x-auto">
                        <div className="relative group animate-in zoom-in-50 duration-200">
                            <div className="h-16 w-16 rounded-xl border border-border overflow-hidden bg-muted">
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <button
                                onClick={onClearFile}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex items-end gap-2 p-3 pl-4">
                    <div className="flex gap-2 pb-1.5">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
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
                        placeholder={isListening ? t("listening") : t("typeMessage")}
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
                                disabled={!input.trim() && !selectedFile}
                                className={cn(
                                    "h-9 w-9 rounded-full transition-all duration-200 shrink-0",
                                    input.trim() || selectedFile
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transform hover:scale-105"
                                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                )}
                            >
                                <Send size={18} className={input.trim() || selectedFile ? "ml-0.5" : ""} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground/60 px-4">
                AI can make mistakes. Verify important information.
            </p>
        </div>
    )
}
