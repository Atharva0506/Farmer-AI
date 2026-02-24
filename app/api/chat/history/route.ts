import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: List user's chat sessions (with last message preview)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, createdAt: true },
        },
      },
    });

    const formatted = chats.map((chat) => ({
      id: chat.id,
      title: chat.title || "New Chat",
      updatedAt: chat.updatedAt,
      lastMessage: chat.messages[0]?.content?.slice(0, 100) || null,
      lastMessageRole: chat.messages[0]?.role || null,
    }));

    return NextResponse.json({ chats: formatted });
  } catch (error: any) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 }
    );
  }
}

// POST: Create a new chat session
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || "New Chat";

    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        title,
      },
    });

    return NextResponse.json({ chat: { id: chat.id, title: chat.title } });
  } catch (error: any) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a chat by ID (passed in body)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await req.json();
    if (!chatId) {
      return NextResponse.json({ error: "chatId required" }, { status: 400 });
    }

    // Verify ownership
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    await prisma.chat.delete({ where: { id: chatId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete chat error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
