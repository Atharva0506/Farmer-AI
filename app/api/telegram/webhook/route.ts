/**
 * /api/telegram/webhook — POST endpoint for Telegram bot updates.
 * Telegram sends message updates to this webhook URL.
 * Handles both text messages and photo messages.
 */
import { processTelegramMessage } from "@/lib/telegram-bot";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Process text or photo messages
        if (body.message && (body.message.text || body.message.photo)) {
            // Process asynchronously — respond to Telegram immediately
            processTelegramMessage(body.message).catch((err) =>
                console.error("Telegram message processing error:", err)
            );
        }

        // Always respond 200 to Telegram to acknowledge receipt
        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Telegram webhook error:", error);
        return new Response("OK", { status: 200 });
    }
}
