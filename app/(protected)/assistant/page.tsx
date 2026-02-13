"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sprout } from "lucide-react"
import { AIChatBubble } from "@/components/features/assistant/ai-chat-bubble"
import { ChatInput, ActiveTool } from "@/components/features/assistant/chat-input"
import { useLanguage } from "@/lib/language-context"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage, FileUIPart } from "ai"

export default function AssistantPage() {
  const [mode, setMode] = useState<"think" | "research">("think")
  const [activeTool, setActiveTool] = useState<ActiveTool>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [input, setInput] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t, language } = useLanguage()

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { data: { mode, activeTool, language } },
    }),
    onError: (error) => console.error("Chat error:", error),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Helper to extract text from UIMessage parts
  const getMessageText = useCallback((msg: UIMessage): string => {
    if (!msg.parts) return ""
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("")
  }, [])

  // Helper to extract images from UIMessage
  const getMessageImages = useCallback((msg: UIMessage): string[] => {
    if (!msg.parts) return []
    return msg.parts
      .filter((p) => p.type === "file")
      .map((p) => (p as FileUIPart).url)
      .filter(Boolean)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Convert File to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // ─── SEND MESSAGE ──────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() && selectedFiles.length === 0) return

    const currentInput = input
    const currentFiles = [...selectedFiles]
    setInput("")
    setSelectedFiles([])

    if (currentFiles.length > 0) {
      // Convert to FileUIPart[] for the v3 API
      const fileParts: FileUIPart[] = await Promise.all(
        currentFiles.map(async (file) => ({
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

  // ─── Quick prompt suggestion cards ──────────────────────────
  const quickPrompts = [
    { text: t("quickCrop"), icon: "🌾", tool: 'crop-help' as ActiveTool },
    { text: t("quickDisease"), icon: "🔍", tool: 'disease-detect' as ActiveTool },
    { text: t("quickScheme"), icon: "📋", tool: 'gov-schemes' as ActiveTool },
    { text: t("quickSell"), icon: "💰", tool: 'sell-produce' as ActiveTool },
    { text: t("quickWeather"), icon: "🌤️", tool: 'weather' as ActiveTool },
    { text: t("quickSoil"), icon: "🧪", tool: 'soil-analysis' as ActiveTool },
  ]

  // ─── MAIN UI ──────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2 relative">
        <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto min-h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-muted-foreground mt-16">
              {/* Hero Icon */}
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
                  <Sprout size={40} className="text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs">✦</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">{t("appName")}</h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm">{t("assistantWelcome")}</p>

              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg w-full">
                {quickPrompts.map((p) => (
                  <button
                    key={p.text}
                    onClick={() => {
                      setActiveTool(p.tool)
                      setInput(p.text)
                    }}
                    className="group px-3 py-3 text-xs rounded-2xl border border-border bg-card text-foreground
                               hover:border-primary/50 hover:bg-primary/5 hover:shadow-md
                               transition-all duration-200 flex flex-col items-center gap-2 text-center"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                    <span className="line-clamp-2 leading-tight">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const images = getMessageImages(msg)
            return (
              <AIChatBubble
                key={msg.id}
                message={getMessageText(msg)}
                isAI={msg.role === "assistant"}
                images={images}
              />
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
                {activeTool ? t('toolProcessing') : t("thinking")}...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 pb-4 md:pb-6 bg-background/80 backdrop-blur-md border-t border-border z-20">
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSendMessage}
          onFilesSelect={(files) => setSelectedFiles((prev) => [...prev, ...files])}
          onClearFile={(index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
          onClearAllFiles={() => setSelectedFiles([])}
          selectedFiles={selectedFiles}
          stop={stop}
          mode={mode}
          setMode={setMode}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
        />
      </div>
    </div>
  )
}
