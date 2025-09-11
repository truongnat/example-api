import { type NextRequest, NextResponse } from "next/server"
import { db, type RefreshToken } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withRateLimit, generalLimiter } from "@/lib/middleware"

async function refreshHandler(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Verify refresh token
    const payload = AuthUtils.verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Check if refresh token exists in database
    const storedToken = db.getRefreshToken(refreshToken)
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Refresh token expired or not found" }, { status: 401 })
    }

    // Verify user still exists
    const user = db.getUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Generate new tokens
    const newPayload = { userId: user.id, email: user.email }
    const newAccessToken = AuthUtils.generateAccessToken(newPayload)
    const newRefreshToken = AuthUtils.generateRefreshToken(newPayload)

    // Delete old refresh token and create new one
    db.deleteRefreshToken(refreshToken)
    const newRefreshTokenRecord: RefreshToken = {
      id: AuthUtils.generateId(),
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    }
    db.createRefreshToken(newRefreshTokenRecord)

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(generalLimiter)(refreshHandler)
