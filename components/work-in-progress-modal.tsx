"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

export function WorkInProgressModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Show modal on first load
    const hasSeenModal = localStorage.getItem("work-in-progress-modal-seen")
    if (!hasSeenModal) {
      setIsOpen(true)
      localStorage.setItem("work-in-progress-modal-seen", "true")
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Under Development</DialogTitle>
          <DialogDescription className="text-base pt-2">
            We're currently working on this project to deliver the best experience for farmers. Thank you for your patience!
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4 text-center text-sm text-muted-foreground">
          <p>This platform is actively being developed with new features and improvements.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
