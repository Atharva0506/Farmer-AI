/**
 * /api/scheme-apply — POST endpoint for Smart Scheme Auto-Apply.
 * Generates structured document checklist with pre-filled farmer data.
 */
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logApiUsage, extractUsage } from "@/lib/usage-logger";

export const maxDuration = 60;

const schemeApplicationSchema = z.object({
    schemeName: z.string().describe("Official scheme name"),
    schemeCategory: z.string().describe("Category: subsidy, loan, insurance, etc."),
    overview: z.string().describe("Brief scheme description"),
    eligibility: z.array(z.string()).describe("Eligibility criteria"),
    benefits: z.array(z.string()).describe("Key benefits"),
    requiredDocuments: z.array(
        z.object({
            document: z.string().describe("Document name"),
            details: z.string().describe("Specifics needed"),
            available: z.boolean().describe("Whether farmer likely has this based on profile"),
            tip: z.string().describe("How to get this document if missing"),
        })
    ).describe("Complete document checklist"),
    preFilledInfo: z.object({
        name: z.string(),
        phone: z.string(),
        crops: z.string(),
        landSize: z.string(),
        state: z.string(),
        additionalFields: z.array(
            z.object({
                field: z.string(),
                value: z.string(),
                source: z.string().describe("'profile' or 'manual'"),
            })
        ),
    }).describe("Pre-filled application information"),
    applicationSteps: z.array(
        z.object({
            step: z.number(),
            title: z.string(),
            description: z.string(),
            mode: z.enum(["online", "offline", "both"]),
            link: z.string().optional().describe("URL if online"),
        })
    ).describe("Step-by-step application process"),
    importantDates: z.array(
        z.object({
            event: z.string(),
            date: z.string(),
            isDeadline: z.boolean(),
        })
    ).describe("Key dates and deadlines"),
    nearestOffice: z.object({
        name: z.string(),
        type: z.string().describe("e.g. 'Block Development Office', 'Krishi Bhawan'"),
        suggestedOffice: z.string().describe("Suggested office based on farmer's state"),
    }),
});

export type SchemeApplication = z.infer<typeof schemeApplicationSchema>;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { schemeName, language = "en" } = body;

        if (!schemeName) {
            return Response.json({ error: "Scheme name is required" }, { status: 400 });
        }

        // Get farmer profile
        const profile = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, phone: true, crops: true, landSizeAcres: true, state: true },
        });

        const langName = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";
        const startTime = Date.now();

        const result = await generateObject({
            model: google("gemini-2.5-flash"),
            schema: schemeApplicationSchema,
            system: `You are KrishiMitra AI, an expert on Indian agricultural government schemes.
ALL text MUST be in ${langName}.
Generate a complete, actionable scheme application guide.
Be specific about documents, deadlines, and office locations.
If the farmer has certain profile data, mark those documents as "available".
Use the farmer's state to suggest the nearest appropriate office.`,
            prompt: `Generate a complete application guide for: "${schemeName}"

Farmer Profile:
- Name: ${profile?.name || "[Not provided]"}
- Phone: ${profile?.phone || "[Not provided]"}
- Crops: ${profile?.crops?.join(", ") || "[Not provided]"}
- Land Size: ${profile?.landSizeAcres ? `${profile.landSizeAcres} acres` : "[Not provided]"}
- State: ${profile?.state || "[Not provided]"}

Provide:
1. Complete document checklist with availability status based on what the farmer likely has
2. Pre-filled info from their profile
3. Step-by-step application process (online + offline options)
4. Important deadlines
5. Nearest office suggestion for their state`,
        });

        const usage = extractUsage(result);
        logApiUsage({
            route: "/api/scheme-apply",
            ...usage,
            durationMs: Date.now() - startTime,
        });

        return Response.json({ success: true, application: result.object });
    } catch (error) {
        console.error("Scheme application error:", error);
        return Response.json({ error: "Failed to generate application guide" }, { status: 500 });
    }
}
