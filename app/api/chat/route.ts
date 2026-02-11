import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, data } = await req.json();
        const mode = data?.mode || 'think';

        const result = streamText({
            model: google('gemini-1.5-flash'),
            system: `You are KrishiMitra AI, a smart farmer assistant.
Current Mode: ${mode === 'research' ? 'Research (Deep technical analysis)' : 'Think (Practical farming advice)'}

Help farmers with:
- Crop guidance (growing, fertilizer, harvest)
- Disease detection (analyze inputs/images)
- Selling produce (market connection)
- Finding buyers (connecting to demand)
- Government schemes (subsidies, loans)

Rules:
- Use simple farmer-friendly language.
- Detect Hindi/Marathi/English automatically.
- Reply in the same language as the user.
- Ask for missing details before calling a tool.
- Always suggest the next action.
- Keep answers practical and short.

If an image is provided, analyze it carefully for diseases or crop health issues.
Decide which tool to call based on the user's need.`,
            messages,
            tools: {
                cropHelp: tool({
                    description: 'Get guidance on growing a specific crop, including fertilizers, pests, and harvesting.',
                    parameters: z.object({
                        crop: z.string().describe('The name of the crop (e.g., Tomato, Wheat)'),
                        topic: z.enum(['planting', 'fertilizer', 'disease', 'harvest', 'general']).optional().describe('Specific topic of advice'),
                    }),
                    execute: async (params: { crop: string; topic?: 'planting' | 'fertilizer' | 'disease' | 'harvest' | 'general' }) => ({
                        summary: `Here is advice for ${params.crop} regarding ${params.topic || 'general farming'}.`,
                        steps: [
                            "Ensure proper soil drainage.",
                            "Use organic fertilizers if possible.",
                            "Monitor for pests early in the morning."
                        ],
                        relatedCrops: ["Potato", "Onion"]
                    }),
                }),
                diseaseCheck: tool({
                    description: 'Analyze crop disease based on symptoms or image description.',
                    parameters: z.object({
                        symptoms: z.string().describe('Description of the visible symptoms'),
                        crop: z.string().optional().describe('Name of the affected crop'),
                    }),
                    execute: async (params: { symptoms: string; crop?: string }) => ({
                        diagnosis: "Potential Early Blight",
                        confidence: "High",
                        remedy: "Spray Mancozeb 75 WP (2g/liter) or Chlorothalonil.",
                        preventiveMeasures: "Rotate crops and avoid overhead irrigation."
                    }),
                }),
                sellProduce: tool({
                    description: 'List produce for sale in the marketplace.',
                    parameters: z.object({
                        crop: z.string().describe('Name of the crop to sell'),
                        quantity: z.string().describe('Quantity available (e.g., 100kg)'),
                        price: z.string().optional().describe('Expected price per unit'),
                    }),
                    execute: async (params: { crop: string; quantity: string; price?: string }) => ({
                        status: "Success",
                        listingId: "LST-" + Math.floor(Math.random() * 10000),
                        message: `Your ${params.crop} (${params.quantity}) has been listed${params.price ? ` at ${params.price}` : ''}. Buyers will contact you soon.`
                    }),
                }),
                findBuyers: tool({
                    description: 'Find buyers for a specific crop.',
                    parameters: z.object({
                        crop: z.string().describe('Name of the crop'),
                        location: z.string().optional().describe('Location to search near'),
                    }),
                    execute: async (params: { crop: string; location?: string }) => ({
                        buyers: [
                            { name: "Ramesh Traders", location: "Pune APMC", rating: 4.5 },
                            { name: "Global Exports", location: "Mumbai", rating: 4.8 },
                        ],
                        count: 2
                    }),
                }),
                govSchemes: tool({
                    description: 'Find government schemes and subsidies for farmers.',
                    parameters: z.object({
                        category: z.string().optional().describe('Category of scheme (e.g., seeds, machinery, loans)'),
                    }),
                    execute: async (params: { category?: string }) => ({
                        schemes: [
                            { name: "PM Kisan Samman Nidhi", benefit: "₹6000/year" },
                            { name: "Drip Irrigation Subsidy", benefit: "Up to 80% subsidy" }
                        ]
                    }),
                }),
            } as any,
        });

        return result.toTextStreamResponse();
    } catch (e) {
        console.error("Error in chat route:", e);
        return new Response("Internal Server Error", { status: 500 });
    }
}



