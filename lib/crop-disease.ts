/**
 * lib/crop-disease.ts — Shared crop disease analysis logic.
 * Used by /api/crop-disease route AND the chat route's diseaseCheck tool.
 */
import { getGeminiModel } from "@/lib/gemini";
import { generateObject } from "ai";
import { z } from "zod";
import sharp from "sharp";
import crypto from "crypto";
import {
  getCachedResponse,
  setCachedResponse,
  makeCacheKey,
} from "@/lib/cache";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";
import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────
const MAX_IMAGE_DIMENSION = 1024;

// ─── Schema ──────────────────────────────────
export const diseaseReportSchema = z.object({
  disease: z.string().describe("Name of the detected disease"),
  scientificName: z
    .string()
    .describe("Scientific/botanical name of the disease"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Detection confidence percentage"),
  severity: z
    .enum(["low", "medium", "high"])
    .describe("Severity level"),
  affectedCrop: z.string().describe("Name of the crop affected"),
  description: z
    .string()
    .describe("Description in simple farmer-friendly language"),
  symptoms: z.array(z.string()).describe("List of visible symptoms"),
  causes: z.array(z.string()).describe("Possible causes"),
  treatment: z
    .array(
      z.object({
        type: z
          .enum(["chemical", "organic", "cultural"])
          .describe("Treatment type"),
        name: z.string().describe("Treatment/medicine name"),
        dosage: z.string().describe("Application dosage instructions"),
        cost: z.string().describe("Approximate cost in ₹"),
      })
    )
    .describe("Treatment options"),
  preventiveMeasures: z
    .array(z.string())
    .describe("Steps to prevent future outbreaks"),
  fertilizer: z
    .array(
      z.object({
        name: z.string().describe("Fertilizer name"),
        dosage: z.string().describe("Application dosage"),
        timing: z.string().describe("When to apply"),
      })
    )
    .describe("Fertilizer recommendations for recovery"),
  estimatedLoss: z
    .string()
    .describe("Estimated yield loss if untreated"),
  recoveryTime: z
    .string()
    .describe("Expected recovery time with treatment"),
});

export type DiseaseReport = z.infer<typeof diseaseReportSchema>;

const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
};

// ─── Image Compression ──────────────────────
export async function compressImage(
  buffer: ArrayBuffer | Buffer
): Promise<{ base64: string; hash: string }> {
  const inputBuffer = Buffer.from(new Uint8Array(buffer as ArrayBuffer));
  const hash = crypto
    .createHash("md5")
    .update(inputBuffer)
    .digest("hex");

  const compressed = await sharp(inputBuffer)
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  return {
    base64: compressed.toString("base64"),
    hash,
  };
}

// ─── Core Analysis Function ──────────────────
export interface DiseaseAnalysisParams {
  /** Raw image buffer (from File.arrayBuffer()) */
  imageBuffer?: ArrayBuffer | Buffer;
  /** Or a pre-compressed base64 string */
  imageBase64?: string;
  /** Image hash for caching (optional, computed if imageBuffer provided) */
  imageHash?: string;
  symptoms?: string | null;
  cropName?: string | null;
  language?: string;
  /** User ID for persisting disease reports */
  userId?: string | null;
}

export async function analyzeCropDisease(
  params: DiseaseAnalysisParams
): Promise<DiseaseReport> {
  const {
    imageBuffer,
    imageBase64: providedBase64,
    imageHash: providedHash,
    symptoms,
    cropName,
    language = "en",
    userId,
  } = params;

  const langName = LANG_MAP[language] || "English";
  const startTime = Date.now();

  let base64 = providedBase64 || "";
  let imageHash = providedHash || "";

  // Compress image if buffer provided
  if (imageBuffer) {
    const compressed = await compressImage(imageBuffer);
    base64 = compressed.base64;
    imageHash = compressed.hash;
  }

  const hasImage = !!base64;

  // ─── Check cache ──────────────
  const cacheKey = makeCacheKey(
    "crop-disease",
    imageHash || "no-image",
    symptoms,
    cropName,
    language
  );
  const cached = await getCachedResponse<DiseaseReport>(cacheKey);
  if (cached) {
    logApiUsage({
      route: "/api/crop-disease",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cached: true,
      durationMs: Date.now() - startTime,
    });
    return cached;
  }

  const systemPrompt = `You are KrishiMitra AI, an expert agricultural disease diagnostician for Indian crops.
CRITICAL: ALL text MUST be in ${langName}. Never use any other language.
Analyze the crop image/symptoms, diagnose the disease, and provide practical treatment options available in Indian markets.
Use simple farmer-friendly language. Costs in ₹. Include both chemical and organic (neem-based, traditional) remedies.`;

  let messages: any[] = [];
  if (hasImage) {
    messages = [
      {
        role: "user",
        content: [
          { type: "image", image: `data:image/jpeg;base64,${base64}` },
          {
            type: "text",
            text: `Analyze this crop image for diseases.${cropName ? ` Crop: ${cropName}.` : ""}${symptoms ? ` Symptoms: ${symptoms}` : ""}`,
          },
        ],
      },
    ];
  } else {
    messages = [
      {
        role: "user",
        content: `Diagnose crop disease: ${symptoms}.${cropName ? ` Crop: ${cropName}.` : ""}`,
      },
    ];
  }

  const result = await generateObject({
    model: getGeminiModel(),
    schema: diseaseReportSchema,
    system: systemPrompt,
    messages,
  });

  const usage = extractUsage(result);
  logApiUsage({
    route: "/api/crop-disease",
    ...usage,
    durationMs: Date.now() - startTime,
  });

  // Cache for 7 days
  await setCachedResponse(cacheKey, result.object, 7 * 24 * 60 * 60);

  // Persist disease report for user history (fire-and-forget)
  if (userId) {
    prisma.diseaseReport
      .create({
        data: {
          userId,
          cropName: result.object.affectedCrop || cropName || "Unknown",
          disease: result.object.disease,
          severity: result.object.severity,
          confidence: result.object.confidence,
          treatments: JSON.stringify(result.object.treatment.slice(0, 4)),
        },
      })
      .catch((err: unknown) => {
        console.error("Failed to persist disease report:", err);
      });
  }

  return result.object;
}
