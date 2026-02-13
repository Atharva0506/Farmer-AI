"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

interface VoiceInputButtonProps {
  onResult?: (text: string) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

const langCodeMap: Record<string, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" }

export function VoiceInputButton({ onResult, className, size = "lg" }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const { t, language } = useLanguage()
  const recognitionRef = useRef<any>(null)

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-16 w-16",
  }

  const iconSizes = {
    sm: 18,
    md: 24,
    lg: 28,
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported")
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    } else {
      setIsListening(true)

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.lang = langCodeMap[language] || 'en-US'
        recognitionRef.current = recognition
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript
          onResult?.(text)
          setIsListening(false)
        }

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.start()
      } else {
        alert("Speech recognition not supported in this browser.")
        setIsListening(false)
      }
    }
  }

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Ripple Animation layers */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping duration-1000" />
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" />
        </>
      )}

      <button
        onClick={toggleListening}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg",
          isListening
            ? "bg-destructive text-destructive-foreground scale-110 shadow-destructive/20"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-primary/20",
          sizeClasses[size]
        )}
        aria-label={isListening ? t("listening") : t("speakNow")}
      >
        {isListening ? (
          <div className="flex gap-0.5 items-center h-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-1 bg-white animate-waveform rounded-full" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </button>
    </div>
  )
}
