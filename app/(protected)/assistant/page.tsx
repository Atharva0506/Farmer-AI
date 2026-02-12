"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sprout, ChevronDown, Mic, MicOff, Volume2, VolumeX, Brain, Sparkles, Camera } from "lucide-react"
import { AIChatBubble } from "@/components/features/assistant/ai-chat-bubble"
import { AIWaveform } from "@/components/features/assistant/ai-waveform"
import { ChatInput } from "@/components/features/assistant/chat-input"
import { useLanguage } from "@/lib/language-context"
import { useChat, UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { cn } from "@/lib/utils"

export default function AssistantPage() {
  const [mode, setMode] = useState<"think" | "research">("think")
  const [voiceMode, setVoiceMode] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [input, setInput] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const lastSpokenIdRef = useRef<string>("")
  const { t, language } = useLanguage()

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { data: { mode, voiceMode } },
    }),
    onFinish: ({ message }) => {
      // Auto-speak AI responses in voice mode
      const textContent = getMessageText(message)
      if (voiceMode && autoSpeak && message.role === "assistant" && message.id !== lastSpokenIdRef.current) {
        lastSpokenIdRef.current = message.id
        speakText(textContent)
      }
    },
    onError: (error) => console.error("Chat error:", error),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Helper to extract text from UIMessage parts
  const getMessageText = useCallback((msg: UIMessage): string => {
    if (!msg.parts) return ""
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("")
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ─── VOICE ENGINE ──────────────────────────
  const getLangCode = useCallback(() => {
    return language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-US"
  }, [language])

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    // Clean text for speech (remove markdown)
    const clean = text
      .replace(/[#*_~`>]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, ". ")
      .trim()

    if (!clean) return

    setIsSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = getLangCode()
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onend = () => {
      setIsSpeaking(false)
      // Auto-listen again in voice mode after AI finishes speaking
      if (voiceMode) {
        setTimeout(() => startListening(), 800)
      }
    }
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [getLangCode, voiceMode])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.")
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) { /* ignore */ }
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = getLangCode()
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsVoiceListening(true)
      setVoiceTranscript("")
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setVoiceTranscript(final || interim)

      if (final) {
        setIsVoiceListening(false)
        // Auto-send in voice mode
        if (voiceMode) {
          sendVoiceMessage(final)
        } else {
          setInput((prev) => prev + (prev ? " " : "") + final)
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech error:", event.error)
      }
      setIsVoiceListening(false)
    }

    recognition.onend = () => setIsVoiceListening(false)
    recognition.start()
  }, [getLangCode, voiceMode])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsVoiceListening(false)
  }, [])

  const sendVoiceMessage = async (text: string) => {
    if (!text.trim()) return
    setVoiceTranscript("")
    await sendMessage({ text })
  }

  const toggleVoiceMode = () => {
    if (voiceMode) {
      setVoiceMode(false)
      stopListening()
      stopSpeaking()
    } else {
      setVoiceMode(true)
      setAutoSpeak(true)
    }
  }

  // ─── SEND MESSAGE (text mode) ──────────────────────────
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() && !selectedFile) return

    const currentInput = input
    const currentFile = selectedFile
    setInput("")
    setSelectedFile(null)

    if (currentFile) {
      const dt = new DataTransfer()
      dt.items.add(currentFile)
      await sendMessage({ text: currentInput, files: dt.files })
    } else {
      await sendMessage({ text: currentInput })
    }
  }

  // ─── VOICE MODE UI ──────────────────────────
  if (voiceMode) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background relative">
        {/* Voice Mode Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sprout className="text-primary-foreground h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{t("appName")}</h2>
              <p className="text-[10px] text-muted-foreground">{t("voiceAssistant")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoSpeak(!autoSpeak)}
              className={cn("p-2 rounded-full transition-colors", autoSpeak ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
              {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={toggleVoiceMode}
              className="px-3 py-1.5 text-xs rounded-full bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
              {t("exitVoice")}
            </button>
          </div>
        </div>

        {/* Chat Messages (simplified for voice) */}
        <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2">
          <div className="flex flex-col gap-4 px-4 py-6 max-w-3xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-muted-foreground mt-20">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mic size={32} className="text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">{t("voiceGreeting")}</p>
                <p className="text-sm">{t("voiceHint")}</p>
              </div>
            )}
            {messages.map((msg: any) => (
              <AIChatBubble
                key={msg.id}
                message={getMessageText(msg)}
                isAI={msg.role === "assistant"}
                timestamp={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                onSpeak={msg.role === "assistant" ? () => speakText(getMessageText(msg)) : undefined}
              />
            ))}
            {isLoading && (
              <div className="self-start flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-none animate-pulse">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{t("thinking")}...</span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* AI Speaking Overlay */}
        {isSpeaking && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur text-primary-foreground px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <AIWaveform isActive className="h-4" />
            <span className="text-xs font-semibold">{t("aiSpeaking")}</span>
            <button onClick={stopSpeaking} className="ml-1 hover:text-white/80"><ChevronDown size={14} /></button>
          </div>
        )}

        {/* Voice Control Area */}
        <div className="shrink-0 p-6 pb-8 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            {/* Transcript */}
            {voiceTranscript && (
              <div className="bg-card border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground animate-in fade-in w-full text-center">
                "{voiceTranscript}"
              </div>
            )}

            {/* Big Mic Button */}
            <div className="relative flex items-center justify-center">
              {isVoiceListening && (
                <>
                  <div className="absolute w-32 h-32 rounded-full bg-primary/15 animate-ping" />
                  <div className="absolute w-28 h-28 rounded-full bg-primary/10 animate-pulse-ring" />
                </>
              )}
              <button
                onClick={isVoiceListening ? stopListening : startListening}
                disabled={isSpeaking || isLoading}
                className={cn(
                  "relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-xl",
                  isVoiceListening
                    ? "bg-destructive text-destructive-foreground scale-110"
                    : isSpeaking || isLoading
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                )}
              >
                {isVoiceListening ? (
                  <div className="flex gap-1 items-center h-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-1.5 bg-white animate-waveform rounded-full" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                ) : (
                  <Mic size={32} />
                )}
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {isVoiceListening ? t("listening") : isSpeaking ? t("aiSpeaking") : isLoading ? t("thinking") + "..." : t("tapToSpeak")}
            </p>

            {/* Quick voice prompts */}
            {messages.length === 0 && !isVoiceListening && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[t("voicePrompt1"), t("voicePrompt2"), t("voicePrompt3")].map((prompt) => (
                  <button key={prompt} onClick={() => sendVoiceMessage(prompt)}
                    className="px-3 py-1.5 text-xs rounded-full border border-border bg-card text-foreground hover:border-primary hover:bg-primary/5 transition-colors">
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── TEXT+VOICE CHAT MODE (default) ──────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AIWaveform isActive className="h-4" />
          <span className="text-xs font-semibold">{t("aiSpeaking")}</span>
          <button onClick={stopSpeaking} className="ml-1 hover:text-white/80"><ChevronDown size={14} /></button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2 relative">
        <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto min-h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-muted-foreground mt-20">
              <Sprout size={48} className="mb-4 text-primary/50" />
              <p className="text-lg font-medium text-foreground mb-2">{t("appName")}</p>
              <p className="mb-6">{t("askMe")}</p>

              {/* Voice mode toggle */}
              <button onClick={toggleVoiceMode}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors mb-4">
                <Mic size={18} />
                <span className="text-sm font-medium">{t("switchToVoice")}</span>
              </button>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  { text: t("quickCrop"), icon: "🌾" },
                  { text: t("quickDisease"), icon: "🔍" },
                  { text: t("quickScheme"), icon: "📋" },
                  { text: t("quickSell"), icon: "💰" },
                ].map((p) => (
                  <button key={p.text} onClick={() => { setInput(p.text); }}
                    className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                    <span>{p.icon}</span> {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg: any) => (
            <AIChatBubble
              key={msg.id}
              message={getMessageText(msg)}
              isAI={msg.role === "assistant"}
              timestamp={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              onSpeak={msg.role === "assistant" ? () => speakText(getMessageText(msg)) : undefined}
            />
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("thinking")}...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 pb-4 md:pb-6 bg-background/80 backdrop-blur-md border-t border-border z-20">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <button onClick={toggleVoiceMode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Mic size={12} /> {t("voiceMode")}
          </button>
        </div>
        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSubmit={handleSendMessage}
          onFileSelect={setSelectedFile}
          onClearFile={() => setSelectedFile(null)}
          selectedFile={selectedFile}
          stop={stop}
          mode={mode}
          setMode={setMode}
        />
      </div>
    </div>
  )
}
