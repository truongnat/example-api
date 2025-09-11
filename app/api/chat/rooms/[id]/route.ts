import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { socketManager } from "@/lib/socket"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getRoomHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const room = db.getChatRoomById(params.id)

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if user is a member
    if (!room.members.includes(req.user!.userId)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get member details
    const memberDetails = room.members
      .map((memberId) => {
        const user = db.getUserById(memberId)
        return user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              isOnline: socketManager.isUserOnline(user.id),
            }
          : null
      })
      .filter(Boolean)

    return NextResponse.json({
      room: {
        ...room,
        members: memberDetails,
        onlineCount: socketManager.getOnlineUsersInRoom(room.id).length,
      },
    })
  } catch (error) {
    console.error("[v0] Get room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateRoomHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description } = await req.json()

    const room = db.getChatRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if user is the creator or admin
    if (room.createdBy !== req.user!.userId) {
      return NextResponse.json({ error: "Only room creator can update room details" }, { status: 403 })
    }

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: "Room name cannot be empty" }, { status: 400 })
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "Room name must be less than 100 characters" }, { status: 400 })
      }
    }

    if (description !== undefined && description.length > 500) {
      return NextResponse.json({ error: "Description must be less than 500 characters" }, { status: 400 })
    }

    // Update room
    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim()

    const updatedRoom = db.updateChatRoom(params.id, updates)

    // Notify room members
    socketManager.notifyRoom(params.id, "room_updated", {
      room: updatedRoom,
      updatedBy: {
        id: req.user!.userId,
        email: req.user!.email,
      },
    })

    return NextResponse.json({
      message: "Room updated successfully",
      room: updatedRoom,
    })
  } catch (error) {
    console.error("[v0] Update room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function deleteRoomHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const room = db.getChatRoomById(params.id)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if user is the creator
    if (room.createdBy !== req.user!.userId) {
      return NextResponse.json({ error: "Only room creator can delete the room" }, { status: 403 })
    }

    // Notify room members before deletion
    socketManager.notifyRoom(params.id, "room_deleted", {
      roomId: params.id,
      deletedBy: {
        id: req.user!.userId,
        email: req.user!.email,
      },
    })

    const deleted = db.deleteChatRoom(params.id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Room deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getRoomHandler)
export const PUT = withAuthAndRateLimit(generalLimiter)(updateRoomHandler)
export const DELETE = withAuthAndRateLimit(generalLimiter)(deleteRoomHandler)
