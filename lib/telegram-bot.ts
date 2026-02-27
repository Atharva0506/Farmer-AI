/**
 * lib/telegram-bot.ts — Telegram Bot Gateway for KrishiMitra.
 * Exposes the AI assistant via Telegram — farmers don't need to install any app.
 * Uses the Telegram Bot API directly (no npm package needed).
 */
import { getGeminiModel } from "@/lib/gemini";
import { generateText, tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { searchSchemes } from "@/lib/schemes";
import { analyzeCropDisease } from "@/lib/crop-disease";
import { analyzeSoil } from "@/lib/soil-analysis";
import { generateFarmingCalendar } from "@/lib/farming-calendar";
import { generateYieldForecast } from "@/lib/yield-forecast";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";

const TELEGRAM_API = "https://api.telegram.org/bot";

// ─── Telegram API Helpers ─────────────────────
export function getTelegramToken(): string {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
    return token;
}

export async function sendTelegramMessage(
    chatId: number | string,
    text: string,
    options?: { parse_mode?: string; reply_to_message_id?: number }
) {
    const token = getTelegramToken();
    // Telegram has a 4096 character limit
    const chunks = splitMessage(text, 4000);

    for (const chunk of chunks) {
        await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: chunk,
                parse_mode: options?.parse_mode || "Markdown",
                ...(options?.reply_to_message_id && { reply_to_message_id: options.reply_to_message_id }),
            }),
        });
    }
}

export async function sendTelegramTyping(chatId: number | string) {
    const token = getTelegramToken();
    await fetch(`${TELEGRAM_API}${token}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
}

export async function setTelegramWebhook(webhookUrl: string): Promise<{ ok: boolean; description?: string }> {
    const token = getTelegramToken();
    const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["message"],
            max_connections: 40,
        }),
    });
    return res.json();
}

// ─── Message Splitting (Telegram has 4096 char limit) ─
function splitMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= maxLen) {
            chunks.push(remaining);
            break;
        }
        // Find a good split point (newline or space)
        let splitAt = remaining.lastIndexOf("\n", maxLen);
        if (splitAt < maxLen / 2) splitAt = remaining.lastIndexOf(" ", maxLen);
        if (splitAt < maxLen / 2) splitAt = maxLen;
        chunks.push(remaining.slice(0, splitAt));
        remaining = remaining.slice(splitAt).trim();
    }
    return chunks;
}

// ─── Download file from Telegram ──────────────
async function downloadTelegramFile(fileId: string): Promise<string> {
    const token = getTelegramToken();
    const fileRes = await fetch(`${TELEGRAM_API}${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) {
        throw new Error("Could not get file from Telegram");
    }
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    const imageRes = await fetch(downloadUrl);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = fileData.result.file_path.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mimeType};base64,${base64}`;
}

// ─── Detect language from text ─────────────────
function detectLanguage(text: string): string {
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(text)) {
        return "hi";
    }
    return "en";
}

// ─── Build simplified tools for Telegram ──────
function buildTelegramTools(language: string) {
    const langName = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";
    const langReminder = `Respond in ${langName}. Keep responses concise for Telegram (max 2000 chars).`;

    return {
        weatherAdvice: tool({
            description: "Get weather for farming. Use when user asks about weather, rain, temperature.",
            inputSchema: z.object({
                location: z.string().optional(),
                crop: z.string().optional(),
            }),
            execute: async ({ location, crop }: { location?: string; crop?: string }) => {
                try {
                    const res = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=21.146&longitude=79.088&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`
                    );
                    const data = await res.json();
                    return {
                        action: "weather_data",
                        current: data.current,
                        forecast: data.daily,
                        location: location || "Central India",
                        crop,
                        instruction: `Provide concise weather-based farming advice. ${langReminder}`,
                    };
                } catch {
                    return { action: "weather_fallback", instruction: `Weather API unavailable. Give general advice. ${langReminder}` };
                }
            },
        }),

        findSchemes: tool({
            description: "Find government schemes for farmers.",
            inputSchema: z.object({
                state: z.string().optional(),
                crop: z.string().optional(),
            }),
            execute: async ({ state, crop }: { state?: string; crop?: string }) => {
                try {
                    const result = await searchSchemes({ state, crop, language });
                    return {
                        action: "scheme_results",
                        schemes: result.schemes.slice(0, 3).map((s) => ({
                            name: s.name, benefit: s.benefit, howToApply: s.howToApply,
                        })),
                        instruction: `Present top schemes concisely. ${langReminder}`,
                    };
                } catch {
                    return { action: "scheme_failed", instruction: `Scheme search failed. Give general info. ${langReminder}` };
                }
            },
        }),

        diseaseCheck: tool({
            description: "Diagnose crop disease from symptoms description.",
            inputSchema: z.object({
                symptoms: z.string().describe("Description of crop symptoms"),
                cropName: z.string().optional(),
            }),
            execute: async ({ symptoms, cropName }: { symptoms: string; cropName?: string }) => {
                try {
                    const report = await analyzeCropDisease({ symptoms, cropName, language });
                    return {
                        action: "disease_report",
                        disease: report.disease,
                        severity: report.severity,
                        confidence: report.confidence,
                        treatments: report.treatment?.slice(0, 3),
                        instruction: `Present disease diagnosis concisely with treatment. ${langReminder}`,
                    };
                } catch {
                    return { action: "disease_failed", instruction: `Disease check failed. Give general advice. ${langReminder}` };
                }
            },
        }),

        soilAnalysis: tool({
            description: "Analyze soil based on description.",
            inputSchema: z.object({
                description: z.string(),
                crop: z.string().optional(),
            }),
            execute: async ({ description, crop }: { description: string; crop?: string }) => {
                try {
                    const report = await analyzeSoil({ description, crop, language });
                    return {
                        action: "soil_report",
                        soilType: report.soilType,
                        ph: report.phLevel,
                        nutrients: report.nutrients,
                        recommendations: report.recommendations?.slice(0, 3),
                        instruction: `Present soil analysis concisely. ${langReminder}`,
                    };
                } catch {
                    return { action: "soil_failed", instruction: `Soil analysis failed. Give general advice. ${langReminder}` };
                }
            },
        }),

        yieldForecast: tool({
            description: "Predict yield and revenue for a crop.",
            inputSchema: z.object({
                crop: z.string(),
                landSizeAcres: z.number().optional(),
            }),
            execute: async ({ crop, landSizeAcres }: { crop: string; landSizeAcres?: number }) => {
                try {
                    const forecast = await generateYieldForecast({ crop, landSizeAcres, language });
                    return {
                        action: "yield_forecast",
                        ...forecast,
                        instruction: `Present yield forecast concisely with min/max ranges. ${langReminder}`,
                    };
                } catch {
                    return { action: "yield_failed", instruction: `Forecast failed. Give general estimates. ${langReminder}` };
                }
            },
        }),
    };
}

// ─── Process photo message ─────────────────────
async function processTelegramPhoto(message: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number };
    photo?: { file_id: string; width: number; height: number }[];
    caption?: string;
}) {
    const chatId = message.chat.id;
    await sendTelegramTyping(chatId);

    try {
        const photos = message.photo || [];
        const largestPhoto = photos[photos.length - 1];
        if (!largestPhoto) {
            await sendTelegramMessage(chatId, "⚠️ Could not read the photo. Please try again.");
            return;
        }

        await sendTelegramMessage(chatId, "🔍 Analyzing your crop image... Please wait.", { parse_mode: "Markdown" });

        const imageDataUrl = await downloadTelegramFile(largestPhoto.file_id);
        const caption = message.caption?.trim() || "";
        const language = caption ? detectLanguage(caption) : "en";
        const langName = language === "hi" ? "Hindi (हिंदी)" : language === "mr" ? "Marathi (मराठी)" : "English";
        const startTime = Date.now();

        const result = await generateText({
            model: getGeminiModel(),
            system: `You are KrishiMitra AI (कृषि मित्र), a crop disease expert on Telegram.
Analyze the uploaded crop/plant image and identify diseases, pests, or nutrient deficiencies.
Provide: 1) Disease name 2) Severity 3) Cause 4) Treatment (chemical + organic with Indian brands) 5) Prevention
RESPOND in ${langName}. Be concise. Use emojis. Keep under 3000 chars.`,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "image" as const, image: imageDataUrl },
                        { type: "text" as const, text: caption || "Please analyze this crop image for diseases." },
                    ],
                },
            ],
        });

        await sendTelegramMessage(chatId, result.text || "Could not analyze the image.");

        const usage = extractUsage(result);
        logApiUsage({ route: "/api/telegram/webhook (photo)", ...usage, durationMs: Date.now() - startTime });
    } catch (error) {
        console.error("Telegram photo analysis error:", error);
        await sendTelegramMessage(chatId, "⚠️ Could not analyze the image. Try a clearer photo or describe symptoms in text.");
    }
}

// ─── Process incoming Telegram message ─────────
export async function processTelegramMessage(message: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number };
    text?: string;
    photo?: { file_id: string; width: number; height: number }[];
    caption?: string;
}) {
    const chatId = message.chat.id;

    // Handle photo messages
    if (message.photo && message.photo.length > 0) {
        await processTelegramPhoto(message);
        return;
    }

    const userText = message.text?.trim();

    if (!userText) {
        await sendTelegramMessage(chatId, "🌿 Send a text message or a photo of your crop for disease analysis!");
        return;
    }

    // Handle /start command
    if (userText === "/start") {
        const welcomeMsg = `🌿 *KrishiMitra AI* — Your Farming Assistant

Namaste! I'm your AI farming helper. Ask me anything:

🌾 *Crop Help* — "My wheat has yellow spots"
🐛 *Disease Check* — "Identify disease on my tomato"
🌤 *Weather* — "Weather for farming this week"
📋 *Schemes* — "Which schemes can I apply for?"
📊 *Yield Forecast* — "Expected yield for rice on 3 acres"
🧪 *Soil Analysis* — "Black soil planning wheat"

Just type your question in Hindi, Marathi, or English!`;
        await sendTelegramMessage(chatId, welcomeMsg);
        return;
    }

    // Handle /help command
    if (userText === "/help") {
        await sendTelegramMessage(chatId, `📖 *Commands:*
/start — Welcome message
/help — This help menu

Or just type any farming question!
Supported: Hindi 🇮🇳, Marathi, English`);
        return;
    }

    // Show typing indicator
    await sendTelegramTyping(chatId);

    const language = detectLanguage(userText);
    const langName = language === "hi" ? "Hindi (हिंदी)" : language === "mr" ? "Marathi (मराठी)" : "English";
    const startTime = Date.now();

    try {
        const result = await generateText({
            model: getGeminiModel(),
            system: `You are KrishiMitra AI (कृषि मित्र), a farming assistant on Telegram.
You help Indian farmers with crop advice, disease identification, weather, schemes, and market info.
RESPOND ENTIRELY in ${langName}. Be concise — Telegram has character limits.
Use simple language. Include emojis for readability.
If the farmer asks about something you can use a tool for, USE the tool.
Keep responses under 2000 characters.`,
            messages: [{ role: "user" as const, content: userText }],
            tools: buildTelegramTools(language),
            // @ts-ignore - maxSteps is supported at runtime
            maxSteps: 3,
        });

        const responseText = result.text || "I couldn't process that. Please try again.";
        await sendTelegramMessage(chatId, responseText);

        // Log usage
        const usage = extractUsage(result);
        logApiUsage({
            route: "/api/telegram/webhook",
            ...usage,
            durationMs: Date.now() - startTime,
        });
    } catch (error) {
        console.error("Telegram AI error:", error);
        await sendTelegramMessage(
            chatId,
            "⚠️ Sorry, I encountered an error. Please try again in a moment."
        );
    }
}
