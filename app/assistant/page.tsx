"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Plus, Image as ImageIcon, Sprout, Stethoscope, ShoppingCart, Users, FileText, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIChatBubble } from "@/components/ai-chat-bubble"
import { VoiceInputButton } from "@/components/voice-input-button"
import { AIWaveform } from "@/components/ai-waveform"
import { useLanguage } from "@/lib/language-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  text: string
  isAI: boolean
  timestamp: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Namaskar! I am your AI farming assistant. How can I help you today? You can ask about crop diseases, market prices, government schemes, or anything about farming.",
    isAI: true,
    timestamp: "10:00 AM",
  },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedContext, setSelectedContext] = useState<{ type: string; label: string; icon?: any } | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, selectedContext]) // Scroll when context changes too

  const sendMessage = (text: string) => {
    if (!text.trim() && !selectedContext) return

    // Construct message with context if present
    const fullText = selectedContext ? `[${selectedContext.label}] ${text}` : text

    const userMsg: Message = {
      id: Date.now().toString(),
      text: fullText,
      isAI: false,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setSelectedContext(null)
    setIsTyping(true)

    setTimeout(() => {
      const responseText = getAIResponse(fullText)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isAI: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
      speakResponse(responseText)
    }, 1500)
  }

  const speakResponse = (text: string) => {
    setIsSpeaking(true)
    const duration = Math.min(Math.max(text.length * 50, 1000), 5000)
    setTimeout(() => {
      setIsSpeaking(false)
    }, duration)
  }

  const getAIResponse = (input: string): string => {
    const lower = input.toLowerCase()
    if (lower.includes("tomato") || lower.includes("disease") || lower.includes("crop")) {
      return "I can help with crop diseases. Please upload a photo of the affected crop and I will analyze it. You can also describe the symptoms you are seeing."
    }
    if (lower.includes("sell") || lower.includes("market") || lower.includes("price")) {
      return "Current market rates: Tomato Rs 25-30/kg, Onion Rs 18-22/kg, Wheat Rs 2200/quintal. Would you like to post your produce for sale?"
    }
    if (lower.includes("scheme") || lower.includes("government") || lower.includes("subsidy")) {
      return "Based on your profile, you may be eligible for PM-KISAN (Rs 6000/year), Fasal Bima Yojana, and Soil Health Card Scheme. Would you like me to check eligibility?"
    }
    return "I understand your question. Let me help you with that. Could you provide more details about what kind of help you need with your farming?"
  }

  const handleServiceSelect = (service: string, icon: any) => {
    setSelectedContext({ type: 'service', label: service, icon })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedContext({ type: 'image', label: e.target.files[0].name, icon: ImageIcon })
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background relative">

      {/* AI Speaking Indicator - Floating Overlay */}
      {isSpeaking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 backdrop-blur text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AIWaveform isActive className="h-4" />
          <span className="text-xs font-semibold">AI Speaking...</span>
          <button onClick={() => setIsSpeaking(false)} className="ml-1 hover:text-white/80">
            <ChevronDown size={14} />
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto w-full no-scrollbar pb-2">
        <div className="flex flex-col gap-6 px-4 py-6 max-w-2xl mx-auto min-h-full">
          {messages.map((msg) => (
            <AIChatBubble
              key={msg.id}
              message={msg.text}
              isAI={msg.isAI}
              timestamp={msg.timestamp}
              onSpeak={msg.isAI ? () => speakResponse(msg.text) : undefined}
            />
          ))}

          {isTyping && (
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
        <div className="max-w-2xl mx-auto">
          {/* Selected Context Chip (Gemini Style) */}
          {selectedContext && (
            <div className="mb-2 ml-14 animate-in slide-in-from-bottom-2 fade-in">
              <div className="inline-flex items-center gap-2 bg-secondary/80 text-secondary-foreground border border-border px-3 py-1.5 rounded-lg text-sm shadow-sm backdrop-blur-sm">
                {selectedContext.icon && <selectedContext.icon size={14} className="text-primary" />}
                <span className="font-medium max-w-[200px] truncate">{selectedContext.label}</span>
                <button
                  onClick={() => setSelectedContext(null)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-12 w-12 rounded-full border-border bg-muted/50 text-muted-foreground hover:text-primary hover:bg-background hover:border-primary/50 shadow-sm"
                >
                  <Plus size={24} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 p-2">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Services</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleServiceSelect("Crop Help", Sprout)}>
                  <Sprout className="mr-2 h-4 w-4 text-primary" />
                  <span>Crop Help</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("Disease Check", Stethoscope)}>
                  <Stethoscope className="mr-2 h-4 w-4 text-accent" />
                  <span>Disease Check</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("Sell Produce", ShoppingCart)}>
                  <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                  <span>Sell Produce</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("Find Buyers", Users)}>
                  <Users className="mr-2 h-4 w-4 text-accent" />
                  <span>Find Buyers</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("Gov Schemes", FileText)}>
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  <span>Gov Schemes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Upload Photo</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />

            <div className="flex-1 bg-muted/50 border border-border rounded-[24px] flex items-center p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm min-h-[48px]">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
                placeholder={selectedContext ? "Add details..." : t("typeMessage")}
                className="flex-1 bg-transparent px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
              />

              {inputText.trim() || selectedContext ? (
                <Button
                  size="icon"
                  onClick={() => sendMessage(inputText)}
                  className="shrink-0 h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-all animate-in zoom-in"
                >
                  <Send size={18} className="ml-0.5" />
                </Button>
              ) : (
                <div className="mr-1">
                  <VoiceInputButton
                    size="sm"
                    onResult={(text) => sendMessage(text)}
                    className="h-10 w-10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
