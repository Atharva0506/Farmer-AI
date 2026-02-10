"use client"

import { useState, useEffect } from "react"
import { Mic, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

interface VoiceInputButtonProps {
  onResult?: (text: string) => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function VoiceInputButton({ onResult, className, size = "lg" }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const { t } = useLanguage()

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

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false)
    } else {
      setIsListening(true)
      // Mock recognition delay
      setTimeout(() => {
        setIsListening(false)
        onResult?.("Sample voice input for " + t("cropHelp"))
      }, 3000)
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
