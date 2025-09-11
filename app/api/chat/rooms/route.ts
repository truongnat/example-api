import { NextResponse } from "next/server"
import { db, type ChatRoom } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { socketManager } from "@/lib/socket"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getRoomsHandler(req: AuthenticatedRequest) {
  try {
    const rooms = db.getChatRoomsByUserId(req.user!.userId)

    // Add online user count to each room
    const roomsWithOnlineCount = rooms.map((room) => ({
      ...room,
      onlineCount: socketManager.getOnlineUsersInRoom(room.id).length,
      memberCount: room.members.length,
    }))

    return NextResponse.json({ rooms: roomsWithOnlineCount })
  } catch (error) {
    console.error("[v0] Get rooms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createRoomHandler(req: AuthenticatedRequest) {
  try {
    const { name, description, members = [] } = await req.json()

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: "Room name must be less than 100 characters" }, { status: 400 })
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: "Description must be less than 500 characters" }, { status: 400 })
    }

    // Validate members exist
    const validMembers = [req.user!.userId] // Creator is always a member
    for (const memberId of members) {
      if (memberId !== req.user!.userId) {
        const user = db.getUserById(memberId)
        if (user) {
          validMembers.push(memberId)
        }
      }
    }

    // Create room
    const room: ChatRoom = {
      id: AuthUtils.generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user!.userId,
      members: validMembers,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createdRoom = db.createChatRoom(room)

    // Notify all members about the new room
    validMembers.forEach((memberId) => {
      if (memberId !== req.user!.userId) {
        socketManager.notifyUser(memberId, "room_created", {
          room: createdRoom,
          createdBy: {
            id: req.user!.userId,
            email: req.user!.email,
          },
        })
      }
    })

    return NextResponse.json(
      {
        message: "Chat room created successfully",
        room: {
          ...createdRoom,
          onlineCount: 0,
          memberCount: createdRoom.members.length,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getRoomsHandler)
export const POST = withAuthAndRateLimit(generalLimiter)(createRoomHandler)
