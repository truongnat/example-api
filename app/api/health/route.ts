import { type NextRequest, NextResponse } from "next/server"
import { securityManager } from "@/lib/security"
import { withRateLimit, generalLimiter } from "@/lib/middleware"

async function healthCheckHandler(req: NextRequest) {
  const stats = securityManager.getSecurityStats()

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    security: {
      blockedIPs: stats.blockedIPs.length,
      recentEvents: stats.totalEvents,
    },
    uptime: process.uptime(),
  })
}

export const GET = withRateLimit(generalLimiter)(healthCheckHandler)
