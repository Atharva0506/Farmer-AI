"use client"

import { useState, useRef, useEffect } from "react"
import { Sprout, ChevronDown } from "lucide-react"
import { AIChatBubble } from "@/components/features/assistant/ai-chat-bubble"
import { AIWaveform } from "@/components/features/assistant/ai-waveform"
import { ChatInput } from "@/components/features/assistant/chat-input"
import { useLanguage } from "@/lib/language-context"
import { useChat } from "@ai-sdk/react"

export default function AssistantPage() {
  const [mode, setMode] = useState<'think' | 'research'>('think')

  const { messages, append, status, stop } = useChat({
    api: '/api/chat',
    body: {
      data: { mode }
    },
    onError: (error) => {
      console.error("Chat error:", error)
    }
  })
  const [input, setInput] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  const isLoading = status === 'streaming' || status === 'submitted'

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() && !selectedFile) return

    const currentInput = input
    const currentFile = selectedFile

    // Clear input immediately for better UX
    setInput("")
    setSelectedFile(null)

    const message: any = {
      role: 'user',
      content: currentInput,
    }

    const options: any = {
      body: { data: { mode } }
    }
    if (currentFile) {
      const dt = new DataTransfer()
      dt.items.add(currentFile)
      options.experimental_attachments = dt.files
    }

    await append(message, options)
  }

  const speakResponse = (text: string) => {
    setIsSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">

      {/* AI Speaking Indicator - Floating Overlay */}
      {isSpeaking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AIWaveform isActive className="h-4" />
          <span className="text-xs font-semibold">{t("aiSpeaking")}</span>
          <button onClick={() => { setIsSpeaking(false); window.speechSynthesis.cancel() }} className="ml-1 hover:text-white/80">
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2 relative">
        <div className="flex flex-col gap-6 px-4 py-6 max-w-3xl mx-auto min-h-full">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-muted-foreground mt-20">
              <Sprout size={48} className="mb-4 text-primary/50" />
              <p>{t("askMe")}</p>
            </div>
          )}
          {messages.map((msg: any) => (
            <AIChatBubble
              key={msg.id}
              message={msg.content}
              isAI={msg.role === 'assistant'}
              timestamp={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              onSpeak={msg.role === 'assistant' ? () => speakResponse(msg.content) : undefined}
            />
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-none animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{t("thinking")}...</span>
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
