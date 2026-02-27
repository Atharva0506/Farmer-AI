/**
 * /api/profile — GET and POST for farmer profile management.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().optional(),
    crops: z.array(z.string()).optional(),
    landSizeAcres: z.number().min(0).optional(),
    state: z.string().optional(),
    incomeRange: z.string().optional(),
    location: z.string().optional(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            phone: true,
            role: true,
            crops: true,
            landSizeAcres: true,
            state: true,
            incomeRange: true,
            location: true,
            onboarded: true,
        },
    });

    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ profile: user });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = profileSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json(
                { error: "Invalid data", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const updated = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.crops !== undefined && { crops: data.crops }),
                ...(data.landSizeAcres !== undefined && { landSizeAcres: data.landSizeAcres }),
                ...(data.state !== undefined && { state: data.state }),
                ...(data.incomeRange !== undefined && { incomeRange: data.incomeRange }),
                ...(data.location !== undefined && { location: data.location }),
                onboarded: true,
            },
            select: {
                id: true,
                name: true,
                crops: true,
                landSizeAcres: true,
                state: true,
                incomeRange: true,
                onboarded: true,
            },
        });

        return Response.json({ success: true, profile: updated });
    } catch (error) {
        console.error("Profile update error:", error);
        return Response.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
