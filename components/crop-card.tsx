"use client"

import React from "react"

import { Leaf, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface CropCardProps {
  name: string
  status: string
  health: "good" | "warning" | "danger"
  area: string
  icon?: React.ReactNode
}

export function CropCard({ name, status, health, area, icon }: CropCardProps) {
  const healthColors = {
    good: "bg-primary/15 text-primary border-primary/30",
    warning: "text-accent bg-accent/15 border-accent/30",
    danger: "bg-destructive/15 text-destructive border-destructive/30",
  }

  return (
    <Card className="border border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              {icon || <Leaf size={22} className="text-primary" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">{name}</h3>
              <p className="text-xs text-muted-foreground">{area}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${healthColors[health]}`}
          >
            {status}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-primary">
          <TrendingUp size={12} />
          <span className="font-medium">Growing well</span>
        </div>
      </CardContent>
    </Card>
  )
}
