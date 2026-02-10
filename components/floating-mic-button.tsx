"use client"

import { VoiceInputButton } from "./voice-input-button"

export function FloatingMicButton() {
  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-8 md:right-8 lg:bottom-8 lg:right-8">
      <VoiceInputButton size="lg" />
    </div>
  )
}
