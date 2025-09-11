import { type NextRequest, NextResponse } from "next/server"
import { AuthUtils } from "./auth"
import { db } from "./database"
import { RateLimiter } from "./rate-limiter"

// Create rate limiter instances directly in this file
export const generalLimiter = new RateLimiter(15 * 60 * 1000, 100) // 100 requests per 15 minutes
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5) // 5 auth attempts per 15 minutes

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

// Rate limiting middleware
export function withRateLimit(limiter: typeof generalLimiter) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) =>
    async (req: NextRequest): Promise<NextResponse> => {
      const identifier = req.ip || req.headers.get("x-forwarded-for") || "unknown"

      if (!limiter.isAllowed(identifier)) {
        return NextResponse.json(
          {
            error: "Too many requests",
            retryAfter: Math.ceil((limiter.getResetTime(identifier) - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((limiter.getResetTime(identifier) - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": "100",
              "X-RateLimit-Remaining": limiter.getRemainingRequests(identifier).toString(),
              "X-RateLimit-Reset": limiter.getResetTime(identifier).toString(),
            },
          },
        )
      }

      return handler(req)
    }
}

// Authentication middleware
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = AuthUtils.verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Verify user still exists
    const user = db.getUserById(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    }

    return handler(req)
  }
}

// Combined middleware
export function withAuthAndRateLimit(limiter: typeof generalLimiter) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => withRateLimit(limiter)(withAuth(handler))
}
