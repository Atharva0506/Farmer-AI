import { google } from "@ai-sdk/google";
import { generateText, streamText, generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 120;

// Schema for structured scheme data returned by AI
const schemeSchema = z.object({
  schemes: z.array(
    z.object({
      name: z.string().describe("Official name of the scheme"),
      type: z.enum(["central", "state", "private"]).describe("Whether it's a central govt, state govt, or private scheme"),
      category: z.string().describe("Category like income_support, insurance, credit, irrigation, subsidy, organic, market, mechanization, horticulture, training, etc"),
      benefit: z.string().describe("Key financial benefit or support provided, be specific with amounts"),
      description: z.string().describe("2-3 sentence description in simple farmer-friendly language"),
      howToApply: z.string().describe("Step by step how to apply — mention specific portal/office"),
      documents: z.array(z.string()).describe("List of documents required to apply"),
      deadline: z.string().describe("Application deadline or 'Ongoing' if always open"),
      website: z.string().describe("Official website URL for the scheme"),
      matchScore: z.number().min(1).max(99).describe("How well this scheme matches the farmer's profile, 1-99"),
    })
  ).describe("List of matching government and private schemes"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { income, landSize, crop, state, language, question } = body;

    const langName = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";

    const farmerProfile = `
- Annual Income: ${income || "Not specified"}
- Land Size: ${landSize || "Not specified"}
- Main Crop: ${crop || "Not specified"}
- State: ${state || "Not specified"}`.trim();

    // If there's a follow-up question, search the web and stream a response
    if (question) {
      const result = streamText({
        model: google("gemini-2.0-flash"),
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        system: `You are KrishiMitra AI, an expert on government and private agricultural schemes for Indian farmers.
You have access to Google Search to find the latest, most accurate information.

ALWAYS search the web first before answering to ensure your information is current and accurate.

Respond in ${langName} language.
Use simple farmer-friendly language that even a semi-literate farmer can understand.
Be very specific about eligibility, exact benefits (amounts in ₹), and step-by-step how to apply.
Include official website links when available.

Farmer Profile:
${farmerProfile}`,
        messages: [{ role: "user", content: question }],
      });

      return result.toTextStreamResponse();
    }

    // Step 1: Use Gemini + Google Search to find real schemes matching the farmer
    const searchPrompt = `Search for the latest Indian government and private agricultural schemes, subsidies, and financial support programs available for a farmer with this profile:

${farmerProfile}

Find schemes from these sources:
1. Central Government schemes (PM-KISAN, PMFBY, KCC, etc. — check for latest eligibility & amounts)
2. State-specific schemes for ${state || "all states"} (search for "${state || "India"} farmer schemes ${new Date().getFullYear()}")
3. Any new schemes announced in budget ${new Date().getFullYear()} or recent policy changes
4. Private/NGO schemes if relevant

For each scheme, provide:
- Official name
- Type (central/state/private)
- Exact financial benefits with amounts in ₹
- Who is eligible (income limits, land requirements, crop type)
- How to apply (specific portal/office)
- Required documents
- Application deadline
- Official website URL
- Match score (1-99) based on how well it matches this farmer's profile

Return at least 8-12 schemes, sorted by match score (highest first).
Prioritize schemes the farmer is most likely eligible for.
Scheme names should be in ${langName} language if possible, descriptions in ${langName}.`;

    // Use generateText with google_search tool first, then parse into structured format
    const webSearchResult = await generateText({
      model: google("gemini-2.0-flash"),
      tools: {
        google_search: google.tools.googleSearch({}),
      },
      prompt: searchPrompt + "\n\nSearch the web thoroughly and provide comprehensive, factual results.",
    });

    // Now parse the web search results into structured scheme data
    const searchResult = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: schemeSchema,
      prompt: `Based on the following web search results about Indian agricultural schemes, extract and structure the scheme information.\n\nWeb Search Results:\n${webSearchResult.text}\n\nFarmer Profile:\n${farmerProfile}\n\nExtract 8-12 schemes from the results. Assign match scores (1-99) based on how well each scheme matches this farmer\'s profile. Scheme names and descriptions should be in ${langName}.`,
    });

    const schemes = searchResult.object.schemes
      .sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      schemes,
      total: schemes.length,
      source: "web_search",
    });
  } catch (error: any) {
    console.error("Schemes API error:", error);
    return NextResponse.json(
      { error: "Failed to find schemes", details: error?.message },
      { status: 500 }
    );
  }
}

