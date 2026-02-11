"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud, Sun, Thermometer, Droplets, Wind, MapPin, Loader2 } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"

interface WeatherData {
    temperature: number
    windspeed: number
    weathercode: number
    humidity?: number // Open-Meteo current_weather doesn't give humidity directly in simple call, need hourly
}

export function WeatherWidget() {
    const { latitude, longitude, loading: locationLoading, error: locationError } = useGeolocation()
    const [weather, setWeather] = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (latitude && longitude) {
            fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            )
                .then((res) => res.json())
                .then((data) => {
                    setWeather(data.current_weather)
                    setLoading(false)
                })
                .catch((err) => {
                    console.error(err)
                    setLoading(false)
                })
        } else if (!locationLoading && !latitude) {
            setLoading(false) // No location found
        }
    }, [latitude, longitude, locationLoading])

    if (locationLoading) {
        return (
            <Card className="mb-6 border border-border bg-card">
                <CardContent className="p-8 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Locating...</span>
                </CardContent>
            </Card>
        )
    }

    if (locationError || !weather) {
        return (
            <Card className="mb-6 border border-border bg-card">
                <CardContent className="p-8 flex items-center justify-center flex-col gap-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        {locationError ? "Location access denied" : "Weather data unavailable"}
                    </span>
                </CardContent>
            </Card>
        )
    }

    const isSunny = weather.weathercode <= 3 // Simplification

    return (
        <Card className="mb-6 border border-border bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cloud size={100} />
            </div>
            <CardContent className="p-5">
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        {isSunny ? (
                            <Sun size={40} className="text-warning fill-warning/20 animate-spin-slow" />
                        ) : (
                            <Cloud size={40} className="text-primary fill-primary/10" />
                        )}
                        <div>
                            {/* Weather code mapping could be more extensive */}
                            <p className="text-sm font-medium text-foreground/80">
                                {isSunny ? "Sunny/Clear" : "Cloudy/Rainy"}
                            </p>
                            <p className="text-3xl font-bold text-foreground">{weather.temperature}&#176;C</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md shadow-sm">
                            <Thermometer size={14} className="text-accent" />
                            <span className="text-sm font-semibold text-foreground">{weather.temperature}&#176;</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md shadow-sm">
                            <Wind size={14} className="text-primary" />
                            <span className="text-sm font-semibold text-foreground">{weather.windspeed} km/h</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
