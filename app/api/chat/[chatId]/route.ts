import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Load messages for a specific chat
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    // Verify ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      chat: { id: chat.id, title: chat.title },
      messages,
    });
  } catch (error: any) {
    console.error("Load chat error:", error);
    return NextResponse.json(
      { error: "Failed to load chat" },
      { status: 500 }
    );
  }
}
