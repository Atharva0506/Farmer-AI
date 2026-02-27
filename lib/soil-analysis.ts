/**
 * lib/soil-analysis.ts — Structured soil health analysis using Gemini.
 * Replaces the passthrough instruction in the soilAnalysis chat tool.
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
export const soilReportSchema = z.object({
    soilType: z.string().describe("Identified soil type (e.g., Black/Alluvial/Red/Laterite)"),
    phLevel: z.object({
        estimated: z.string().describe("Estimated pH range"),
        status: z.enum(["acidic", "neutral", "alkaline"]).describe("pH classification"),
    }),
    nutrients: z.object({
        nitrogen: z.object({
            level: z.enum(["low", "medium", "high"]),
            recommendation: z.string(),
        }),
        phosphorus: z.object({
            level: z.enum(["low", "medium", "high"]),
            recommendation: z.string(),
        }),
        potassium: z.object({
            level: z.enum(["low", "medium", "high"]),
            recommendation: z.string(),
        }),
    }),
    organicMatter: z.object({
        level: z.enum(["low", "medium", "high"]),
        improvementTips: z.array(z.string()),
    }),
    recommendations: z.array(
        z.object({
            type: z.enum(["organic", "chemical", "cultural"]).describe("Amendment type"),
            name: z.string().describe("Product/practice name"),
            dosage: z.string().describe("Application dosage"),
            cost: z.string().describe("Approximate cost in ₹"),
            timing: z.string().describe("When to apply"),
        })
    ).describe("Soil amendments and fertilizer recommendations"),
    cropSuitability: z.array(z.string()).describe("Crops well-suited for this soil"),
    longTermPlan: z.array(z.string()).describe("Long-term soil health improvement steps"),
});

export type SoilReport = z.infer<typeof soilReportSchema>;

const LANG_MAP: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    mr: "Marathi",
};

// ─── Core Analysis Function ──────────────────
export interface SoilAnalysisParams {
    description: string;
    crop?: string | null;
    region?: string | null;
    language?: string;
}

export async function analyzeSoil(
    params: SoilAnalysisParams
): Promise<SoilReport> {
    const { description, crop, region, language = "en" } = params;
    const langName = LANG_MAP[language] || "English";
    const startTime = Date.now();

    // ─── Check cache ──────────────
    const cacheKey = makeCacheKey("soil-analysis", description, crop, region, language);
    const cached = await getCachedResponse<SoilReport>(cacheKey);
    if (cached) {
        logApiUsage({
            route: "/api/soil-analysis",
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cached: true,
            durationMs: Date.now() - startTime,
        });
        return cached;
    }

    const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: soilReportSchema,
        system: `You are KrishiMitra AI, an expert soil scientist specializing in Indian agriculture.
CRITICAL: ALL text MUST be in ${langName}. Never use any other language.
Analyze the soil condition, provide practical recommendations using products available in Indian markets.
Use simple farmer-friendly language. Costs in ₹. Include both chemical and organic amendments.
Reference Indian brands (IFFCO, Coromandel, etc.) where applicable.`,
        prompt: `Analyze this soil condition for an Indian farmer:

Soil Description: ${description}
${crop ? `Planned Crop: ${crop}` : ""}
${region ? `Region: ${region}` : "Region: India"}

Provide: soil type, pH estimate, NPK levels, organic matter assessment, specific amendment recommendations with Indian market prices, crop suitability, and a long-term improvement plan.`,
    });

    const usage = extractUsage(result);
    logApiUsage({
        route: "/api/soil-analysis",
        ...usage,
        durationMs: Date.now() - startTime,
    });

    // Cache for 7 days
    await setCachedResponse(cacheKey, result.object, 7 * 24 * 60 * 60);

    return result.object;
}
