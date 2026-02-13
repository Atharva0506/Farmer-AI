import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, data } = body;
        const mode = data?.mode || 'think';
        const activeTool = data?.activeTool || null;
        const language = data?.language || 'en';

        // Convert UIMessages to model messages using the v6 utility
        const modelMessages = await convertToModelMessages(messages);

        // Build tool-specific context
        let toolContext = '';
        switch (activeTool) {
            case 'crop-help':
                toolContext = `\nACTIVE TOOL: Crop Help Agent
The user is specifically seeking crop guidance. Focus your response on:
- Detailed planting/growing instructions
- Fertilizer schedules with specific Indian brands and quantities
- Pest and disease management
- Harvest timing and techniques
- Water/irrigation management
- Seasonal considerations (Kharif/Rabi/Zaid)
Always provide actionable, step-by-step advice.`;
                break;
            case 'disease-detect':
                toolContext = `\nACTIVE TOOL: Crop Disease Detection Agent
The user wants to identify crop diseases. Focus your response on:
- Carefully analyze any uploaded images for disease symptoms
- Identify the disease with confidence level
- Provide BOTH chemical AND organic treatment options
- Mention specific Indian brand medicines with dosage and cost in ₹
- Suggest preventive measures for future
- Estimate severity and recovery time
If an image is provided, analyze it in detail. If no image, ask clarifying questions about symptoms.`;
                break;
            case 'gov-schemes':
                toolContext = `\nACTIVE TOOL: Government Schemes Agent
The user wants information about government schemes. Focus your response on:
- Relevant central and state-level schemes (PM-KISAN, PMFBY, KCC, SMAM, PKVY, eNAM, etc.)
- Eligibility criteria and required documents
- How to apply (online/offline process)
- Benefits and subsidy amounts
- Application deadlines if applicable
- State-specific schemes based on user's location
Always provide the most up-to-date information and direct application links where possible.`;
                break;
            case 'sell-produce':
                toolContext = `\nACTIVE TOOL: Produce Selling Advisor Agent
The user wants help selling their produce. Focus your response on:
- Current market prices (mandi rates) for their crop
- Best time and market to sell
- How to get the best price
- Post-harvest handling and grading tips
- Transport and logistics advice
- eNAM and direct buyer connection options
- Quality grading standards (A/B/C)
Help the farmer maximize their profit.`;
                break;
            case 'weather':
                toolContext = `\nACTIVE TOOL: Weather Advisory Agent
The user wants weather-related farming advice. Focus your response on:
- Current weather impact on farming activities
- Best timing for sowing/spraying/harvesting based on weather
- Weather-based pest/disease risk alerts
- Irrigation scheduling recommendations
- Crop protection measures for extreme weather
Provide practical, actionable weather-based farming advice.`;
                break;
            case 'soil-analysis':
                toolContext = `\nACTIVE TOOL: Soil Analysis Agent
The user wants soil-related advice. Focus your response on:
- Soil health assessment and testing guidance
- pH level management and correction
- Nutrient deficiency identification and correction
- Organic matter improvement techniques
- Soil preparation for specific crops
- Composting and bio-fertilizer recommendations
- If an image of soil is provided, analyze its condition.`;
                break;
            case 'market-prices':
                toolContext = `\nACTIVE TOOL: Market Prices Agent
The user wants current market price information. Focus your response on:
- Current mandi prices for crops in their region
- Price trends and forecasts
- Best markets to sell in their area
- Price comparison across different mandis
- Demand-supply analysis
- Tips for getting better prices`;
                break;
        }

        const langMap: Record<string, string> = {
            en: 'English',
            hi: 'Hindi (हिंदी)',
            mr: 'Marathi (मराठी)'
        };
        const respondInLanguage = langMap[language] || 'English';

        const result = streamText({
            model: google('gemini-2.5-flash'),
            system: `You are KrishiMitra AI (किसान मित्र / Kisan Mitra), an intelligent farming companion for Indian farmers.
Current Mode: ${mode === 'research' ? 'Research (Deep technical analysis with detailed data and sources)' : 'Think (Quick practical farming advice)'}
User's Selected Language: ${respondInLanguage}
${toolContext}

Your expertise:
1. **Crop Guidance**: Planting, growing, fertilizer schedules, harvest timing, soil preparation, seed selection, water management
2. **Disease Detection**: Identify crop diseases from descriptions/images, provide treatment with specific medicine names, dosages in Indian market brands
3. **Market Intelligence**: Current mandi prices, demand trends, best time to sell, connecting farmers to buyers
4. **Government Schemes**: PM-KISAN, PMFBY, KCC, SMAM, PKVY, eNAM, state-specific schemes — eligibility, benefits, how to apply, documents needed
5. **Weather Advisory**: Crop-weather correlation, sowing/harvesting timing based on forecasts
6. **Organic Farming**: Traditional Indian methods (Jeevamrut, Beejamrut, Panchagavya), certification process
7. **Soil Analysis**: Soil health, pH management, nutrient deficiency, composting

Rules:
- ALWAYS respond in ${respondInLanguage}. This is critical.
- Use farmer-friendly simple language. Avoid jargon.
- Give specific actionable advice with quantities, timings, and costs in ₹.
- Reference Indian brands and locally available products.
- When discussing diseases, always mention both chemical AND organic remedies.
- For schemes, always mention eligibility criteria and required documents.
- Suggest next logical action the farmer should take.
- If an image is provided with the message, analyze it carefully for crop diseases, pest damage, nutrient deficiency, or soil condition.
- When analyzing images, be specific about what you see and provide detailed diagnosis.
- Use markdown formatting for better readability (headers, bold, lists, tables).
- In Research mode, provide comprehensive, detailed analysis with data points.
- In Think mode, keep advice concise and actionable.`,
            messages: modelMessages,
            stopWhen: stepCountIs(5),
            tools: {
                cropHelp: {
                    description: 'Provide detailed crop guidance including planting, fertilizer schedule, pest management, and harvest tips for Indian farming conditions.',
                    parameters: z.object({
                        crop: z.string().describe('Name of the crop (e.g., Tomato, Wheat, Rice, Cotton, Sugarcane)'),
                        topic: z.enum(['planting', 'fertilizer', 'disease', 'harvest', 'irrigation', 'seed_selection', 'general']).optional(),
                        region: z.string().optional().describe('Farming region (e.g., Maharashtra, Punjab, Karnataka)'),
                        season: z.enum(['kharif', 'rabi', 'zaid']).optional(),
                    }),
                    execute: async ({ crop, topic, region, season }: { crop: string; topic?: string; region?: string; season?: string }) => {
                        return {
                            crop,
                            topic: topic || 'general',
                            region: region || 'India',
                            season: season || 'current',
                            advice: `Comprehensive guidance for ${crop} farming in ${region || 'India'} during ${season || 'current'} season.`,
                            note: 'Provide detailed, region-specific, actionable advice with specific quantities, brands, and costs in ₹.',
                        };
                    },
                },
                diseaseCheck: {
                    description: 'Diagnose crop disease from symptoms description and provide treatment plan with Indian market medicine names and prices.',
                    parameters: z.object({
                        symptoms: z.string().describe('Visible symptoms (e.g., yellow leaves, brown spots, wilting)'),
                        crop: z.string().optional().describe('Affected crop name'),
                        severity: z.enum(['mild', 'moderate', 'severe']).optional(),
                    }),
                    execute: async ({ symptoms, crop, severity }: { symptoms: string; crop?: string; severity?: string }) => {
                        return {
                            symptoms,
                            crop: crop || 'Unknown',
                            severity: severity || 'moderate',
                            note: 'Provide diagnosis with chemical + organic treatment options, specific Indian brand names and ₹ costs.',
                        };
                    },
                },
                findSchemes: {
                    description: 'Find government and private schemes, subsidies, loans for farmers based on their profile.',
                    parameters: z.object({
                        category: z.enum(['income_support', 'insurance', 'credit', 'irrigation', 'machinery', 'organic', 'market', 'all']).optional(),
                        income: z.string().optional().describe('Annual income range'),
                        landSize: z.string().optional().describe('Land size in acres'),
                        state: z.string().optional().describe('State name'),
                        crop: z.string().optional(),
                    }),
                    execute: async ({ category, income, landSize, state, crop }: { category?: string; income?: string; landSize?: string; state?: string; crop?: string }) => {
                        return {
                            category: category || 'all',
                            farmerProfile: { income, landSize, state, crop },
                            note: 'List matching schemes with eligibility, benefits, application process, and required documents.',
                        };
                    },
                },
                sellProduce: {
                    description: 'Help farmer list their produce for sale in the marketplace with fair price suggestions.',
                    parameters: z.object({
                        crop: z.string(),
                        quantity: z.string().describe('Quantity with unit (e.g., 5 quintal, 100 kg)'),
                        quality: z.enum(['A', 'B', 'C']).optional(),
                        expectedPrice: z.string().optional(),
                        location: z.string().optional(),
                    }),
                    execute: async ({ crop, quantity, quality, expectedPrice }: { crop: string; quantity: string; quality?: string; expectedPrice?: string }) => ({
                        status: "Listed",
                        listingId: "KM-" + Date.now().toString(36).toUpperCase(),
                        crop,
                        quantity,
                        quality: quality || 'A',
                        suggestedPrice: expectedPrice || 'Market rate',
                        message: `${crop} (${quantity}) listed successfully. Buyers in your area will be notified.`,
                    }),
                },
                findBuyers: {
                    description: 'Find verified buyers for specific crops near farmer location.',
                    parameters: z.object({
                        crop: z.string(),
                        location: z.string().optional(),
                        quantity: z.string().optional(),
                    }),
                    execute: async ({ crop, location }: { crop: string; location?: string }) => ({
                        buyers: [
                            { name: "Ramesh Traders", location: location || "APMC Market", rating: 4.5, verified: true },
                            { name: "Fresh Farm Direct", location: "Online Platform", rating: 4.8, verified: true },
                            { name: "AgriConnect Exports", location: "Mumbai", rating: 4.3, verified: true },
                        ],
                        message: `Found 3 verified buyers for ${crop}. Contact through the app for best prices.`,
                    }),
                },
                weatherAdvice: {
                    description: 'Provide weather-based farming advice for crop planning and protection.',
                    parameters: z.object({
                        location: z.string().optional(),
                        crop: z.string().optional(),
                        activity: z.enum(['sowing', 'spraying', 'harvesting', 'irrigation', 'general']).optional(),
                    }),
                    execute: async ({ location, crop, activity }: { location?: string; crop?: string; activity?: string }) => ({
                        location: location || 'Your area',
                        advice: `Weather-based ${activity || 'farming'} advice for ${crop || 'crops'}.`,
                        note: 'Provide practical weather-correlated farming advice.',
                    }),
                },
                soilAnalysis: {
                    description: 'Analyze soil condition and provide recommendations for improvement including pH correction, nutrient management, and organic amendments.',
                    parameters: z.object({
                        soilType: z.string().optional().describe('Type of soil (e.g., clay, sandy, loam, black)'),
                        crop: z.string().optional().describe('Intended crop to grow'),
                        issue: z.string().optional().describe('Specific soil issue (e.g., low pH, salinity, poor drainage)'),
                        region: z.string().optional().describe('Farming region'),
                    }),
                    execute: async ({ soilType, crop, issue, region }: { soilType?: string; crop?: string; issue?: string; region?: string }) => ({
                        soilType: soilType || 'Unknown',
                        crop: crop || 'General',
                        issue: issue || 'General assessment',
                        region: region || 'India',
                        note: 'Provide detailed soil improvement recommendations with specific products, quantities, and costs in ₹.',
                    }),
                },
                marketPrices: {
                    description: 'Get current market (mandi) prices for crops in specific regions of India.',
                    parameters: z.object({
                        crop: z.string().describe('Crop name'),
                        state: z.string().optional().describe('State name'),
                        market: z.string().optional().describe('Specific mandi/market name'),
                    }),
                    execute: async ({ crop, state, market }: { crop: string; state?: string; market?: string }) => ({
                        crop,
                        state: state || 'All India',
                        market: market || 'Major mandis',
                        note: 'Provide current price ranges, trends, and best markets for selling.',
                    }),
                },
            },
        });

        // Use toUIMessageStreamResponse for ai@6 compatibility with DefaultChatTransport
        return result.toUIMessageStreamResponse();
    } catch (e) {
        console.error("Error in chat route:", e);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
