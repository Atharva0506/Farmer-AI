"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, Plus, Trash2, Loader2, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

interface ChatSession {
  id: string
  title: string
  updatedAt: string
  lastMessage: string | null
}

interface ChatHistoryProps {
  isOpen: boolean
  onClose: () => void
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  activeChatId: string | null
}

export function ChatHistory({
  isOpen,
  onClose,
  onSelectChat,
  onNewChat,
  activeChatId,
}: ChatHistoryProps) {
  const [chats, setChats] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const fetchChats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/chat/history")
      if (res.ok) {
        const data = await res.json()
        setChats(data.chats || [])
      }
    } catch {
      toast.error("Failed to load chat history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) fetchChats()
  }, [isOpen, fetchChats])

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch("/api/chat/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      })
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId))
        if (activeChatId === chatId) onNewChat()
      }
    } catch {
      toast.error("Failed to delete chat")
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
    if (diffHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 md:relative md:inset-auto">
      {/* Backdrop (mobile) */}
      <div
        className="absolute inset-0 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col z-50 md:relative md:w-full animate-in slide-in-from-left-full md:animate-none duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare size={16} />
            {t("chatHistory") || "Chat History"}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                onNewChat()
                onClose()
              }}
              title="New Chat"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onClose}
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm p-8">
              {t("noChats") || "No previous chats"}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id)
                    onClose()
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all group flex items-start gap-2",
                    activeChatId === chat.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  )}
                >
                  <MessageSquare size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {chat.title}
                    </p>
                    {chat.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {chat.lastMessage}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDate(chat.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
