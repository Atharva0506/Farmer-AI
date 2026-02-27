/**
 * /api/farming-calendar — POST endpoint for generating AI farming calendars.
 * Used by the /crop-calendar page.
 */
import { auth } from "@/auth";
import { generateFarmingCalendar } from "@/lib/farming-calendar";
import { checkRateLimit, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIP(req);
    const rl = checkRateLimit(ip, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.allowed) return rateLimitResponse(rl.resetMs);

    try {
        const body = await req.json();
        const { crop, sowingDate, language = "en" } = body;

        if (!crop || !sowingDate) {
            return Response.json(
                { error: "Crop name and sowing date are required" },
                { status: 400 }
            );
        }

        const calendar = await generateFarmingCalendar({
            crop,
            sowingDate,
            region: body.region,
            language,
        });

        return Response.json({ success: true, calendar });
    } catch (error) {
        console.error("Farming calendar error:", error);
        return Response.json(
            { error: "Failed to generate farming calendar" },
            { status: 500 }
        );
    }
}
