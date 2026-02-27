"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Sprout } from "lucide-react"
import { useRouter } from "next/navigation"
import { AIChatBubble } from "@/components/features/assistant/ai-chat-bubble"
import { ChatInput } from "@/components/features/assistant/chat-input"
import { ToolCallIndicator } from "@/components/features/assistant/tool-call-indicator"
import { useLanguage } from "@/lib/language-context"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage, FileUIPart } from "ai"
import { toast } from "sonner"

export default function AssistantPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [input, setInput] = useState("")
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t, language } = useLanguage()
  const { latitude, longitude } = useGeolocation()

  // ─── FIX: Recreate transport when language changes ──
  // Also passes geolocation for real weather + location-aware tool backends
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { data: { language, latitude, longitude } },
      }),
    [language, latitude, longitude]
  )

  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (error) => {
      console.error("Chat error:", error)
      toast.error(t("chatError") || "Something went wrong. Please try again.")
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // ─── Extract text from UIMessage parts ──────────────
  const getMessageText = useCallback((msg: UIMessage): string => {
    if (!msg.parts) return ""
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("")
  }, [])

  // ─── Extract images from UIMessage ──────────────
  const getMessageImages = useCallback((msg: UIMessage): string[] => {
    if (!msg.parts) return []
    return msg.parts
      .filter((p) => p.type === "file")
      .map((p) => (p as FileUIPart).url)
      .filter(Boolean)
  }, [])

  // ─── Extract tool invocations from UIMessage ──────────────
  const getToolCalls = useCallback((msg: UIMessage): { toolName: string; state: string; toolCallId: string }[] => {
    if (!msg.parts) return []
    return msg.parts
      .filter((p) => p.type === "tool-invocation")
      .map((p: any) => ({
        toolName: p.toolName,
        state: p.state, // "call" | "partial-call" | "result"
        toolCallId: p.toolCallId,
      }))
  }, [])

  // ─── Handle navigation tool calls from AI ──────────
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "assistant" || !lastMsg.parts) return

    for (const part of lastMsg.parts) {
      if (part.type === "tool-invocation" && (part as any).toolName === "navigate") {
        const result = (part as any).result
        if (result?.action === "navigate" && result?.route) {
          setTimeout(() => router.push(result.route), 500)
        }
      }
    }
  }, [messages, router])

  // ─── Auto-scroll ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ─── File → Data URL ──────────────
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // ─── Client-side image compression ──────────────
  const compressImage = (file: File, maxDim: number = 1024): Promise<File> => {
    return new Promise((resolve) => {
      if (file.size < 500 * 1024) {
        resolve(file) // Skip if <500KB
        return
      }
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
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg" }))
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          0.8
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(file)
      }
      img.src = url
    })
  }

  // ─── TTS: speak a message ──────────────
  const handleSpeak = useCallback(
    (text: string, msgId: string) => {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel()
        setSpeakingMsgId(null)
        return
      }
      window.speechSynthesis.cancel()
      // Strip markdown for cleaner TTS
      const clean = text
        .replace(/[#*_~`>|[\]()-]/g, "")
        .replace(/\n+/g, ". ")
        .trim()
      const utterance = new SpeechSynthesisUtterance(clean)

      const langVoiceMap: Record<string, string> = {
        mr: "mr-IN",
        hi: "hi-IN",
        en: "en-US",
      }

      // Auto-detect language from text for correct TTS voice
      let detectedLang = langVoiceMap[language] || "en-US"
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

  // ─── SEND MESSAGE ──────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() && selectedFiles.length === 0) return

    const currentInput = input
    const currentFiles = [...selectedFiles]
    setInput("")
    setSelectedFiles([])

    if (currentFiles.length > 0) {
      // Compress images client-side before sending
      const compressedFiles = await Promise.all(
        currentFiles.map((f) =>
          f.type.startsWith("image/") ? compressImage(f) : Promise.resolve(f)
        )
      )
      const fileParts: FileUIPart[] = await Promise.all(
        compressedFiles.map(async (file) => ({
          type: "file" as const,
          mediaType: file.type,
          filename: file.name,
          url: await fileToDataUrl(file),
        }))
      )

      await sendMessage({
        text: currentInput || "Please analyze this image.",
        files: fileParts,
      })
    } else {
      await sendMessage({ text: currentInput })
    }
  }

  // ─── Quick prompt Cards ──────────────────────────
  const quickPrompts = [
    { text: t("quickCrop"), icon: "🌾" },
    { text: t("quickDisease"), icon: "🔍" },
    { text: t("quickScheme"), icon: "📋" },
    { text: t("quickSell"), icon: "💰" },
    { text: t("quickWeather"), icon: "☀️" },
    { text: t("quickSoil"), icon: "🧪" },
  ]

  // ─── MAIN UI ──────────────────────────
  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100vh-3rem)] overflow-hidden bg-background relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2 relative">
        <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto min-h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-muted-foreground mt-16">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
                  <Sprout size={40} className="text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">✦</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">
                KrishiMitra AI
              </h2>
              <p className="text-xs text-primary/70 font-medium mb-1">कृषि मित्र</p>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                {t("assistantWelcome")}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg w-full">
                {quickPrompts.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => {
                      setInput(p.text)
                    }}
                    className="group px-3 py-3 text-xs rounded-2xl border border-border bg-card text-foreground
                               hover:border-primary/50 hover:bg-primary/5 hover:shadow-md
                               transition-all duration-200 flex flex-col items-center gap-2 text-center"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {p.icon}
                    </span>
                    <span className="line-clamp-2 leading-tight">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const text = getMessageText(msg)
            const images = getMessageImages(msg)
            const toolCalls = msg.role === "assistant" ? getToolCalls(msg) : []
            return (
              <div key={msg.id} className="flex flex-col gap-2">
                {/* Tool Call Indicators */}
                {toolCalls.length > 0 && (
                  <div className="self-start flex flex-wrap gap-1.5 ml-10">
                    {toolCalls.map((tc) => (
                      <ToolCallIndicator
                        key={tc.toolCallId}
                        toolName={tc.toolName}
                        state={tc.state as "call" | "partial-call" | "result"}
                      />
                    ))}
                  </div>
                )}
                {/* Message Bubble */}
                {(text || images.length > 0) && (
                  <AIChatBubble
                    message={text}
                    isAI={msg.role === "assistant"}
                    images={images}
                    isSpeaking={speakingMsgId === msg.id}
                    onSpeak={
                      msg.role === "assistant" && text
                        ? () => handleSpeak(text, msg.id)
                        : undefined
                    }
                  />
                )}
              </div>
            )
          })}

          {isLoading && (
            <div className="self-start flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {t("thinking")}...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 pb-6 bg-background/80 backdrop-blur-md border-t border-border z-20">
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSendMessage}
          onFilesSelect={(files) =>
            setSelectedFiles((prev) => [...prev, ...files])
          }
          onClearFile={(index) =>
            setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
          }
          onClearAllFiles={() => setSelectedFiles([])}
          selectedFiles={selectedFiles}
          stop={stop}
        />
      </div>
    </div>
  )
}
