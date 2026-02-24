"use client"

import { useState, useRef, useEffect } from "react"
import {
    Send, Mic, Image as ImageIcon, X, 
    StopCircle, Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

const langCodeMap: Record<string, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" }

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
}: ChatInputProps) {
    const { t, language } = useLanguage()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'inherit'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
        }
    }, [input])

    // Close tools on click outside — removed (no more tools dropdown)

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
                // FIX: Use functional update to avoid stale closure
                setInput((prev) => prev + (prev ? " " : "") + transcript)
                setIsListening(false)
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error)
                setIsListening(false)
            }

            recognitionRef.current.onend = () => setIsListening(false)

            recognitionRef.current.start()
        } else {
            toast.error("Speech recognition is not supported in this browser.")
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
        if (cameraInputRef.current) cameraInputRef.current.value = ''
    }

    return (
        <div className="flex flex-col gap-2 w-full max-w-3xl mx-auto">
            {/* Main Input Container */}
            <div className={cn(
                "relative bg-background border rounded-[26px] shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
                isListening && "ring-2 ring-primary/50 border-primary animate-pulse",
                "flex flex-col"
            )}>

                {/* Multi-Image Preview Area */}
                {selectedFiles.length > 0 && (
                    <div className="px-4 pt-3 pb-0 flex gap-2 overflow-x-auto no-scrollbar">
                        {selectedFiles.map((file, idx) => {
                            const previewUrl = URL.createObjectURL(file)
                            return (
                            <div key={`${file.name}-${idx}`} className="relative group animate-in zoom-in-50 duration-200 shrink-0">
                                <div className="h-16 w-16 rounded-xl border border-border overflow-hidden bg-muted">
                                    <img
                                        src={previewUrl}
                                        alt={`Preview ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                                    />
                                </div>
                                <button
                                    onClick={() => onClearFile(idx)}
                                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        )})}
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
                        {/* Camera Button (mobile-friendly, opens camera directly) */}
                        <input
                            type="file"
                            ref={cameraInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                            onClick={() => cameraInputRef.current?.click()}
                            title={t('takePhoto') || 'Take photo'}
                        >
                            <Camera size={20} />
                        </Button>

                        {/* Gallery Image Upload Button */}
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
