/**
 * lib/yield-forecast.ts — Predictive Yield & Revenue Forecast.
 * Innovation Feature #2: Turns reactive advice into proactive financial planning.
 */
import { getGeminiModel } from "@/lib/gemini";
import { generateObject } from "ai";
import { z } from "zod";
import {
    getCachedResponse,
    setCachedResponse,
    makeCacheKey,
} from "@/lib/cache";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";

export const yieldForecastSchema = z.object({
    crop: z.string().describe("Crop name"),
    estimatedYield: z.object({
        minimum: z.number().describe("Minimum expected yield in kg"),
        expected: z.number().describe("Most likely yield in kg"),
        maximum: z.number().describe("Best case yield in kg"),
        unit: z.string().default("kg"),
    }),
    estimatedRevenue: z.object({
        minimum: z.number().describe("Minimum revenue in ₹"),
        expected: z.number().describe("Expected revenue in ₹"),
        maximum: z.number().describe("Best case revenue in ₹"),
        currency: z.string().default("INR"),
    }),
    harvestDate: z.string().describe("Expected harvest date or period"),
    daysToHarvest: z.number().describe("Approximate days remaining to harvest"),
    currentMarketPrice: z.object({
        price: z.number().describe("Current market price per unit in ₹"),
        unit: z.string().default("kg"),
        trend: z.enum(["rising", "stable", "falling"]),
        trendReason: z.string().describe("Brief explanation of price trend"),
    }),
    riskFactors: z.array(
        z.object({
            risk: z.string().describe("Risk factor name"),
            severity: z.enum(["low", "medium", "high"]),
            mitigation: z.string().describe("How to mitigate this risk"),
        })
    ).describe("Potential risks to yield"),
    optimizationTips: z.array(z.string()).describe("Tips to maximize yield and revenue"),
    costEstimate: z.object({
        inputCosts: z.number().describe("Estimated total input costs in ₹ (seeds, fertilizer, pesticide, labor)"),
        netProfit: z.number().describe("Expected net profit in ₹"),
        profitMargin: z.string().describe("Profit margin percentage"),
    }),
});

export type YieldForecast = z.infer<typeof yieldForecastSchema>;

const LANG_MAP: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
};

export interface ForecastParams {
    crop: string;
    landSizeAcres?: number;
    sowingDate?: string;
    region?: string;
    language?: string;
}

export async function generateYieldForecast(
    params: ForecastParams
): Promise<YieldForecast> {
    const { crop, landSizeAcres, sowingDate, region, language = "en" } = params;
    const langName = LANG_MAP[language] || "English";
    const startTime = Date.now();

    const cacheKey = makeCacheKey("yield-forecast", crop, String(landSizeAcres), sowingDate, region, language);
    const cached = await getCachedResponse<YieldForecast>(cacheKey);
    if (cached) {
        logApiUsage({
            route: "/api/yield-forecast",
            promptTokens: 0, completionTokens: 0, totalTokens: 0,
            cached: true, durationMs: Date.now() - startTime,
        });
        return cached;
    }

    const today = new Date().toISOString().split("T")[0];

    const result = await generateObject({
        model: getGeminiModel(),
        schema: yieldForecastSchema,
        system: `You are KrishiMitra AI, an expert Indian agricultural economist and agronomist.
ALL text MUST be in ${langName}.
Provide realistic yield and revenue forecasts based on Indian farming conditions.
Use current Indian market rates. Be specific with numbers — farmers need exact figures for planning.
Account for typical Indian farm productivity per acre.`,
        prompt: `Generate a yield and revenue forecast for:
- Crop: ${crop}
- Land: ${landSizeAcres || 2} acres
- Sowing Date: ${sowingDate || "recent"}
- Today: ${today}
- Region: ${region || "Central India"}

Provide realistic yield estimates (min/expected/max), revenue at current market rates,
harvest timeline, risk factors with mitigation, cost breakdown, and optimization tips.
All monetary values in ₹.`,
    });

    const usage = extractUsage(result);
    logApiUsage({
        route: "/api/yield-forecast",
        ...usage,
        durationMs: Date.now() - startTime,
    });

    await setCachedResponse(cacheKey, result.object, 3 * 24 * 60 * 60); // 3 days
    return result.object;
}
