"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MessageCircle, X, Sprout, Minimize2, Maximize2, Send, Mic, Image as ImageIcon, StopCircle, Volume2, VolumeX, Bot, User, Phone } from "lucide-react"
import { VoiceChatModal } from "@/components/features/assistant/voice-chat-modal"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage, FileUIPart } from "ai"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { memo } from "react"

// ─── Compact Markdown Renderer ──────────────
const CompactMarkdown = memo(function CompactMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} className="underline text-primary font-medium" target="_blank" rel="noopener noreferrer" />
        ),
        p: ({ node, ...props }) => <p {...props} className="mb-1.5 last:mb-0" />,
        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-3 mb-1.5 last:mb-0 text-xs" />,
        ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-3 mb-1.5 last:mb-0 text-xs" />,
        h1: ({ node, ...props }) => <h1 {...props} className="text-sm font-bold mb-1 text-foreground" />,
        h2: ({ node, ...props }) => <h2 {...props} className="text-xs font-bold mb-1 text-foreground" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-xs font-semibold mb-0.5 text-foreground" />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-1">
            <table {...props} className="min-w-full border-collapse text-[10px]" />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="border border-border px-1.5 py-0.5 bg-muted text-left font-semibold text-[10px]" />
        ),
        td: ({ node, ...props }) => <td {...props} className="border border-border px-1.5 py-0.5 text-[10px]" />,
        pre: ({ node, children, ...props }) => (
          <pre {...props} className="bg-muted rounded-lg p-2 overflow-x-auto my-1 text-[10px]">
            {children}
          </pre>
        ),
        code: ({ node, className, children, ...props }) => {
          const isBlock = Boolean(className)
          return isBlock ? (
            <code {...props} className={cn("text-[10px] font-mono", className)}>{children}</code>
          ) : (
            <code {...props} className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">{children}</code>
          )
        },
        blockquote: ({ node, ...props }) => (
          <blockquote {...props} className="border-l-2 border-primary/50 pl-2 italic text-muted-foreground my-1 text-xs" />
        ),
        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
        hr: ({ node, ...props }) => <hr {...props} className="my-2 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
})

// ─── Language code mapping ───────────────
const LANG_VOICE_MAP: Record<string, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-US",
}

// ─── Quick Action Chips (i18n keys) ──────────────
const QUICK_ACTION_KEYS = [
  { icon: "🌾", labelKey: "quickCrop" },
  { icon: "🔍", labelKey: "quickDisease" },
  { icon: "📋", labelKey: "quickScheme" },
  { icon: "💰", labelKey: "quickSell" },
  { icon: "☀️", labelKey: "quickWeather" },
  { icon: "📊", labelKey: "quickPrices" },
]

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [input, setInput] = useState("")
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { t, language } = useLanguage()
  const { latitude, longitude } = useGeolocation()

  // Don't render on the assistant page (it has its own full chat UI)
  const isAssistantPage = pathname === "/assistant"

  // Transport for AI SDK
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { data: { language, latitude, longitude } },
      }),
    [language, latitude, longitude]
  )

  const { messages, sendMessage, status, stop } = useChat({
    id: "floating-chat-widget",
    transport,
    onError: (error) => {
      console.error("Chat widget error:", error)
      toast.error(t("chatError") || "Something went wrong. Please try again.")
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Mark unread when new AI message arrives while widget is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === "assistant") {
        setHasUnread(true)
      }
    }
  }, [messages, isOpen])

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) setHasUnread(false)
  }, [isOpen])

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`
    }
  }, [input])

  // Handle navigation tool calls
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "assistant" || !lastMsg.parts) return

    for (const part of lastMsg.parts) {
      if (part.type === "tool-invocation" && (part as any).toolName === "navigate") {
        const result = (part as any).result
        if (result?.action === "navigate" && result?.route) {
          setTimeout(() => {
            router.push(result.route)
            setIsOpen(false) // Close widget after navigation
          }, 500)
        }
      }
    }
  }, [messages, router])

  // Extract text from UIMessage parts
  const getMessageText = useCallback((msg: UIMessage): string => {
    if (!msg.parts) return ""
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("")
  }, [])

  // Extract images
  const getMessageImages = useCallback((msg: UIMessage): string[] => {
    if (!msg.parts) return []
    return msg.parts
      .filter((p) => p.type === "file")
      .map((p) => (p as FileUIPart).url)
      .filter(Boolean)
  }, [])

  // TTS
  const handleSpeak = useCallback(
    (text: string, msgId: string) => {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel()
        setSpeakingMsgId(null)
        return
      }
      window.speechSynthesis.cancel()
      const clean = text.replace(/[#*_~`>|[\]()-]/g, "").replace(/\n+/g, ". ").trim()
      const utterance = new SpeechSynthesisUtterance(clean)

      // Auto-detect language from text for correct TTS voice
      let detectedLang = LANG_VOICE_MAP[language] || "en-US"
      if (/[\u0900-\u097F]/.test(clean)) {
        // Text contains Devanagari
        // Distinguish Marathi vs Hindi using common Marathi stop words
        const isMarathi = /(?:^|\s)(आहे|नाही|आणि|पण|माझे|तुम्हाला|शेतकरी|पिक|येईल|होय|करतो|करते|साठी)(?=$|\s|[.,?!])/u.test(clean);
        detectedLang = isMarathi ? "mr-IN" : "hi-IN";
      }

      utterance.lang = detectedLang
      utterance.rate = 0.9
      utterance.onend = () => setSpeakingMsgId(null)
      utterance.onerror = () => setSpeakingMsgId(null)
      setSpeakingMsgId(msgId)
      window.speechSynthesis.speak(utterance)
    },
    [language, speakingMsgId]
  )

  // Voice input
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      const langMap: Record<string, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-US" }
      recognitionRef.current.lang = langMap[language] || "en-US"
      recognitionRef.current.onstart = () => setIsListening(true)
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput((prev) => prev + (prev ? " " : "") + transcript)
        setIsListening(false)
      }
      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
      recognitionRef.current.start()
    } else {
      toast.error("Speech recognition not supported in this browser.")
    }
  }, [isListening, language])

  // Image compression
  const compressImage = useCallback((file: File, maxDim: number = 800): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size < 300 * 1024) { resolve(file); return }
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement("canvas")
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
          "image/jpeg", 0.75
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }, [])

  // File to data URL
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // Send message
  const handleSend = useCallback(async (text?: string) => {
    const msgText = text || input.trim()
    if (!msgText) return

    setInput("")
    await sendMessage({ text: msgText })
  }, [input, sendMessage])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"))
    if (fileArray.length === 0) return

    const compressed = await Promise.all(fileArray.map(f => compressImage(f)))
    const fileParts: FileUIPart[] = await Promise.all(
      compressed.map(async (file) => ({
        type: "file" as const,
        mediaType: file.type,
        filename: file.name,
        url: await fileToDataUrl(file),
      }))
    )

    await sendMessage({
      text: input.trim() || "Please analyze this image.",
      files: fileParts,
    })
    setInput("")
  }, [input, sendMessage, compressImage, fileToDataUrl])

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [isOpen])

  // Don't render on assistant page
  if (isAssistantPage) return null

  return (
    <>
      {/* ─── Floating Chat Panel ──────────────── */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col bg-background border border-border shadow-2xl overflow-hidden transition-all duration-300 ease-in-out",
            // Mobile: full screen
            "inset-0 rounded-none",
            // Desktop: floating panel bottom-right
            "md:inset-auto md:bottom-24 md:right-6 md:rounded-2xl",
            // Desktop sizes
            isExpanded ? "md:w-[480px] md:h-[620px]" : "md:w-[380px] md:h-[500px]",
            // Entrance animation
            "animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border shrink-0">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                <Sprout size={18} className="text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-tight">KrishiMitra AI</h3>
              <p className="text-[10px] text-muted-foreground">
                {isLoading ? (
                  <span className="text-primary animate-pulse">{t("thinking") || "Thinking"}...</span>
                ) : (
                  <span>{t("assistantOnline") || "\u0915\u0943\u0937\u093f \u092e\u093f\u0924\u094d\u0930 \u2022 Online"}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Voice mode */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-green-500 hover:bg-green-500/10"
                onClick={() => {
                  setIsOpen(false)
                  setIsVoiceOpen(true)
                }}
                title={t("voiceAssistant")}
              >
                <Phone size={14} />
              </Button>
              {/* Expand/Collapse - desktop only */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hidden md:flex"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
              {/* Open full assistant */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => {
                  router.push("/assistant")
                  setIsOpen(false)
                }}
                title="Open full assistant"
              >
                <Maximize2 size={14} />
              </Button>
              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 no-scrollbar">
            {/* Empty State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3">
                  <Sprout size={28} className="text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-0.5">KrishiMitra AI</h4>
                <p className="text-[10px] text-primary/70 font-medium mb-1">{"\u0915\u0943\u0937\u093f \u092e\u093f\u0924\u094d\u0930"}</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-[260px]">
                  {t("assistantWelcome") || "Your AI farming assistant. Ask me anything about crops, weather, schemes, marketplace, and more!"}
                </p>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
                  {QUICK_ACTION_KEYS.map((action) => {
                    const label = t(action.labelKey)
                    return (
                      <button
                        key={action.labelKey}
                        onClick={() => handleSend(label)}
                        className="px-2.5 py-1.5 text-[11px] rounded-full border border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 whitespace-nowrap"
                      >
                        {action.icon} {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) => {
              const text = getMessageText(msg)
              const images = getMessageImages(msg)
              if (!text && images.length === 0) return null

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 max-w-[90%]",
                    msg.role === "assistant" ? "self-start" : "self-end ml-auto flex-row-reverse"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5",
                      msg.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground"
                    )}
                  >
                    {msg.role === "assistant" ? <Bot size={12} /> : <User size={12} />}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    {/* Images */}
                    {images.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {images.map((img, idx) => (
                          <div key={idx} className="h-14 w-14 rounded-lg border border-border overflow-hidden bg-muted">
                            <img src={img} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text */}
                    {text && (
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-full overflow-hidden",
                          msg.role === "assistant"
                            ? "bg-card text-card-foreground border border-border rounded-tl-none"
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-xs dark:prose-invert break-words max-w-none">
                            <CompactMarkdown content={text} />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{text}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {msg.role === "assistant" && text && (
                      <div className="flex items-center gap-1 px-0.5">
                        <button
                          onClick={() => handleSpeak(text, msg.id)}
                          className={cn(
                            "transition-colors p-0.5",
                            speakingMsgId === msg.id
                              ? "text-destructive hover:text-destructive/80"
                              : "text-muted-foreground hover:text-primary"
                          )}
                          aria-label={speakingMsgId === msg.id ? "Stop speaking" : "Speak"}
                        >
                          {speakingMsgId === msg.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 self-start px-3 py-2 bg-muted/50 rounded-2xl rounded-tl-none animate-pulse max-w-[90%]">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{t("thinking") || "Thinking"}...</span>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-3 border-t border-border bg-background/80 backdrop-blur-sm">
            <div
              className={cn(
                "flex items-end gap-2 bg-background border rounded-2xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
                isListening && "ring-2 ring-primary/50 border-primary animate-pulse"
              )}
            >
              {/* Image upload */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={15} />
              </Button>

              {/* Mic */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-full shrink-0",
                  isListening
                    ? "text-destructive bg-destructive/10 animate-pulse"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                onClick={toggleListening}
              >
                <Mic size={15} />
              </Button>

              {/* Text input */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? (t("listening") || "Listening...") : (t("typeMessage") || "Ask anything...")}
                className="flex-1 max-h-[100px] min-h-[28px] py-1 bg-transparent resize-none focus:outline-none text-xs text-foreground placeholder:text-muted-foreground leading-relaxed"
                rows={1}
              />

              {/* Send / Stop */}
              {isLoading ? (
                <Button
                  size="icon"
                  onClick={() => stop()}
                  className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shrink-0"
                >
                  <StopCircle size={14} className="animate-pulse" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all shrink-0",
                    input.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                >
                  <Send size={13} className={input.trim() ? "ml-0.5" : ""} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Action Buttons ──────────────── */}
      {!isOpen && (
        <>
          {/* Voice FAB — smaller, positioned above the main FAB */}
          <button
            onClick={() => setIsVoiceOpen(true)}
            className={cn(
              "fixed z-50 group",
              "bottom-36 right-5 md:bottom-[72px] md:right-7",
              "h-10 w-10 rounded-full",
              "bg-gradient-to-br from-green-500 to-green-600",
              "text-white shadow-md shadow-green-500/25",
              "hover:shadow-lg hover:shadow-green-500/30 hover:scale-105",
              "active:scale-95",
              "transition-all duration-200",
              "flex items-center justify-center"
            )}
            aria-label={t("voiceAssistant")}
          >
            <Mic size={18} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Main Chat FAB */}
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed z-50 group",
              "bottom-20 right-4 md:bottom-6 md:right-6",
              "h-14 w-14 rounded-full",
              "bg-gradient-to-br from-primary to-primary/80",
              "text-primary-foreground shadow-lg shadow-primary/25",
              "hover:shadow-xl hover:shadow-primary/30 hover:scale-105",
              "active:scale-95",
              "transition-all duration-200",
              "flex items-center justify-center",
              messages.length === 0 && "animate-bounce [animation-duration:2s] [animation-iteration-count:3]"
            )}
            aria-label="Open KrishiMitra AI Chat"
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />

            {/* Unread badge */}
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                !
              </span>
            )}

            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
          </button>
        </>
      )}

      {/* Voice Chat Modal */}
      <VoiceChatModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </>
  )
}
