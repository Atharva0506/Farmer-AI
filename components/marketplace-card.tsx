"use client"

import { MapPin, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"

interface MarketplaceCardProps {
  cropName: string
  cropNameLocal?: string
  quantity: string
  price: string
  location: string
  distance: string
  imageUrl: string
  farmerName: string
}

export function MarketplaceCard({
  cropName,
  cropNameLocal,
  quantity,
  price,
  location,
  distance,
  imageUrl,
  farmerName,
}: MarketplaceCardProps) {
  const { t } = useLanguage()

  return (
    <Card className="overflow-hidden border border-border hover:shadow-lg transition-shadow group bg-card">
      <div className="relative h-48 bg-muted overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={cropName}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-0 right-0 p-3 w-full bg-gradient-to-b from-black/60 to-transparent flex justify-end">
          <Badge variant="secondary" className="font-bold text-sm backdrop-blur-md bg-background/80 text-foreground border-0 shadow-sm">
            {price}
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 p-3 w-full bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="font-bold text-white text-xl leading-tight drop-shadow-md">
            {cropNameLocal || cropName}
          </h3>
          {cropNameLocal && <p className="text-white/80 text-xs font-medium">{cropName}</p>}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{farmerName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} className="text-primary" />
              <span>{location} • {distance}</span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              {quantity}
            </Badge>
          </div>
        </div>

        <Button className="w-full h-10 font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98]" size="sm">
          <Phone className="mr-2 h-4 w-4" />
          {t("loginToContact")}
        </Button>
      </CardContent>
    </Card>
  )
}
