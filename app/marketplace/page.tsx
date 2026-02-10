"use client"

import { useState } from "react"
import { MarketplaceCard } from "@/components/marketplace-card"
import { MarketplaceFilters } from "@/components/marketplace-filters"
import { useLanguage } from "@/lib/language-context"

interface Listing {
  id: string
  cropName: string
  cropNameLocal: string
  quantity: string
  price: string
  location: string
  distance: string
  farmerName: string
  imageUrl: string
  category: string
}

const listings: Listing[] = [
  {
    id: "1",
    cropName: "Tomato",
    cropNameLocal: "टमाटर",
    quantity: "500 kg",
    price: "Rs 28/kg",
    location: "Nashik",
    distance: "15 km",
    farmerName: "Ramesh Patil",
    imageUrl: "https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400&h=300&fit=crop",
    category: "vegetables",
  },
  {
    id: "2",
    cropName: "Onion",
    cropNameLocal: "कांदा",
    quantity: "1000 kg",
    price: "Rs 20/kg",
    location: "Pune",
    distance: "25 km",
    farmerName: "Suresh More",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop",
    category: "vegetables",
  },
  {
    id: "3",
    cropName: "Wheat",
    cropNameLocal: "गहू",
    quantity: "20 quintal",
    price: "Rs 2,200/q",
    location: "Solapur",
    distance: "40 km",
    farmerName: "Ganesh Jadhav",
    imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
    category: "grains",
  },
  {
    id: "4",
    cropName: "Grapes",
    cropNameLocal: "द्राक्षे",
    quantity: "200 kg",
    price: "Rs 60/kg",
    location: "Sangli",
    distance: "30 km",
    farmerName: "Prakash Kulkarni",
    imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&h=300&fit=crop",
    category: "fruits",
  },
  {
    id: "5",
    cropName: "Sugarcane",
    cropNameLocal: "ऊस",
    quantity: "50 ton",
    price: "Rs 3,500/ton",
    location: "Kolhapur",
    distance: "55 km",
    farmerName: "Vijay Shinde",
    imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop",
    category: "cash_crops",
  },
  {
    id: "6",
    cropName: "Soybean",
    cropNameLocal: "सोयाबीन",
    quantity: "15 quintal",
    price: "Rs 4,800/q",
    location: "Latur",
    distance: "70 km",
    farmerName: "Balaji Deshmukh",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
    category: "grains",
  },
]

const categories = [
  { key: "all", label: "All Crops", labelKey: "allCrops" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruits", label: "Fruits" },
  { key: "grains", label: "Grains" },
  { key: "cash_crops", label: "Cash Crops" },
]

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [maxDistance, setMaxDistance] = useState(100)
  const { t } = useLanguage()

  const filteredListings = listings.filter((l) => {
    const matchesCategory = selectedCategory === "all" || l.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      l.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.cropNameLocal.includes(searchQuery)
    const distanceVal = parseInt(l.distance)
    const matchesDistance = distanceVal <= maxDistance

    return matchesCategory && matchesSearch && matchesDistance
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
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <MarketplaceCard
              key={listing.id}
              {...listing}
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
