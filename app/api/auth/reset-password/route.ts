import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withRateLimit, authLimiter } from "@/lib/middleware"

async function resetPasswordHandler(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Find user with this reset token
    const users = Array.from(db["users"].values())
    const user = users.find((u) => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > new Date())

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Update password and clear reset token
    const hashedPassword = await AuthUtils.hashPassword(newPassword)
    db.updateUser(user.id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    })

    // Invalidate all refresh tokens for this user
    db.deleteRefreshTokensByUserId(user.id)

    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(authLimiter)(resetPasswordHandler)
