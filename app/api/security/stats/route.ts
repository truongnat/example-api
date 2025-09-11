import { NextResponse } from "next/server"
import { securityManager } from "@/lib/security"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getSecurityStatsHandler(req: AuthenticatedRequest) {
  try {
    // Only allow admin users to view security stats
    const user = req.user!
    // In a real app, you'd check if user has admin role
    // For now, we'll allow any authenticated user

    const stats = securityManager.getSecurityStats()

    return NextResponse.json({
      stats,
      message: "Security statistics retrieved successfully",
    })
  } catch (error) {
    console.error("[v0] Get security stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getSecurityStatsHandler)
