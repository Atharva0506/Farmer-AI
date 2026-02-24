import { NextResponse } from "next/server";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logApiUsage } from "@/lib/usage-logger";
import { analyzeCropDisease, compressImage, type DiseaseReport } from "@/lib/crop-disease";

export const maxDuration = 60;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  // Rate Limiting
  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.resetMs);

  const startTime = Date.now();

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const symptoms = formData.get("symptoms") as string | null;
    const cropName = formData.get("cropName") as string | null;
    const language = (formData.get("language") as string) || "en";

    if (!image && !symptoms) {
      return NextResponse.json(
        { error: "Please provide an image or describe the symptoms" },
        { status: 400 }
      );
    }

    // Validate image size
    if (image && image.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          error: `Image too large (${(image.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed: ${MAX_IMAGE_SIZE / 1024 / 1024} MB.`,
        },
        { status: 413 }
      );
    }

    let imageBuffer: ArrayBuffer | undefined;
    if (image) {
      imageBuffer = await image.arrayBuffer();
    }

    // Use shared module for analysis (handles caching, compression, LLM call)
    const report = await analyzeCropDisease({
      imageBuffer,
      symptoms,
      cropName,
      language,
    });

    logApiUsage({
      route: "/api/crop-disease",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cached: false,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Disease detection error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze. Please try again.",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
