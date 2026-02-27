"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { X, Mic, MicOff, Phone, PhoneOff, Volume2, Sprout, Camera, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useGeolocation } from "@/hooks/use-geolocation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage, FileUIPart } from "ai"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// ─── Voice states ───────────────
type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error"

// ─── Language code mapping ───────────────
const LANG_VOICE_MAP: Record<string, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-US",
}

// ─── Animated Waveform ───────────────
function VoiceWaveform({ state, className }: { state: VoiceState; className?: string }) {
  const bars = 5
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-150",
            state === "listening" && "bg-green-400 animate-pulse",
            state === "thinking" && "bg-amber-400 animate-pulse",
            state === "speaking" && "bg-primary animate-bounce",
            state === "idle" && "bg-muted-foreground/30",
            state === "error" && "bg-destructive"
          )}
          style={{
            height:
              state === "idle"
                ? 8
                : state === "listening"
                  ? Math.random() * 24 + 12
                  : state === "speaking"
                    ? Math.random() * 32 + 8
                    : state === "thinking"
                      ? 16
                      : 6,
            animationDelay: `${i * 0.1}s`,
            animationDuration: state === "listening" ? "0.4s" : state === "speaking" ? "0.3s" : "0.8s",
          }}
        />
      ))}
    </div>
  )
}

// ─── Pulsing Ring Animation ───────────────
function PulseRings({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  return (
    <>
      <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", color)} />
      <div className={cn("absolute -inset-3 rounded-full animate-pulse opacity-10", color)} />
      <div className={cn("absolute -inset-6 rounded-full animate-pulse opacity-5", color)} style={{ animationDelay: "0.5s" }} />
    </>
  )
}

interface VoiceChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VoiceChatModal({ isOpen, onClose }: VoiceChatModalProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [lastResponse, setLastResponse] = useState("")
  const [isConversationActive, setIsConversationActive] = useState(false)
  const [conversationCount, setConversationCount] = useState(0)
  const [pendingImage, setPendingImage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const autoListenRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { t, language } = useLanguage()
  const { latitude, longitude } = useGeolocation()

  // AI SDK transport
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          data: {
            language,
            latitude,
            longitude,
          },
        },
      }),
    [language, latitude, longitude]
  )

  const { messages, sendMessage, status } = useChat({
    id: "voice-chat",
    transport,
    onError: () => {
      setVoiceState("error")
      setTimeout(() => setVoiceState("idle"), 2000)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Extract text from message parts
  const getMessageText = useCallback((msg: UIMessage): string => {
    if (!msg.parts) return ""
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as any).text)
      .join("")
  }, [])

  // ─── Image handling ───────────────
  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

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

  const handleImageUpload = useCallback(async (files: FileList) => {
    const file = Array.from(files).find(f => f.type.startsWith("image/"))
    if (!file) return

    // Pause auto-listen while processing image
    recognitionRef.current?.stop()
    window.speechSynthesis.cancel()

    const compressed = await compressImage(file)
    const dataUrl = await fileToDataUrl(compressed)
    setPendingImage(dataUrl)

    // Send image with context
    setVoiceState("thinking")
    setConversationCount((c) => c + 1)
    const filePart: FileUIPart = {
      type: "file",
      mediaType: compressed.type,
      filename: compressed.name,
      url: dataUrl,
    }
    await sendMessage({
      text: language === "mr" ? "कृपया हे चित्र तपासा" : language === "hi" ? "कृपया इस चित्र की जांच करें" : "Please analyze this image",
      files: [filePart],
    })
    // Clear preview after sending
    setTimeout(() => setPendingImage(null), 2000)
  }, [compressImage, fileToDataUrl, sendMessage, language])

  // ─── Handle navigation tool calls ───────────────
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
            onClose()
          }, 500)
        }
      }
    }
  }, [messages, router, onClose])

  // ─── Auto-speak AI responses ───────────────
  useEffect(() => {
    if (!isConversationActive || isLoading) return
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== "assistant") return

    const text = getMessageText(lastMsg)
    if (!text || text === lastResponse) return

    setLastResponse(text)
    speakText(text)
  }, [messages, isLoading, isConversationActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Update state when AI is processing ───────────────
  useEffect(() => {
    if (isLoading && voiceState !== "thinking") {
      setVoiceState("thinking")
    }
  }, [isLoading, voiceState])

  // ─── Speak text using Web Speech API ───────────────
  const speakText = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel()
      setVoiceState("speaking")

      // Clean markdown for TTS
      const clean = text
        .replace(/#{1,6}\s?/g, "")
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
        .replace(/[_~`>|[\]()-]/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .trim()

      // Truncate for TTS (very long responses)
      const truncated = clean.length > 800 ? clean.slice(0, 800) + "..." : clean

      const utterance = new SpeechSynthesisUtterance(truncated)

      // Auto-detect language from text for correct TTS voice
      let detectedLang = LANG_VOICE_MAP[language] || "en-US"
      if (/[\u0900-\u097F]/.test(truncated)) {
        // Text contains Devanagari
        // Distinguish Marathi vs Hindi using common Marathi stop words
        const isMarathi = /(?:^|\s)(आहे|नाही|आणि|पण|माझे|तुम्हाला|शेतकरी|पिक|येईल|होय|करतो|करते|साठी)(?=$|\s|[.,?!])/u.test(truncated);
        detectedLang = isMarathi ? "mr-IN" : "hi-IN";
      } else if (!/[a-zA-Z]/.test(truncated)) {
        // If no english letters but not devanagari (just numbers?) default to ui lang
      } else {
        detectedLang = "en-US"
      }

      utterance.lang = detectedLang
      utterance.rate = 0.95
      utterance.pitch = 1.0

      utterance.onend = () => {
        setVoiceState("idle")
        // Auto-listen after speaking if conversation is active
        if (autoListenRef.current && isConversationActive) {
          setTimeout(() => startListening(), 500)
        }
      }

      utterance.onerror = () => {
        setVoiceState("idle")
        if (autoListenRef.current && isConversationActive) {
          setTimeout(() => startListening(), 500)
        }
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [language, isConversationActive] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // ─── Start Listening ───────────────
  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setVoiceState("error")
      return
    }

    window.speechSynthesis.cancel()
    setTranscript("")
    setVoiceState("listening")

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = LANG_VOICE_MAP[language] || "en-US"
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t
        } else {
          interimTranscript += t
        }
      }

      setTranscript(finalTranscript || interimTranscript)

      if (finalTranscript) {
        // Auto-send when we get final transcript
        setVoiceState("thinking")
        setConversationCount((c) => c + 1)
        sendMessage({ text: finalTranscript })
      }
    }

    recognition.onerror = (event: any) => {
      console.error("Voice recognition error:", event.error)
      if (event.error === "no-speech") {
        // No speech detected — go back to idle or re-listen
        setVoiceState("idle")
        if (autoListenRef.current && isConversationActive) {
          setTimeout(() => startListening(), 1000)
        }
      } else {
        if (event.error === 'network') {
          toast.error(t('speechNetworkError') || "Speech recognition failed due to a network error. Please check your connection.")
        } else if (event.error === 'not-allowed') {
          toast.error(t('speechNotAllowedError') || "Microphone access denied.")
        }

        setVoiceState("error")
        setTimeout(() => setVoiceState("idle"), 2000)
      }
    }

    recognition.onend = () => {
      if (voiceState === "listening") {
        // Ended without result
        setVoiceState("idle")
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [language, isConversationActive, sendMessage, voiceState])

  // ─── Stop everything ───────────────
  const stopAll = useCallback(() => {
    recognitionRef.current?.stop()
    window.speechSynthesis.cancel()
    autoListenRef.current = false
    setIsConversationActive(false)
    setVoiceState("idle")
    setTranscript("")
  }, [])

  // ─── Start conversation ───────────────
  const startConversation = useCallback(() => {
    setIsConversationActive(true)
    autoListenRef.current = true
    startListening()
  }, [startListening])

  // ─── Toggle listening (manual tap) ───────────────
  const toggleListening = useCallback(() => {
    if (voiceState === "listening") {
      recognitionRef.current?.stop()
      setVoiceState("idle")
    } else if (voiceState === "speaking") {
      window.speechSynthesis.cancel()
      setVoiceState("idle")
    } else if (voiceState === "idle") {
      if (!isConversationActive) {
        startConversation()
      } else {
        startListening()
      }
    }
  }, [voiceState, isConversationActive, startConversation, startListening])

  // ─── End conversation ───────────────
  const endConversation = useCallback(() => {
    stopAll()
    onClose()
  }, [stopAll, onClose])

  // Cleanup on unmount/close
  useEffect(() => {
    if (!isOpen) {
      stopAll()
    }
    return () => stopAll()
  }, [isOpen, stopAll])

  if (!isOpen) return null

  // State-based colors
  const stateColors: Record<VoiceState, { bg: string; ring: string; text: string }> = {
    idle: { bg: "bg-primary", ring: "bg-primary", text: "text-primary" },
    listening: { bg: "bg-green-500", ring: "bg-green-500", text: "text-green-500" },
    thinking: { bg: "bg-amber-500", ring: "bg-amber-500", text: "text-amber-500" },
    speaking: { bg: "bg-primary", ring: "bg-primary", text: "text-primary" },
    error: { bg: "bg-destructive", ring: "bg-destructive", text: "text-destructive" },
  }

  const colors = stateColors[voiceState]

  const stateLabels: Record<VoiceState, string> = {
    idle: t("tapToSpeak"),
    listening: t("voiceListening"),
    thinking: t("voiceThinking"),
    speaking: t("voiceSpeaking"),
    error: t("voiceError"),
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Sprout size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">KrishiMitra AI</h3>
            <p className="text-[10px] text-muted-foreground">{t("voiceAssistant")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={endConversation}
        >
          <X size={18} />
        </Button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Visual Feedback Circle */}
        <div className="relative">
          <PulseRings active={voiceState === "listening" || voiceState === "speaking"} color={colors.ring} />
          <button
            onClick={toggleListening}
            className={cn(
              "relative h-32 w-32 md:h-40 md:w-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
              colors.bg,
              "text-white",
              voiceState === "listening" && "scale-110",
              voiceState === "thinking" && "animate-pulse",
              voiceState === "error" && "animate-shake"
            )}
          >
            {voiceState === "listening" ? (
              <Mic size={48} className="animate-pulse" />
            ) : voiceState === "thinking" ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              </div>
            ) : voiceState === "speaking" ? (
              <Volume2 size={48} className="animate-pulse" />
            ) : voiceState === "error" ? (
              <MicOff size={48} />
            ) : (
              <Mic size={48} />
            )}
          </button>
        </div>

        {/* Waveform */}
        <VoiceWaveform state={voiceState} className="h-8" />

        {/* State Label */}
        <p className={cn("text-lg font-medium transition-colors", colors.text)}>
          {stateLabels[voiceState]}
        </p>

        {/* Live Transcript */}
        {transcript && (
          <div className="max-w-sm text-center px-4 py-3 bg-card border border-border rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
        )}

        {/* Last AI Response (short preview) */}
        {lastResponse && voiceState !== "speaking" && (
          <div className="max-w-sm text-center px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {lastResponse.replace(/[#*_~`>|[\]()-]/g, "").slice(0, 200)}
              {lastResponse.length > 200 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Conversation counter */}
        {conversationCount > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {conversationCount} {language === "mr" ? "संवाद" : language === "hi" ? "बातचीत" : "exchanges"}
          </p>
        )}

        {/* Pending image preview */}
        {pendingImage && (
          <div className="h-16 w-16 rounded-xl border border-primary/30 overflow-hidden animate-in zoom-in-50 duration-200">
            <img src={pendingImage} alt="Uploaded" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
      />

      {/* Bottom Controls */}
      <div className="shrink-0 px-6 pb-8 flex items-center justify-center gap-3">
        {/* Camera button */}
        <Button
          variant="outline"
          size="lg"
          className="rounded-full h-12 w-12 shadow-md"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={20} />
        </Button>

        {/* Gallery button */}
        <Button
          variant="outline"
          size="lg"
          className="rounded-full h-12 w-12 shadow-md"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={20} />
        </Button>

        {/* End call button */}
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={endConversation}
        >
          <PhoneOff size={24} />
        </Button>

        {/* Mute/unmute toggle */}
        {isConversationActive && (
          <Button
            variant={voiceState === "listening" ? "secondary" : "outline"}
            size="lg"
            className={cn(
              "rounded-full h-14 w-14 shadow-lg transition-all",
              voiceState === "listening" && "bg-green-500 hover:bg-green-600 text-white"
            )}
            onClick={toggleListening}
          >
            {voiceState === "listening" ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
        )}
      </div>
    </div>
  )
}
