/**
 * lib/farming-calendar.ts — AI-generated personalized farming calendar.
 * Innovation Feature #10: Transforms the app from advisory → daily planner.
 */
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import {
    getCachedResponse,
    setCachedResponse,
    makeCacheKey,
} from "@/lib/cache";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";

// ─── Schema ──────────────────────────────────
export const farmingCalendarSchema = z.object({
    cropName: z.string().describe("Name of the crop"),
    totalDuration: z.string().describe("Total crop lifecycle duration (e.g. '120 days')"),
    currentWeek: z.number().describe("Current week number based on sowing date"),
    currentPhase: z.string().describe("Current growth phase name"),
    phases: z.array(
        z.object({
            name: z.string().describe("Phase name (e.g. Germination, Vegetative, Flowering)"),
            weekStart: z.number().describe("Starting week number"),
            weekEnd: z.number().describe("Ending week number"),
            color: z.enum(["green", "blue", "yellow", "orange", "red", "purple"]),
        })
    ).describe("Growth phases timeline"),
    weeklyTasks: z.array(
        z.object({
            week: z.number().describe("Week number from sowing"),
            dateRange: z.string().describe("Approximate date range"),
            phase: z.string().describe("Growth phase name"),
            tasks: z.array(
                z.object({
                    task: z.string().describe("What to do"),
                    priority: z.enum(["high", "medium", "low"]),
                    category: z.enum(["irrigation", "fertilizer", "pest_control", "harvesting", "general"]),
                })
            ),
            weatherTip: z.string().describe("Weather-sensitive advice for this week"),
        })
    ).describe("Week-by-week farming tasks"),
    upcomingAlerts: z.array(
        z.object({
            message: z.string(),
            daysFromNow: z.number(),
            type: z.enum(["critical", "warning", "info"]),
        })
    ).describe("Upcoming critical actions in the next 14 days"),
});

export type FarmingCalendar = z.infer<typeof farmingCalendarSchema>;

const LANG_MAP: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
};

export interface CalendarParams {
    crop: string;
    sowingDate: string; // ISO date or "YYYY-MM-DD"
    region?: string;
    language?: string;
}

export async function generateFarmingCalendar(
    params: CalendarParams
): Promise<FarmingCalendar> {
    const { crop, sowingDate, region, language = "en" } = params;
    const langName = LANG_MAP[language] || "English";
    const startTime = Date.now();

    const cacheKey = makeCacheKey("farming-calendar", crop, sowingDate, region, language);
    const cached = await getCachedResponse<FarmingCalendar>(cacheKey);
    if (cached) {
        logApiUsage({
            route: "/api/farming-calendar",
            promptTokens: 0, completionTokens: 0, totalTokens: 0,
            cached: true, durationMs: Date.now() - startTime,
        });
        return cached;
    }

    const today = new Date().toISOString().split("T")[0];

    const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: farmingCalendarSchema,
        system: `You are KrishiMitra AI, an expert Indian agricultural planner.
ALL text MUST be in ${langName}.
Generate a detailed week-by-week farming calendar for Indian conditions.
Include specific fertilizer names (Indian brands like IFFCO, Coromandel), pest control schedules,
irrigation timing, and weather-sensitive advice. Be practical and specific.`,
        prompt: `Generate a farming calendar for:
- Crop: ${crop}
- Sowing Date: ${sowingDate}
- Today's Date: ${today}
- Region: ${region || "Central India"}

Provide week-by-week tasks from sowing to harvest.
Calculate which week we are currently in based on today's date vs sowing date.
Include growth phases, specific product recommendations, and upcoming critical alerts.`,
    });

    const usage = extractUsage(result);
    logApiUsage({
        route: "/api/farming-calendar",
        ...usage,
        durationMs: Date.now() - startTime,
    });

    await setCachedResponse(cacheKey, result.object, 3 * 24 * 60 * 60); // 3 days
    return result.object;
}
