"use client"

import { Volume2, Bot, User, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from "react"

interface AIChatBubbleProps {
    message: string
    isAI?: boolean
    timestamp?: string
    onSpeak?: () => void
    images?: string[]
}

export function AIChatBubble({ message, isAI = false, timestamp, onSpeak, images }: AIChatBubbleProps) {
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
                                    <img
                                        src={img}
                                        alt={`Uploaded ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
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
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} className="underline text-primary font-medium" target="_blank" rel="noopener noreferrer" />,
                                            p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                                            ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2 last:mb-0" />,
                                            ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2 last:mb-0" />,
                                            h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 text-foreground" />,
                                            h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 text-foreground" />,
                                            h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold mb-1 text-foreground" />,
                                            table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table {...props} className="min-w-full border-collapse text-xs" /></div>,
                                            th: ({ node, ...props }) => <th {...props} className="border border-border px-2 py-1 bg-muted text-left font-semibold" />,
                                            td: ({ node, ...props }) => <td {...props} className="border border-border px-2 py-1" />,
                                            code: ({ node, className, children, ...props }) => {
                                                const isInline = !className
                                                return isInline
                                                    ? <code {...props} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                                    : <code {...props} className={cn("block bg-muted p-2 rounded-lg text-xs font-mono overflow-x-auto", className)}>{children}</code>
                                            },
                                            blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-3 border-primary/50 pl-3 italic text-muted-foreground my-2" />,
                                        }}
                                    >
                                        {message}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{message}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-1">
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

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedImage(null)}
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
