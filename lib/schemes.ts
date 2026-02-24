/**
 * lib/schemes.ts — Shared scheme search logic.
 * Used by /api/schemes route AND the chat route's findSchemes tool.
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
export const schemeSchema = z.object({
  schemes: z
    .array(
      z.object({
        name: z.string().describe("Official name of the scheme"),
        type: z
          .enum(["central", "state", "private"])
          .describe("Whether central govt, state govt, or private scheme"),
        category: z
          .string()
          .describe(
            "Category: income_support, insurance, credit, irrigation, subsidy, organic, market, etc"
          ),
        benefit: z
          .string()
          .describe("Key financial benefit, specific amounts in ₹"),
        description: z
          .string()
          .describe(
            "2-3 sentence description in simple farmer-friendly language"
          ),
        howToApply: z
          .string()
          .describe("Step by step how to apply — mention portal/office"),
        documents: z
          .array(z.string())
          .describe("List of required documents"),
        deadline: z
          .string()
          .describe("Application deadline or 'Ongoing'"),
        website: z.string().describe("Official website URL"),
        matchScore: z
          .number()
          .min(0)
          .max(100)
          .describe("Match score 0-100 based on farmer profile"),
      })
    )
    .describe("List of matching schemes"),
});

export type SchemeResult = z.infer<typeof schemeSchema>;

const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
};

// ─── Core Search Function ──────────────────
export interface SchemeSearchParams {
  income?: string;
  landSize?: string;
  crop?: string;
  state?: string;
  language?: string;
  category?: string;
}

export interface SchemeSearchResult {
  schemes: SchemeResult["schemes"];
  total: number;
  source: "cache" | "web_search";
}

export async function searchSchemes(
  params: SchemeSearchParams
): Promise<SchemeSearchResult> {
  const {
    income,
    landSize,
    crop,
    state,
    language = "en",
    category,
  } = params;

  const langName = LANG_MAP[language] || "English";
  const startTime = Date.now();

  const farmerProfile = `
- Annual Income: ${income || "Not specified"}
- Land Size: ${landSize || "Not specified"}
- Main Crop: ${crop || "Not specified"}
- State: ${state || "Not specified"}
- Category: ${category || "all"}`.trim();

  // ─── Check cache ──────────────
  const cacheKey = makeCacheKey(
    "schemes",
    income,
    landSize,
    crop,
    state,
    language,
    category
  );
  const cached = await getCachedResponse<SchemeSearchResult>(cacheKey);
  if (cached) {
    logApiUsage({
      route: "/api/schemes",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cached: true,
      durationMs: Date.now() - startTime,
    });
    return { ...cached, source: "cache" };
  }

  // ─── LLM call with Google Search grounding ──────────
  const searchResult = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: schemeSchema,
    prompt: `Search the web for the latest Indian agricultural schemes, subsidies, and support programs for this farmer:

${farmerProfile}

Find from: Central Government (PM-KISAN, PMFBY, KCC, etc.), ${state || "all states"} state schemes, and private/NGO schemes.
For each scheme: official name, type, benefits in ₹, eligibility, how to apply, required documents, deadline, website URL, and match score (0-100).
Return 8-12 schemes sorted by match score. All text in ${langName}.`,
  });

  const usage = extractUsage(searchResult);
  logApiUsage({
    route: "/api/schemes",
    ...usage,
    durationMs: Date.now() - startTime,
  });

  const schemes = searchResult.object.schemes.sort(
    (a, b) => b.matchScore - a.matchScore
  );

  const responseData: SchemeSearchResult = {
    schemes,
    total: schemes.length,
    source: "web_search",
  };

  // Cache for 24 hours
  await setCachedResponse(cacheKey, responseData, 24 * 60 * 60);

  return responseData;
}
