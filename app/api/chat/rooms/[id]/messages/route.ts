import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getMessagesHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const room = db.getChatRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if user is a member
    if (!room.members.includes(req.user!.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get messages
    const messages = db.getChatMessagesByRoomId(params.id, limit, offset)

    // Add user details to messages
    const messagesWithUsers = messages.map((message) => {
      const user = db.getUserById(message.userId)
      return {
        ...message,
        user: user
          ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
            }
          : null,
      }
    })

    return NextResponse.json({
      messages: messagesWithUsers,
      pagination: {
        limit,
        offset,
        hasMore: messages.length === limit,
      },
    })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getMessagesHandler)
