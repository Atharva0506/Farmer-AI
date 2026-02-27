/**
 * /api/disease-history — Returns user's crop disease detection history.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const reports = await prisma.diseaseReport.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                cropName: true,
                disease: true,
                severity: true,
                confidence: true,
                treatments: true,
                createdAt: true,
            },
        });

        // Parse treatments JSON for each report
        const parsed = reports.map((r) => ({
            ...r,
            treatments: (() => {
                try {
                    return JSON.parse(r.treatments);
                } catch {
                    return [];
                }
            })(),
        }));

        return Response.json({ reports: parsed });
    } catch (error) {
        console.error("Disease history error:", error);
        return Response.json({ error: "Failed to load history" }, { status: 500 });
    }
}
