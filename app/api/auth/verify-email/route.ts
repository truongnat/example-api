import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withRateLimit, generalLimiter } from "@/lib/middleware"
import { AuthUtils } from "@/lib/auth"

async function verifyEmailHandler(req: NextRequest) {
  try {
    console.log("[v0] Starting email verification process")
    const { token } = await req.json()
    console.log("[v0] Received token:", token ? "present" : "missing")

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Find user with this verification token
    console.log("[v0] Searching for user with verification token")
    const users = Array.from(db["users"].values())
    console.log("[v0] Total users in database:", users.length)

    const user = users.find((u) => u.verificationToken === token)
    console.log("[v0] User found:", user ? "yes" : "no")

    if (!user) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Email already verified" })
    }

    // Update user as verified
    console.log("[v0] Updating user verification status")
    const updatedUser = { ...user, isVerified: true, verificationToken: undefined }
    db.users.set(user.id, updatedUser)
    console.log("[v0] User updated successfully")

    console.log("[v0] Generating tokens")
    const tokenPayload = { userId: user.id, email: user.email }
    const accessToken = AuthUtils.generateAccessToken(tokenPayload)
    const refreshToken = AuthUtils.generateRefreshToken(tokenPayload)
    console.log("[v0] Tokens generated successfully")

    // Store refresh token
    console.log("[v0] Storing refresh token")
    db.refreshTokens.set(refreshToken, { userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    console.log("[v0] Refresh token stored successfully")

    return NextResponse.json({
      message: "Email verified successfully",
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: true,
      },
    })
  } catch (error) {
    console.error("[v0] Email verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(generalLimiter)(verifyEmailHandler)
