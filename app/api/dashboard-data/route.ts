/**
 * /api/dashboard-data — Returns real dynamic data for the farmer dashboard.
 * Replaces all hardcoded fake data with actual DB queries.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Fetch real data in parallel
        const [
            recentListings,
            userListings,
            diseaseReports,
            userProfile,
        ] = await Promise.all([
            // Latest marketplace listings with prices (for market ticker)
            prisma.listing.findMany({
                where: { status: "ACTIVE", pricePerUnit: { gt: 0 } },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                    cropName: true,
                    pricePerUnit: true,
                    unit: true,
                    quantity: true,
                    createdAt: true,
                },
            }),

            // User's own listings
            prisma.listing.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    cropName: true,
                    quantity: true,
                    unit: true,
                    pricePerUnit: true,
                    status: true,
                    createdAt: true,
                },
            }),

            // User's disease reports (for crop health section)
            prisma.diseaseReport.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    cropName: true,
                    disease: true,
                    severity: true,
                    confidence: true,
                    createdAt: true,
                },
            }),

            // User profile for personalization
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    name: true,
                    crops: true,
                    landSizeAcres: true,
                    state: true,
                    onboarded: true,
                },
            }),
        ]);

        // Aggregate market prices by crop
        const marketPrices = aggregateMarketPrices(recentListings);

        return Response.json({
            marketPrices,
            userListings,
            diseaseReports,
            profile: userProfile,
            stats: {
                activeListings: userListings.filter((l) => l.status === "ACTIVE").length,
                totalDiseaseChecks: diseaseReports.length,
            },
        });
    } catch (error) {
        console.error("Dashboard data error:", error);
        return Response.json({ error: "Failed to load dashboard data" }, { status: 500 });
    }
}

// Group listings by crop and compute avg price
function aggregateMarketPrices(
    listings: { cropName: string; pricePerUnit: number; unit: string; createdAt: Date }[]
) {
    const grouped = new Map<string, { prices: number[]; unit: string }>();

    for (const l of listings) {
        const key = l.cropName.toLowerCase();
        if (!grouped.has(key)) {
            grouped.set(key, { prices: [], unit: l.unit });
        }
        grouped.get(key)!.prices.push(l.pricePerUnit);
    }

    return Array.from(grouped.entries()).map(([crop, data]) => ({
        crop: crop.charAt(0).toUpperCase() + crop.slice(1),
        avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length),
        unit: data.unit,
        listingCount: data.prices.length,
    }));
}
