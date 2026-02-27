/**
 * /api/weather-alerts — GET endpoint for micro-climate weather alerts.
 * Uses farmer's profile crops + location to generate crop-specific weather alerts.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateWeatherAlerts } from "@/lib/weather-alerts";

export const maxDuration = 60;

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get farmer's profile for personalized alerts
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { crops: true, state: true },
        });

        // Get location from query params or use defaults
        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get("lat") || "21.146");
        const lon = parseFloat(searchParams.get("lon") || "79.088");
        const language = searchParams.get("lang") || "en";

        const alerts = await generateWeatherAlerts({
            latitude: lat,
            longitude: lon,
            crops: user?.crops || [],
            region: user?.state || undefined,
            language,
        });

        return Response.json({ success: true, alerts });
    } catch (error) {
        console.error("Weather alerts error:", error);
        return Response.json({ error: "Failed to generate weather alerts" }, { status: 500 });
    }
}
