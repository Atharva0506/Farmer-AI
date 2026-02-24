"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Cloud, Sun, Thermometer, Droplets, Wind, MapPin, Loader2,
  CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning, RefreshCw
} from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"
import { Button } from "@/components/ui/button"

interface WeatherData {
  temperature: number
  windspeed: number
  weathercode: number
  humidity: number
}

// WMO Weather interpretation codes
const weatherDescriptions: Record<
  number,
  { label: string; icon: "sun" | "cloud" | "rain" | "drizzle" | "snow" | "fog" | "thunder" }
> = {
  0: { label: "Clear Sky", icon: "sun" },
  1: { label: "Mainly Clear", icon: "sun" },
  2: { label: "Partly Cloudy", icon: "cloud" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Foggy", icon: "fog" },
  48: { label: "Rime Fog", icon: "fog" },
  51: { label: "Light Drizzle", icon: "drizzle" },
  53: { label: "Moderate Drizzle", icon: "drizzle" },
  55: { label: "Dense Drizzle", icon: "drizzle" },
  61: { label: "Slight Rain", icon: "rain" },
  63: { label: "Moderate Rain", icon: "rain" },
  65: { label: "Heavy Rain", icon: "rain" },
  71: { label: "Slight Snow", icon: "snow" },
  73: { label: "Moderate Snow", icon: "snow" },
  75: { label: "Heavy Snow", icon: "snow" },
  80: { label: "Rain Showers", icon: "rain" },
  81: { label: "Moderate Showers", icon: "rain" },
  82: { label: "Heavy Showers", icon: "rain" },
  95: { label: "Thunderstorm", icon: "thunder" },
  96: { label: "Thunderstorm w/ Hail", icon: "thunder" },
  99: { label: "Thunderstorm w/ Heavy Hail", icon: "thunder" },
}

function getWeatherInfo(code: number) {
  return weatherDescriptions[code] || { label: "Unknown", icon: "cloud" as const }
}

const WeatherIcon = ({ type, size = 40 }: { type: string; size?: number }) => {
  switch (type) {
    case "sun": return <Sun size={size} className="text-warning fill-warning/20" />
    case "rain": return <CloudRain size={size} className="text-blue-500 fill-blue-500/10" />
    case "drizzle": return <CloudDrizzle size={size} className="text-blue-400 fill-blue-400/10" />
    case "snow": return <CloudSnow size={size} className="text-slate-400 fill-slate-400/10" />
    case "fog": return <CloudFog size={size} className="text-gray-400 fill-gray-400/10" />
    case "thunder": return <CloudLightning size={size} className="text-yellow-500 fill-yellow-500/10" />
    default: return <Cloud size={size} className="text-primary fill-primary/10" />
  }
}

// Cache weather for 15 minutes
const CACHE_DURATION = 15 * 60 * 1000

export function WeatherWidget() {
  const { latitude, longitude, loading: locationLoading, error: locationError, retry } = useGeolocation()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<{ data: WeatherData; timestamp: number; lat: number; lon: number } | null>(null)

  useEffect(() => {
    // FIX: Use !== null instead of falsy check (latitude 0 is valid)
    if (latitude === null || longitude === null) {
      if (!locationLoading) setLoading(false)
      return
    }

    // Check cache: same coords within 15 min → skip fetch
    if (
      cacheRef.current &&
      cacheRef.current.lat === latitude &&
      cacheRef.current.lon === longitude &&
      Date.now() - cacheRef.current.timestamp < CACHE_DURATION
    ) {
      setWeather(cacheRef.current.data)
      setLoading(false)
      return
    }

    // Abort previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)

    // FIX: Use modern `current=` params instead of deprecated `current_weather=true`
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        const current = data.current
        if (current) {
          const weatherData: WeatherData = {
            temperature: current.temperature_2m,
            windspeed: current.wind_speed_10m,
            weathercode: current.weather_code,
            humidity: current.relative_humidity_2m,
          }
          setWeather(weatherData)
          cacheRef.current = {
            data: weatherData,
            timestamp: Date.now(),
            lat: latitude,
            lon: longitude,
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Weather fetch error:", err)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [latitude, longitude, locationLoading])

  if (locationLoading || loading) {
    return (
      <Card className="mb-6 border border-border bg-card">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            {locationLoading ? "Locating..." : "Loading weather..."}
          </span>
        </CardContent>
      </Card>
    )
  }

  if (locationError || !weather) {
    return (
      <Card className="mb-6 border border-border bg-card">
        <CardContent className="p-8 flex items-center justify-center flex-col gap-3">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground text-center text-sm">
            {locationError || "Weather data unavailable"}
          </span>
          <Button variant="outline" size="sm" onClick={retry} className="gap-2">
            <RefreshCw size={14} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const weatherInfo = getWeatherInfo(weather.weathercode)

  return (
    <Card className="mb-6 border border-border bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Cloud size={100} />
      </div>
      <CardContent className="p-5">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <WeatherIcon type={weatherInfo.icon} />
            <div>
              <p className="text-sm font-medium text-foreground/80">{weatherInfo.label}</p>
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
            <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md shadow-sm">
              <Droplets size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-foreground">{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
