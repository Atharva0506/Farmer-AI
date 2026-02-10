"use client"

import { Volume2, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIChatBubbleProps {
  message: string
  isAI?: boolean
  timestamp?: string
  onSpeak?: () => void
}

export function AIChatBubble({ message, isAI = false, timestamp, onSpeak }: AIChatBubbleProps) {
  return (
    <div className={cn("flex gap-2 max-w-[85%]", isAI ? "self-start" : "self-end flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAI ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isAI ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isAI
              ? "bg-card text-card-foreground border border-border rounded-tl-none"
              : "bg-primary text-primary-foreground rounded-tr-none"
          )}
        >
          {message}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          {timestamp && (
            <span className="text-[10px] text-muted-foreground">{timestamp}</span>
          )}
          {isAI && onSpeak && (
            <button
              onClick={onSpeak}
              className="text-primary hover:text-primary/80 transition-colors"
              aria-label="Speak response"
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
