import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

// Convert UIMessage parts format (from @ai-sdk/react v3) to AI SDK compatible messages
function convertMessages(messages: any[]) {
    return messages
        .filter((msg: any) => {
            if (typeof msg.content === 'string' && msg.content.length > 0) return true;
            if (Array.isArray(msg.content) && msg.content.length > 0) return true;
            if (Array.isArray(msg.parts) && msg.parts.length > 0) return true;
            return false;
        })
        .map((msg: any) => {
            // Already in correct { role, content: string } format
            if (typeof msg.content === 'string' && msg.content.length > 0) {
                return { role: msg.role, content: msg.content };
            }
            // Already in multipart content format
            if (Array.isArray(msg.content) && msg.content.length > 0) {
                return { role: msg.role, content: msg.content };
            }
            // Convert UIMessage parts[] to content
            const parts = msg.parts || [];
            const textParts = parts.filter((p: any) => p.type === 'text');
            const fileParts = parts.filter((p: any) => p.type === 'file' || p.type === 'image');

            if (fileParts.length > 0) {
                // Build multipart content array for image + text
                const content: any[] = [];
                for (const fp of fileParts) {
                    if (fp.type === 'image' && fp.image) {
                        content.push({ type: 'image', image: fp.image });
                    } else if (fp.type === 'file' && fp.data) {
                        content.push({ type: 'image', image: fp.data });
                    }
                }
                for (const tp of textParts) {
                    content.push({ type: 'text', text: tp.text });
                }
                return { role: msg.role, content };
            }

            // Text-only: join all text parts
            const text = textParts.map((p: any) => p.text).join('');
            return { role: msg.role, content: text };
        });
}

export async function POST(req: Request) {
    try {
        const { messages, data } = await req.json();
        const mode = data?.mode || 'think';
        const voiceMode = data?.voiceMode || false;

        // Convert messages from UIMessage parts format to AI SDK format
        const convertedMessages = convertMessages(messages);

        const voiceInstructions = voiceMode
            ? `\nIMPORTANT: You are in VOICE MODE (like Alexa/Google Assistant).
- Keep responses SHORT (2–4 sentences max).
- Use conversational tone, like talking to a friend.
- No markdown formatting, no bullet points, no headers.
- Speak naturally as if reading aloud.
- End with a question or action suggestion.
- Be warm and encouraging.`
            : '';

        const result = streamText({
            model: google('gemini-2.0-flash'),
            system: `You are KrishiMitra AI (किसान मित्र), an intelligent voice-first farming companion for Indian farmers.
Current Mode: ${mode === 'research' ? 'Research (Deep technical analysis with detailed data)' : 'Think (Quick practical farming advice)'}
${voiceInstructions}

Your expertise:
1. **Crop Guidance**: Planting, growing, fertilizer schedules, harvest timing, soil preparation, seed selection, water management
2. **Disease Detection**: Identify crop diseases from descriptions/images, provide treatment with specific medicine names, dosages in Indian market brands
3. **Market Intelligence**: Current mandi prices, demand trends, best time to sell, connecting farmers to buyers
4. **Government Schemes**: PM-KISAN, PMFBY, KCC, SMAM, PKVY, eNAM, state-specific schemes — eligibility, benefits, how to apply, documents needed
5. **Weather Advisory**: Crop-weather correlation, sowing/harvesting timing based on forecasts
6. **Organic Farming**: Traditional Indian methods (Jeevamrut, Beejamrut, Panchagavya), certification process

Rules:
- Auto-detect language (Hindi/Marathi/English) and reply in the SAME language.
- Use farmer-friendly simple language. Avoid jargon.
- Give specific actionable advice with quantities, timings, and costs in ₹.
- Reference Indian brands and locally available products.
- When discussing diseases, always mention both chemical AND organic remedies.
- For schemes, always mention eligibility criteria and required documents.
- Suggest next logical action the farmer should take.
- If an image is provided with the message, analyze it carefully for crop diseases, pest damage, or nutrient deficiency.`,
            messages: convertedMessages,
            tools: {
                cropHelp: tool({
                    description: 'Provide detailed crop guidance including planting, fertilizer schedule, pest management, and harvest tips for Indian farming conditions.',
                    inputSchema: z.object({
                        crop: z.string().describe('Name of the crop (e.g., Tomato, Wheat, Rice, Cotton, Sugarcane)'),
                        topic: z.enum(['planting', 'fertilizer', 'disease', 'harvest', 'irrigation', 'seed_selection', 'general']).optional(),
                        region: z.string().optional().describe('Farming region (e.g., Maharashtra, Punjab, Karnataka)'),
                        season: z.enum(['kharif', 'rabi', 'zaid']).optional(),
                    }),
                    execute: async ({ crop, topic, region, season }) => {
                        return {
                            crop,
                            topic: topic || 'general',
                            region: region || 'India',
                            season: season || 'current',
                            advice: `Comprehensive guidance for ${crop} farming.`,
                            note: 'Use AI knowledge to provide detailed, region-specific advice.',
                        };
                    },
                }),
                diseaseCheck: tool({
                    description: 'Diagnose crop disease from symptoms description and provide treatment plan with Indian market medicine names and prices.',
                    inputSchema: z.object({
                        symptoms: z.string().describe('Visible symptoms (e.g., yellow leaves, brown spots, wilting)'),
                        crop: z.string().optional().describe('Affected crop name'),
                        severity: z.enum(['mild', 'moderate', 'severe']).optional(),
                    }),
                    execute: async ({ symptoms, crop, severity }) => {
                        return {
                            symptoms,
                            crop: crop || 'Unknown',
                            severity: severity || 'moderate',
                            note: 'Provide diagnosis with chemical + organic treatment options, specific Indian brand names and ₹ costs.',
                        };
                    },
                }),
                findSchemes: tool({
                    description: 'Find government and private schemes, subsidies, loans for farmers based on their profile.',
                    inputSchema: z.object({
                        category: z.enum(['income_support', 'insurance', 'credit', 'irrigation', 'machinery', 'organic', 'market', 'all']).optional(),
                        income: z.string().optional().describe('Annual income range'),
                        landSize: z.string().optional().describe('Land size in acres'),
                        state: z.string().optional().describe('State name'),
                        crop: z.string().optional(),
                    }),
                    execute: async ({ category, income, landSize, state, crop }) => {
                        return {
                            category: category || 'all',
                            farmerProfile: { income, landSize, state, crop },
                            note: 'List matching schemes with eligibility, benefits, application process, and required documents.',
                        };
                    },
                }),
                sellProduce: tool({
                    description: 'Help farmer list their produce for sale in the marketplace with fair price suggestions.',
                    inputSchema: z.object({
                        crop: z.string(),
                        quantity: z.string().describe('Quantity with unit (e.g., 5 quintal, 100 kg)'),
                        quality: z.enum(['A', 'B', 'C']).optional(),
                        expectedPrice: z.string().optional(),
                        location: z.string().optional(),
                    }),
                    execute: async ({ crop, quantity, quality, expectedPrice }) => ({
                        status: "Listed",
                        listingId: "KM-" + Date.now().toString(36).toUpperCase(),
                        crop,
                        quantity,
                        quality: quality || 'A',
                        suggestedPrice: expectedPrice || 'Market rate',
                        message: `${crop} (${quantity}) listed successfully. Buyers in your area will be notified.`,
                    }),
                }),
                findBuyers: tool({
                    description: 'Find verified buyers for specific crops near farmer location.',
                    inputSchema: z.object({
                        crop: z.string(),
                        location: z.string().optional(),
                        quantity: z.string().optional(),
                    }),
                    execute: async ({ crop, location }) => ({
                        buyers: [
                            { name: "Ramesh Traders", location: location || "APMC Market", rating: 4.5, verified: true },
                            { name: "Fresh Farm Direct", location: "Online Platform", rating: 4.8, verified: true },
                            { name: "AgriConnect Exports", location: "Mumbai", rating: 4.3, verified: true },
                        ],
                        message: `Found 3 verified buyers for ${crop}. Contact through the app for best prices.`,
                    }),
                }),
                weatherAdvice: tool({
                    description: 'Provide weather-based farming advice for crop planning and protection.',
                    inputSchema: z.object({
                        location: z.string().optional(),
                        crop: z.string().optional(),
                        activity: z.enum(['sowing', 'spraying', 'harvesting', 'irrigation', 'general']).optional(),
                    }),
                    execute: async ({ location, crop, activity }) => ({
                        location: location || 'Your area',
                        advice: `Weather-based ${activity || 'farming'} advice for ${crop || 'crops'}.`,
                        note: 'Provide practical weather-correlated farming advice.',
                    }),
                }),
            },
        });

        return result.toTextStreamResponse();
    } catch (e) {
        console.error("Error in chat route:", e);
        return new Response("Internal Server Error", { status: 500 });
    }
}



