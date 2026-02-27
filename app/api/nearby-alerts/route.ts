/**
 * /api/nearby-alerts — GET endpoint for disease alerts near the farmer.
 * Innovation Feature #4: Simplified disease heatmap using aggregated reports.
 * Creates community data advantage — the more users, the better the alerts.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get user's state for location-based filtering
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { state: true, crops: true },
        });

        // Get recent disease reports from all users (anonymized)
        const recentReports = await prisma.diseaseReport.findMany({
            where: {
                createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Last 14 days
                userId: { not: session.user.id }, // Exclude own reports
            },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                cropName: true,
                disease: true,
                severity: true,
                createdAt: true,
                user: {
                    select: { state: true },
                },
            },
        });

        // Aggregate by disease type
        const diseaseAggregation = new Map<string, {
            disease: string;
            cropName: string;
            count: number;
            severity: string;
            latestDate: Date;
            states: Set<string>;
        }>();

        for (const report of recentReports) {
            const key = `${report.disease}-${report.cropName}`;
            if (!diseaseAggregation.has(key)) {
                diseaseAggregation.set(key, {
                    disease: report.disease,
                    cropName: report.cropName,
                    count: 0,
                    severity: report.severity,
                    latestDate: report.createdAt,
                    states: new Set(),
                });
            }
            const agg = diseaseAggregation.get(key)!;
            agg.count++;
            if (report.user.state) agg.states.add(report.user.state);
            // Upgrade severity to highest seen
            const severityOrder = { low: 1, medium: 2, high: 3 };
            if ((severityOrder[report.severity as keyof typeof severityOrder] || 0) >
                (severityOrder[agg.severity as keyof typeof severityOrder] || 0)) {
                agg.severity = report.severity;
            }
        }

        // Convert to array with relevance scoring
        const alerts = Array.from(diseaseAggregation.values())
            .map((agg) => {
                // Relevance: higher if same state or same crops
                let relevance = 0;
                if (user?.state && agg.states.has(user.state)) relevance += 50;
                if (user?.crops?.some((c) => c.toLowerCase() === agg.cropName.toLowerCase())) relevance += 30;
                relevance += agg.count * 10; // More reports = more relevant

                return {
                    disease: agg.disease,
                    cropName: agg.cropName,
                    reportCount: agg.count,
                    severity: agg.severity,
                    states: Array.from(agg.states),
                    isNearby: user?.state ? agg.states.has(user.state) : false,
                    isRelevantCrop: user?.crops?.some((c) => c.toLowerCase() === agg.cropName.toLowerCase()) || false,
                    latestDate: agg.latestDate.toISOString(),
                    relevance,
                };
            })
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 10);

        return Response.json({
            alerts,
            totalReportsLast14Days: recentReports.length,
            userState: user?.state || null,
        });
    } catch (error) {
        console.error("Nearby alerts error:", error);
        return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}
