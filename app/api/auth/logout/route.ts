import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withRateLimit, generalLimiter } from "@/lib/middleware"

async function logoutHandler(req: NextRequest) {
  try {
    const { refreshToken } = await req.json()

    if (refreshToken) {
      // Delete the specific refresh token
      db.deleteRefreshToken(refreshToken)
    }

    return NextResponse.json({
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(generalLimiter)(logoutHandler)
