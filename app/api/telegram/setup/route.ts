/**
 * /api/telegram/setup — GET endpoint to register the Telegram webhook.
 * Call this once after deployment: GET /api/telegram/setup?url=https://your-domain.com
 * Sets the webhook URL so Telegram sends updates to /api/telegram/webhook.
 */
import { auth } from "@/auth";
import { setTelegramWebhook } from "@/lib/telegram-bot";

export async function GET(req: Request) {
    // Only allow authenticated users to set up the webhook
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const baseUrl = searchParams.get("url");

    if (!baseUrl) {
        return Response.json(
            {
                error: "Missing 'url' parameter",
                usage: "GET /api/telegram/setup?url=https://your-domain.com",
                note: "The webhook will be set to: {url}/api/telegram/webhook",
            },
            { status: 400 }
        );
    }

    try {
        const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
        const result = await setTelegramWebhook(webhookUrl);

        return Response.json({
            success: result.ok,
            webhookUrl,
            telegramResponse: result,
            nextSteps: result.ok
                ? [
                    "✅ Webhook set successfully!",
                    "Open your Telegram bot and send /start",
                    "The bot will respond with KrishiMitra AI",
                ]
                : [
                    "❌ Webhook setup failed",
                    "Check your TELEGRAM_BOT_TOKEN in .env",
                    `Telegram says: ${result.description}`,
                ],
        });
    } catch (error: any) {
        return Response.json(
            { error: "Failed to set webhook", details: error?.message },
            { status: 500 }
        );
    }
}
