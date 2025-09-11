import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withRateLimit, authLimiter } from "@/lib/middleware"

async function forgotPasswordHandler(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const user = db.getUserByEmail(email)
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      })
    }

    // Generate reset token
    const resetToken = AuthUtils.generateRandomToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    db.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    })

    // In a real app, you would send reset email here
    console.log(`[v0] Password reset token for ${email}: ${resetToken}`)

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(authLimiter)(forgotPasswordHandler)
