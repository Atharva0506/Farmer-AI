"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { MarketplaceCard } from "@/components/features/market/marketplace-card"
import { MarketplaceFilters } from "@/components/features/market/marketplace-filters"
import { useLanguage } from "@/lib/language-context"

interface Listing {
  id: string
  cropName: string
  cropNameLocal?: string
  quantity: string
  unit: string
  pricePerUnit: number
  location: string | null
  imageUrl: string | null
  description: string | null
  status: string
  user: { id: string; name: string | null; phone: string | null; location: string | null }
}

const categories = [
  { key: "all", label: "All Crops", labelKey: "allCrops" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "grains", label: "Grains" },
  { key: "cash_crops", label: "Cash Crops" },
]

// Map crop names to categories for filtering
const cropCategoryMap: Record<string, string> = {
  tomato: "vegetables", onion: "vegetables", potato: "vegetables",
  wheat: "grains", rice: "grains", soybean: "grains", bajra: "grains", jowar: "grains",
  grapes: "fruits", banana: "fruits", mango: "fruits", pomegranate: "fruits", orange: "fruits",
  sugarcane: "cash_crops", cotton: "cash_crops", turmeric: "cash_crops",
}

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [maxDistance, setMaxDistance] = useState(100)
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    async function fetchListings() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/marketplace")
        if (!res.ok) throw new Error("Failed to load listings")
        const data = await res.json()
        setListings(data.listings || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchListings()
  }, [])

  const filteredListings = listings.filter((l) => {
    const category = cropCategoryMap[l.cropName.toLowerCase()] || "other"
    const matchesCategory = selectedCategory === "all" || category === selectedCategory
    const matchesSearch =
      !searchQuery || l.cropName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8 max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("marketplace")}</h1>
        <p className="text-muted-foreground text-sm">{t("buyerDesc")}</p>
      </div>

      <MarketplaceFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
      />

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-destructive">
            {error}
          </div>
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <MarketplaceCard
              key={listing.id}
              cropName={listing.cropName}
              quantity={`${listing.quantity} ${listing.unit}`}
              price={`₹${listing.pricePerUnit}/${listing.unit}`}
              location={listing.user?.location || "Unknown"}
              distance=""
              imageUrl={listing.imageUrl || "/placeholder.svg"}
              farmerName={listing.user?.name || "Anonymous"}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No listings found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
