/**
 * app/api/chat/route.ts - KrishiMitra AI Chat
 *
 * Unified conversational AI assistant with REAL tool backends:
 * - weatherAdvice:  live Open-Meteo data with client geolocation
 * - findSchemes:    Google Search grounded scheme discovery
 * - sellProduce:    creates real Listing in Postgres
 * - findBuyers:     queries Listing table for matching produce
 * - marketPrices:   queries Listing table + LLM knowledge
 * - diseaseCheck:   calls shared crop-disease analysis
 * - navigate:       client-side app navigation
 */
import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages, stepCountIs, tool } from "ai";
import { z } from "zod";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";
import { prisma } from "@/lib/prisma";
import { searchSchemes } from "@/lib/schemes";
import { analyzeCropDisease } from "@/lib/crop-disease";
import { auth } from "@/auth";

export const maxDuration = 60;

// Bot Identity
const BOT_NAME = "KrishiMitra AI";
const BOT_NAME_LOCAL = "\u0915\u0943\u0937\u093f \u092e\u093f\u0924\u094d\u0930";

// Language Map
const LANG_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi (\u0939\u093f\u0902\u0926\u0940)",
  mr: "Marathi (\u092e\u0930\u093e\u0920\u0940)",
};



// System Prompt Builder
function buildSystemPrompt(lang: string): string {
  const respondIn = LANG_MAP[lang] || "English";

  return `You are ${BOT_NAME} (${BOT_NAME_LOCAL}), an expert Indian farming assistant built to help farmers across India.

## LANGUAGE RULE (HIGHEST PRIORITY)
You MUST respond ENTIRELY in ${respondIn}. This is NON-NEGOTIABLE.
- Every word, sentence, header, bullet point, and explanation MUST be in ${respondIn}.
- Even when tool results contain English text, you MUST translate everything to ${respondIn} before presenting.
- Technical terms (chemical names, scheme names) can stay in English/original but explanations MUST be in ${respondIn}.
- NEVER mix languages. If the user writes in ${respondIn}, respond in ${respondIn}.

## INTENT DETECTION (AUTOMATIC)
You MUST automatically detect the user's intent from their natural speech and call the correct tool WITHOUT asking them to navigate or select options. The user should NEVER have to pick a tool manually.

Detect intent from keywords, context, and tone:
- Disease/pest/damage/spots/yellowing/wilting/insect/"crop not looking good" → call \`diseaseCheck\` tool
- Sell/list/"I want to sell"/"add my crop" → call \`sellProduce\` tool
- Scheme/subsidy/yojana/government/"help available" → call \`findSchemes\` tool
- Weather/rain/temperature/irrigation/"should I water" → call \`weatherAdvice\` tool
- Price/rate/mandi/bhav/"how much for" → call \`marketPrices\` tool
- Buyer/"who is buying"/demand → call \`findBuyers\` tool
- Soil/pH/nutrient/fertility/"soil report" → call \`soilAnalysis\` tool
- Navigate/"show me"/"go to"/"open" → call \`navigate\` tool
- Multiple intents in one message → handle them sequentially, calling each relevant tool

## FOLLOW-UP QUESTION RULES
When a user gives incomplete information, ask follow-up questions conversationally — do NOT refuse or redirect.

Examples:
- User: "I want to sell my crop" → Ask: "Which crop? How much quantity? What quality grade?"
- User: "My crop has disease" → Ask: "Which crop? What symptoms do you see? Can you upload a photo?"
- User: "Find schemes for me" → Ask: "What is your annual income? How much land? Which state? Main crop?"
- User: "Analyze my soil" → Ask: "What crop are you planning? Share soil test report or describe the issue."

If the user gives ALL details upfront, skip follow-ups and directly call the tool.
When user answers follow-up questions, immediately call the appropriate tool with collected details.

## IMAGE HANDLING
- If an image is attached, analyze it carefully for crop disease, pest damage, soil condition, or any farming issue.
- When disease diagnosis would benefit from an image but none is attached, PROACTIVELY ask: "Can you upload a photo of the affected crop? It will help me diagnose more accurately."
- After receiving an image, combine visual analysis with any text context the user provided.
- For crop images: identify the crop, disease/pest, severity, and provide treatment.

## TOOL USAGE
Call tools automatically when intent is detected. Available tools:
- \`diseaseCheck\`: Analyze crop disease from text symptoms (for image-based analysis, use your vision capability directly)
- \`sellProduce\`: Create marketplace listing (needs: crop, quantity, optional: price, quality, location)
- \`findSchemes\`: Search government schemes (optional: state, crop, landSize, category)
- \`weatherAdvice\`: Real-time weather + farming advice (optional: crop, activity)
- \`marketPrices\`: Mandi rates for any crop (needs: crop, optional: state, market)
- \`findBuyers\`: Find marketplace listings/buyers (needs: crop)
- \`soilAnalysis\`: Analyze soil health and provide recommendations (needs: description/crop)
- \`navigate\`: Navigate to app pages

## RESPONSE STYLE
- Use simple farmer-friendly language in ${respondIn}.
- Give specific quantities, timings, costs in INR.
- Reference Indian brands, local products, and desi solutions.
- For diseases: BOTH chemical AND organic remedies with costs.
- For schemes: eligibility + required documents + how to apply.
- Use markdown formatting (headers, bold, lists, tables) — all in ${respondIn}.
- Keep responses concise but complete. No unnecessary padding.
- End with a suggested next action or follow-up question.
- Always introduce yourself as ${BOT_NAME} if asked.

REMINDER: Your ENTIRE response must be in ${respondIn}. No exceptions.`;
}

// Tool Definitions with REAL Backends
function buildTools(userId: string | null, latitude: number | null, longitude: number | null, language: string) {
  const respondIn = LANG_MAP[language] || "English";
  const langReminder = `IMPORTANT: Present all results to the user in ${respondIn}.`;
  return {
    findSchemes: tool({
      description:
        "Find government/private agricultural schemes matching farmer profile. Use when user asks about subsidies, schemes, yojana, or government programs.",
      inputSchema: z.object({
        category: z
          .enum(["income_support", "insurance", "credit", "irrigation", "machinery", "organic", "market", "all"])
          .optional()
          .describe("Scheme category filter"),
        state: z.string().optional().describe("Indian state name"),
        crop: z.string().optional().describe("Crop being grown"),
        landSize: z.string().optional().describe("Land size in acres/hectares"),
      }),
      execute: async ({ category, state, crop, landSize }: {
        category?: string; state?: string; crop?: string; landSize?: string;
      }) => {
        try {
          const result = await searchSchemes({ category, state, crop, landSize, language });
          return {
            action: "scheme_results",
            found: result.total,
            schemes: result.schemes.slice(0, 5).map((s) => ({
              name: s.name,
              type: s.type,
              benefit: s.benefit,
              howToApply: s.howToApply,
              matchScore: s.matchScore,
              website: s.website,
            })),
            source: result.source,
            instruction: `Present these scheme results to the farmer. Highlight top matches, explain eligibility and application steps. ${langReminder}`,
          };
        } catch {
          return {
            action: "scheme_search_failed",
            instruction: `Scheme search failed. Provide general scheme information from your knowledge. Suggest visiting /schemes page. ${langReminder}`,
          };
        }
      },
    }),

    sellProduce: tool({
      description:
        "List farmer's produce for sale on the marketplace. Creates a real listing. Use when user wants to sell crops.",
      inputSchema: z.object({
        crop: z.string().describe("Name of the crop to sell"),
        quantity: z.string().describe("Quantity with unit, e.g. '500 kg'"),
        pricePerUnit: z.number().optional().describe("Price per unit in INR"),
        quality: z.enum(["A", "B", "C"]).optional().describe("Produce quality grade"),
        location: z.string().optional().describe("Location/mandi name"),
      }),
      execute: async ({ crop, quantity, pricePerUnit, quality, location }: {
        crop: string; quantity: string; pricePerUnit?: number; quality?: string; location?: string;
      }) => {
        if (!userId) {
          return {
            action: "auth_required",
            message: "User must be logged in to list produce. Suggest they sign in first.",
          };
        }
        try {
          // Verify user exists in DB (guards against stale JWT)
          const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
          if (!userExists) {
            return {
              action: "auth_required",
              message: "User session is invalid. Please sign out and sign in again.",
            };
          }
          const qtyMatch = quantity.match(/^([\d,]+)\s*(.+)$/);
          const qtyValue = qtyMatch ? qtyMatch[1].replace(",", "") : quantity;
          const unit = qtyMatch ? qtyMatch[2].trim() : "kg";
          const locationData =
            latitude !== null && longitude !== null
              ? JSON.stringify({ lat: latitude, lng: longitude, address: location || "" })
              : location ? JSON.stringify({ address: location }) : null;

          const listing = await prisma.listing.create({
            data: {
              userId,
              cropName: crop,
              quantity: qtyValue,
              unit,
              pricePerUnit: pricePerUnit || 0,
              location: locationData,
              description: quality ? `Quality: Grade ${quality}` : undefined,
            },
          });
          return {
            action: "listing_created",
            listingId: listing.id,
            crop,
            quantity: `${qtyValue} ${unit}`,
            pricePerUnit: pricePerUnit ? `INR ${pricePerUnit}/${unit}` : "Not set",
            message: `Successfully listed ${crop} (${qtyValue} ${unit}) on the marketplace!`,
            instruction: `Confirm the listing was created. If no price was set, suggest adding one. Mention /marketplace to view listings. ${langReminder}`,
          };
        } catch {
          return {
            action: "listing_failed",
            instruction: `Failed to create listing. Apologize and suggest /post-produce page instead. ${langReminder}`,
          };
        }
      },
    }),

    findBuyers: tool({
      description:
        "Find active marketplace listings / buyers for a specific crop. Use when user asks who is buying, or wants to find buyers.",
      inputSchema: z.object({
        crop: z.string().describe("Crop name to search for buyers/listings"),
        maxResults: z.number().optional().describe("Max results to return (default 10)"),
      }),
      execute: async ({ crop, maxResults }: { crop: string; maxResults?: number }) => {
        try {
          const listings = await prisma.listing.findMany({
            where: { cropName: { contains: crop, mode: "insensitive" }, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: maxResults || 10,
            include: { user: { select: { name: true, phone: true, location: true } } },
          });
          if (listings.length === 0) {
            return {
              action: "no_buyers_found",
              crop,
              message: `No active listings found for ${crop}.`,
              instruction: `Tell farmer no active listings found. Suggest listing their produce via sellProduce tool or checking /marketplace. ${langReminder}`,
            };
          }
          return {
            action: "buyers_found",
            crop,
            count: listings.length,
            listings: listings.map((l) => ({
              id: l.id,
              quantity: `${l.quantity} ${l.unit}`,
              price: l.pricePerUnit > 0 ? `INR ${l.pricePerUnit}/${l.unit}` : "Negotiable",
              seller: l.user.name || "Anonymous",
              phone: l.user.phone || "Not available",
              location: l.location || "Not specified",
              postedAt: l.createdAt.toISOString().split("T")[0],
            })),
            instruction: `Present marketplace listings. Show prices, quantities, contact info. Suggest contacting sellers. ${langReminder}`,
          };
        } catch {
          return { action: "search_failed", instruction: `Search failed. Suggest browsing /marketplace directly. ${langReminder}` };
        }
      },
    }),

    weatherAdvice: tool({
      description:
        "Get real-time weather and farming advice. Use when user asks about weather, rain, temperature, or farming timing.",
      inputSchema: z.object({
        location: z.string().optional().describe("Location name for context"),
        crop: z.string().optional().describe("Crop for tailored advice"),
        activity: z.enum(["sowing", "spraying", "harvesting", "irrigation", "general"]).optional(),
      }),
      execute: async ({ location, crop, activity }: {
        location?: string; crop?: string; activity?: string;
      }) => {
        try {
          const lat = latitude ?? 21.146;
          const lon = longitude ?? 79.088;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto&forecast_days=5`
          );
          const data = await res.json();
          return {
            action: "weather_data",
            current: data.current,
            forecast: data.daily,
            location: location || "your area",
            coordinates: { lat, lon },
            crop,
            activity: activity || "general",
            instruction: `Provide actionable weather-based farming advice using this REAL data. Mention exact temperatures, rain chances, wind. Recommend if farmer should proceed with activity. Give 3-5 day outlook. ${langReminder}`,
          };
        } catch {
          return {
            action: "weather_fallback",
            location: location || "your area",
            crop,
            activity: activity || "general",
            instruction: `Weather API unavailable. Provide general seasonal farming advice. ${langReminder}`,
          };
        }
      },
    }),

    marketPrices: tool({
      description:
        "Get market (mandi) prices for crops. Use when user asks about prices, rates, or bhav.",
      inputSchema: z.object({
        crop: z.string().describe("Crop to check prices for"),
        state: z.string().optional().describe("State for regional prices"),
        market: z.string().optional().describe("Specific mandi name"),
      }),
      execute: async ({ crop, state, market }: {
        crop: string; state?: string; market?: string;
      }) => {
        try {
          const listings = await prisma.listing.findMany({
            where: { cropName: { contains: crop, mode: "insensitive" }, status: "ACTIVE", pricePerUnit: { gt: 0 } },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { pricePerUnit: true, unit: true, quantity: true, createdAt: true },
          });
          const prices = listings.map((l) => l.pricePerUnit);
          const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
          return {
            action: "market_prices",
            crop,
            state: state || "All India",
            market: market || "All markets",
            platformData: listings.length > 0 ? {
              listingsFound: listings.length,
              avgPrice: `INR ${avgPrice}`,
              priceRange: `INR ${minPrice} - INR ${maxPrice}`,
              unit: listings[0].unit,
            } : null,
            instruction: `Provide market price info for ${crop}. ${
              listings.length > 0 ? `Platform has ${listings.length} listings with avg INR ${avgPrice}. Expand with mandi knowledge.` : "No platform listings. Use knowledge of recent Indian mandi rates."
            } Include trends, best markets, tips. ${langReminder}`,
          };
        } catch {
          return {
            action: "market_prices",
            crop,
            state: state || "All India",
            market: market || "Major mandis",
            platformData: null,
            instruction: `Provide market price information from your knowledge of recent Indian mandi rates. ${langReminder}`,
          };
        }
      },
    }),

    diseaseCheck: tool({
      description:
        "Analyze crop disease from symptoms description. Use when user describes crop problems, disease symptoms, or pest issues.",
      inputSchema: z.object({
        symptoms: z.string().describe("Description of symptoms observed"),
        cropName: z.string().optional().describe("Name of the affected crop"),
      }),
      execute: async ({ symptoms, cropName }: { symptoms: string; cropName?: string }) => {
        try {
          const report = await analyzeCropDisease({ symptoms, cropName, language });
          return {
            action: "disease_report",
            disease: report.disease,
            confidence: report.confidence,
            severity: report.severity,
            affectedCrop: report.affectedCrop,
            symptoms: report.symptoms,
            treatments: report.treatment.slice(0, 4),
            preventiveMeasures: report.preventiveMeasures.slice(0, 3),
            estimatedLoss: report.estimatedLoss,
            recoveryTime: report.recoveryTime,
            instruction: `Present disease diagnosis clearly. Highlight severity, recommend treatments (chemical + organic with INR costs), preventive measures. Suggest /crop-disease for image-based analysis. ${langReminder}`,
          };
        } catch {
          return {
            action: "disease_check_failed",
            symptoms,
            cropName,
            instruction: `Disease analysis failed. Provide general advice. Suggest /crop-disease page for image-based diagnosis. ${langReminder}`,
          };
        }
      },
    }),

    soilAnalysis: tool({
      description:
        "Analyze soil health and provide recommendations. Use when user mentions soil, pH, nutrients, fertility, composting, or soil preparation.",
      inputSchema: z.object({
        description: z.string().describe("User's description of soil condition, issues, or test results"),
        crop: z.string().optional().describe("Crop being grown or planned"),
        region: z.string().optional().describe("Region/state for localized advice"),
      }),
      execute: async ({ description, crop, region }: {
        description: string; crop?: string; region?: string;
      }) => {
        return {
          action: "soil_analysis",
          description,
          crop: crop || "general",
          region: region || "India",
          instruction: `Analyze the soil condition described: "${description}". Provide:
1. Likely soil health issues based on the description
2. pH and nutrient recommendations
3. Organic amendments (compost, vermicompost, bio-fertilizers)
4. Chemical corrections if needed with Indian brands and INR costs
5. Crop-specific soil preparation tips${crop ? ` for ${crop}` : ""}
6. Long-term soil health improvement plan
${langReminder}`,
        };
      },
    }),

    navigate: tool({
      description:
        "Navigate to a specific page. Use when user says 'show me', 'go to', 'open', or wants to visit a section.",
      inputSchema: z.object({
        route: z.enum(["/dashboard", "/assistant", "/marketplace", "/schemes", "/crop-disease", "/post-produce", "/help"]),
        reason: z.string().describe("Brief explanation of why navigating here"),
      }),
      execute: async ({ route, reason }: { route: string; reason: string }) => ({
        action: "navigate",
        route,
        reason,
      }),
    }),
  };
}

// Message Pruning
function pruneMessages(messages: any[], maxMessages: number = 20): any[] {
  if (messages.length <= maxMessages) return messages;
  return [messages[0], ...messages.slice(-maxMessages + 1)];
}

// Route Handler
export async function POST(req: Request) {
  const ip = getClientIP(req);
  const rl = checkRateLimit(ip, { maxRequests: 20, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.resetMs);

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { messages, data } = body;
    const language = data?.language || "en";
    const chatId = data?.chatId || null;
    const lat = typeof data?.latitude === "number" ? data.latitude : null;
    const lon = typeof data?.longitude === "number" ? data.longitude : null;

    const session = await auth();
    const userId = session?.user?.id || null;

    const prunedMessages = pruneMessages(messages);
    const modelMessages = await convertToModelMessages(prunedMessages);
    const systemPrompt = buildSystemPrompt(language);
    const tools = buildTools(userId, lat, lon, language);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      stopWhen: stepCountIs(3),
      tools,
    });

    // Fire-and-forget: log usage + persist messages after stream completes
    // result.text and result.usage are promises that resolve when streaming finishes
    (async () => {
      try {
        const [text, usage] = await Promise.all([result.text, result.usage]);
        logApiUsage({
          route: "/api/chat",
          ...extractUsage({ usage }),
          durationMs: Date.now() - startTime,
        });
        if (chatId && text) {
          const lastUserMsg = messages[messages.length - 1];
          const userContent =
            typeof lastUserMsg?.content === "string"
              ? lastUserMsg.content
              : lastUserMsg?.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join("") || "";
          await Promise.all([
            userContent && prisma.message.create({ data: { chatId, role: "user", content: userContent } }),
            prisma.message.create({ data: { chatId, role: "assistant", content: text } }),
            prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
          ]);
        }
      } catch (e) {
        console.error("Post-stream logging error:", e);
      }
    })();

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error("Error in chat route:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
