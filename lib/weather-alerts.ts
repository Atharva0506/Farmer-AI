/**
 * lib/weather-alerts.ts — Micro-Climate Weather Alerts for Farming.
 * Innovation Feature #10: Combines weather data + crop lifecycle for proactive alerts.
 * Fetches real weather from Open-Meteo and generates crop-specific farming alerts.
 */
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";
import {
    getCachedResponse,
    setCachedResponse,
    makeCacheKey,
} from "@/lib/cache";

// ─── Schema ──────────────────────────────────
export const weatherAlertSchema = z.object({
    location: z.string().describe("Location name or coordinates"),
    currentConditions: z.object({
        temperature: z.number(),
        humidity: z.number(),
        windSpeed: z.number(),
        condition: z.string().describe("e.g. 'Clear', 'Rainy', 'Cloudy'"),
    }),
    alerts: z.array(
        z.object({
            type: z.enum(["critical", "warning", "advisory", "favorable"]),
            title: z.string().describe("Short alert title"),
            message: z.string().describe("Detailed alert message"),
            affectedCrops: z.array(z.string()).describe("Which crops are affected"),
            recommendedAction: z.string().describe("What the farmer should do"),
            timeframe: z.string().describe("When action is needed, e.g. 'Next 24 hours'"),
        })
    ).describe("Weather-based farming alerts"),
    dailyFarmingTasks: z.array(
        z.object({
            day: z.string().describe("Day name or date"),
            temperature: z.object({ min: z.number(), max: z.number() }),
            rainChance: z.number(),
            bestActivity: z.string().describe("Best farming activity for this day"),
            avoid: z.string().describe("Activities to avoid"),
        })
    ).describe("5-day farming task planner"),
    irrigationAdvice: z.object({
        shouldIrrigate: z.boolean(),
        reason: z.string(),
        nextIrrigationDate: z.string().describe("When to next irrigate"),
    }),
});

export type WeatherAlerts = z.infer<typeof weatherAlertSchema>;

const LANG_MAP: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
};

export interface WeatherAlertParams {
    latitude?: number;
    longitude?: number;
    crops?: string[];
    region?: string;
    language?: string;
}

export async function generateWeatherAlerts(
    params: WeatherAlertParams
): Promise<WeatherAlerts> {
    const { latitude = 21.146, longitude = 79.088, crops = [], region, language = "en" } = params;
    const langName = LANG_MAP[language] || "English";
    const startTime = Date.now();

    const cacheKey = makeCacheKey("weather-alerts", String(latitude), String(longitude), crops.join(","), language);
    const cached = await getCachedResponse<WeatherAlerts>(cacheKey);
    if (cached) {
        logApiUsage({
            route: "/api/weather-alerts",
            promptTokens: 0, completionTokens: 0, totalTokens: 0,
            cached: true, durationMs: Date.now() - startTime,
        });
        return cached;
    }

    // Fetch real weather data from Open-Meteo
    const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=5`
    );
    const weatherData = await weatherRes.json();

    const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: weatherAlertSchema,
        system: `You are KrishiMitra AI, an expert Indian agricultural weather advisor.
ALL text MUST be in ${langName}.
Analyze the weather data and generate practical, actionable farming alerts.
Focus on: frost risk, heavy rain warnings, heat stress, hailstorm risk, strong wind warnings.
Be specific: mention exact temperatures, rain mm, wind km/h.
Include Indian crop-specific advice (e.g. "Cover nursery plants", "Don't spray pesticide before rain").`,
        prompt: `Generate weather-based farming alerts using this REAL weather data:

Current Weather:
- Temperature: ${weatherData.current?.temperature_2m}°C
- Humidity: ${weatherData.current?.relative_humidity_2m}%
- Wind: ${weatherData.current?.wind_speed_10m} km/h
- Precipitation: ${weatherData.current?.precipitation} mm

5-Day Forecast:
- Max Temps: ${weatherData.daily?.temperature_2m_max?.join(", ")}°C
- Min Temps: ${weatherData.daily?.temperature_2m_min?.join(", ")}°C
- Rain Probability: ${weatherData.daily?.precipitation_probability_max?.join(", ")}%
- Rainfall: ${weatherData.daily?.precipitation_sum?.join(", ")} mm

Location: ${region || `Lat ${latitude}, Lon ${longitude}`}
Farmer's Crops: ${crops.length > 0 ? crops.join(", ") : "General farming"}
Date: ${new Date().toISOString().split("T")[0]}

Generate alerts ranked by severity. Include 5-day farming task plan and irrigation advice.`,
    });

    const usage = extractUsage(result);
    logApiUsage({
        route: "/api/weather-alerts",
        ...usage,
        durationMs: Date.now() - startTime,
    });

    // Cache for 6 hours (weather changes)
    await setCachedResponse(cacheKey, result.object, 6 * 60 * 60);
    return result.object;
}
