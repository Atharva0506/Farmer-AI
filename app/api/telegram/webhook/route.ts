/**
 * /api/telegram/webhook — POST endpoint for Telegram bot updates.
 * Telegram sends message updates to this webhook URL.
 */
import { processTelegramMessage } from "@/lib/telegram-bot";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Verify this is a message update
        if (body.message?.text) {
            // Process asynchronously — respond to Telegram immediately
            // to avoid timeout (Telegram expects response within 60s)
            processTelegramMessage(body.message).catch((err) =>
                console.error("Telegram message processing error:", err)
            );
        }

        // Always respond 200 to Telegram to acknowledge receipt
        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Telegram webhook error:", error);
        return new Response("OK", { status: 200 }); // Still 200 to prevent Telegram retries
    }
}
