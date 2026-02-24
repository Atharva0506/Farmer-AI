import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";
import { searchSchemes, schemeSchema } from "@/lib/schemes";

export const maxDuration = 120;

export async function POST(req: Request) {
  // Rate Limiting
  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.resetMs);

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { income, landSize, crop, state, language, question } = body;

    const langName =
      language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";

    const farmerProfile = `
- Annual Income: ${income || "Not specified"}
- Land Size: ${landSize || "Not specified"}
- Main Crop: ${crop || "Not specified"}
- State: ${state || "Not specified"}`.trim();

    // Follow-up Question Mode (streaming)
    if (question) {
      const result = streamText({
        model: google("gemini-2.5-flash"),
        tools: { google_search: google.tools.googleSearch({}) },
        system: `You are KrishiMitra AI, an expert on agricultural schemes for Indian farmers.
CRITICAL: Respond ONLY in ${langName}. Never use any other language.
Search the web first to ensure current and accurate information.
Use simple farmer-friendly language. Be specific about eligibility, benefits (INR), and step-by-step application process.
Include official website links when available.

Farmer Profile:
${farmerProfile}`,
        messages: [{ role: "user", content: question }],
      });

      // Log usage in background
      result
        .then((finalResult: any) => {
          const usage = extractUsage(finalResult);
          logApiUsage({
            route: "/api/schemes/question",
            ...usage,
            durationMs: Date.now() - startTime,
          });
        })
        .catch(() => {});

      return result.toTextStreamResponse();
    }

    // Initial Scheme Search (using shared module with caching)
    const result = await searchSchemes({
      income,
      landSize,
      crop,
      state,
      language,
    });

    return NextResponse.json({
      success: true,
      schemes: result.schemes,
      total: result.total,
      source: result.source,
    });
  } catch (error: any) {
    console.error("Schemes API error:", error);
    return NextResponse.json(
      { error: "Failed to find schemes", details: error?.message },
      { status: 500 }
    );
  }
}
