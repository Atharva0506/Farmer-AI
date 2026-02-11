"use client"

import { cn } from "@/lib/utils"

interface AIWaveformProps {
    isActive?: boolean
    className?: string
}

export function AIWaveform({ isActive = true, className }: AIWaveformProps) {
    if (!isActive) return null

    return (
        <div className={cn("flex items-center justify-center gap-1", className)} aria-label="Voice waveform animation">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="w-1 rounded-full bg-current animate-waveform"
                    style={{
                        animationDelay: `${i * 0.15}s`,
                        height: "8px",
                    }}
                />
            ))}
        </div>
    )
}
