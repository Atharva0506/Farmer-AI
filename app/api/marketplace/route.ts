import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: List active marketplace listings
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const crop = url.searchParams.get("crop");
    const status = url.searchParams.get("status") || "ACTIVE";

    const where: any = { status };
    if (crop) where.cropName = { contains: crop, mode: "insensitive" };

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, phone: true, location: true },
        },
      },
    });

    return NextResponse.json({ listings });
  } catch (error: any) {
    console.error("Marketplace list error:", error);
    return NextResponse.json(
      { error: "Failed to load listings" },
      { status: 500 }
    );
  }
}

// POST: Create a new listing
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user actually exists in DB (guards against stale JWT after DB reset)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please sign out and sign in again." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { cropName, quantity, unit, pricePerUnit, location, imageUrl, description } = body;

    if (!cropName || !quantity || !pricePerUnit) {
      return NextResponse.json(
        { error: "cropName, quantity, and pricePerUnit are required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        cropName,
        quantity: String(quantity),
        unit: unit || "kg",
        pricePerUnit: Number(pricePerUnit),
        location: location ? JSON.stringify(location) : null,
        imageUrl,
        description,
      },
    });

    return NextResponse.json({ success: true, listing });
  } catch (error: any) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
