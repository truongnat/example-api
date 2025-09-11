import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getProfileHandler(req: AuthenticatedRequest) {
  try {
    const user = db.getUserById(req.user!.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateProfileHandler(req: AuthenticatedRequest) {
  try {
    const { name, avatar } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const updatedUser = db.updateUser(req.user!.userId, {
      name,
      avatar,
    })

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function changePasswordHandler(req: AuthenticatedRequest) {
  try {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    const user = db.getUserById(req.user!.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await AuthUtils.verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    // Update password
    const hashedPassword = await AuthUtils.hashPassword(newPassword)
    db.updateUser(user.id, { password: hashedPassword })

    // Invalidate all refresh tokens for this user
    db.deleteRefreshTokensByUserId(user.id)

    return NextResponse.json({
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getProfileHandler)
export const PUT = withAuthAndRateLimit(generalLimiter)(updateProfileHandler)
export const PATCH = withAuthAndRateLimit(generalLimiter)(changePasswordHandler)
