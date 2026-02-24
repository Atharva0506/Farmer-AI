"use client"

import { Volume2, VolumeX, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { useState, memo } from "react"

interface AIChatBubbleProps {
  message: string
  isAI?: boolean
  timestamp?: string
  onSpeak?: () => void
  isSpeaking?: boolean
  images?: string[]
}

// Memoize to prevent re-rendering unchanged messages during streaming
const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} className="underline text-primary font-medium" target="_blank" rel="noopener noreferrer" />
        ),
        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2 last:mb-0" />,
        ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2 last:mb-0" />,
        h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 text-foreground" />,
        h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 text-foreground" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold mb-1 text-foreground" />,
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-2">
            <table {...props} className="min-w-full border-collapse text-xs" />
          </div>
        ),
        th: ({ node, ...props }) => (
          <th {...props} className="border border-border px-2 py-1 bg-muted text-left font-semibold" />
        ),
        td: ({ node, ...props }) => <td {...props} className="border border-border px-2 py-1" />,
        // FIX: Better inline/block code detection using parent context
        pre: ({ node, children, ...props }) => (
          <pre {...props} className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs">
            {children}
          </pre>
        ),
        code: ({ node, className, children, ...props }) => {
          // If code is inside a <pre>, className will have hljs language class
          const isBlock = Boolean(className)
          return isBlock ? (
            <code {...props} className={cn("text-xs font-mono", className)}>
              {children}
            </code>
          ) : (
            <code {...props} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          )
        },
        blockquote: ({ node, ...props }) => (
          <blockquote
            {...props}
            className="border-l-3 border-primary/50 pl-3 italic text-muted-foreground my-2"
          />
        ),
        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-foreground" />,
        hr: ({ node, ...props }) => <hr {...props} className="my-3 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
})

export function AIChatBubble({
  message,
  isAI = false,
  timestamp,
  onSpeak,
  isSpeaking = false,
  images,
}: AIChatBubbleProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  return (
    <>
      <div className={cn("flex gap-2 max-w-[85%]", isAI ? "self-start" : "self-end flex-row-reverse")}>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isAI ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
          )}
        >
          {isAI ? <Bot size={16} /> : <User size={16} />}
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* User Images */}
          {images && images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpandedImage(img)}
                  className="h-20 w-20 rounded-xl border border-border overflow-hidden bg-muted hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                >
                  <img src={img} alt={`Uploaded ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Message Text */}
          {message && (
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-full overflow-hidden",
                isAI
                  ? "bg-card text-card-foreground border border-border rounded-tl-none"
                  : "bg-primary text-primary-foreground rounded-tr-none"
              )}
            >
              {isAI ? (
                <div className="prose prose-sm dark:prose-invert break-words max-w-none">
                  <MarkdownContent content={message} />
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            {timestamp && <span className="text-[10px] text-muted-foreground">{timestamp}</span>}
            {isAI && onSpeak && (
              <button
                onClick={onSpeak}
                className={cn(
                  "transition-colors",
                  isSpeaking
                    ? "text-destructive hover:text-destructive/80"
                    : "text-primary hover:text-primary/80"
                )}
                aria-label={isSpeaking ? "Stop speaking" : "Speak response"}
              >
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setExpandedImage(null)}
          onKeyDown={(e) => e.key === "Escape" && setExpandedImage(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={0}
        >
          <img
            src={expandedImage}
            alt="Expanded preview"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </>
  )
}
