import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const diseaseReportSchema = z.object({
  disease: z.string().describe("Name of the detected disease"),
  scientificName: z.string().describe("Scientific/botanical name of the disease"),
  confidence: z.number().min(0).max(100).describe("Detection confidence percentage"),
  severity: z.enum(["low", "medium", "high"]).describe("Severity level of the disease"),
  affectedCrop: z.string().describe("Name of the crop affected"),
  description: z.string().describe("Detailed description of the disease in simple farmer-friendly language"),
  symptoms: z.array(z.string()).describe("List of visible symptoms"),
  causes: z.array(z.string()).describe("Possible causes of the disease"),
  treatment: z.array(
    z.object({
      type: z.enum(["chemical", "organic", "cultural"]).describe("Type of treatment"),
      name: z.string().describe("Name of treatment/medicine"),
      dosage: z.string().describe("How to apply/dosage instructions"),
      cost: z.string().describe("Approximate cost in Indian rupees"),
    })
  ).describe("Treatment options"),
  preventiveMeasures: z.array(z.string()).describe("Steps to prevent future outbreaks"),
  fertilizer: z.array(
    z.object({
      name: z.string().describe("Fertilizer name"),
      dosage: z.string().describe("Application dosage"),
      timing: z.string().describe("When to apply"),
    })
  ).describe("Fertilizer recommendations for recovery"),
  estimatedLoss: z.string().describe("Estimated yield loss if untreated"),
  recoveryTime: z.string().describe("Expected recovery time with treatment"),
  nearbyResources: z.array(
    z.object({
      type: z.enum(["store", "expert", "lab"]),
      suggestion: z.string(),
    })
  ).describe("Suggested nearby resources"),
});

export type DiseaseReport = z.infer<typeof diseaseReportSchema>;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const symptoms = formData.get("symptoms") as string | null;
    const cropName = formData.get("cropName") as string | null;
    const language = formData.get("language") as string || "en";

    if (!image && !symptoms) {
      return NextResponse.json(
        { error: "Please provide an image or describe the symptoms" },
        { status: 400 }
      );
    }

    const langMap: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      mr: "Marathi",
    };
    const langName = langMap[language] || "English";

    let messages: any[] = [];

    const systemPrompt = `You are KrishiMitra AI, an expert agricultural disease diagnostician specializing in Indian crops.
Analyze the provided crop image and/or symptoms to diagnose the disease.
Provide all text content in ${langName} language.
Be practical and specific with treatment recommendations available in Indian markets.
Use simple farmer-friendly language. Costs should be in Indian Rupees (₹).
If you cannot determine the disease with certainty, provide the most likely diagnosis.
For organic treatments, prefer neem-based, cow urine, or traditional Indian remedies alongside modern solutions.`;

    if (image) {
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = image.type || "image/jpeg";

      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `Analyze this crop image for diseases.${cropName ? ` The crop is: ${cropName}.` : ""}${symptoms ? ` Additional symptoms described: ${symptoms}` : ""}`,
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `Diagnose crop disease based on these symptoms: ${symptoms}.${cropName ? ` The crop is: ${cropName}.` : ""}`,
        },
      ];
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: diseaseReportSchema,
      system: systemPrompt,
      messages,
    });

    return NextResponse.json({ success: true, report: object });
  } catch (error: any) {
    console.error("Disease detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze. Please try again.", details: error?.message },
      { status: 500 }
    );
  }
}
