import { NextRequest, NextResponse } from "next/server"
import { securityManager } from "./security"

// Security headers middleware
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req)

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

    // HSTS for production
    if (process.env.NODE_ENV === "production") {
      response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }

    return response
  }
}

// IP blocking middleware
export function withIPBlocking(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = securityManager.getClientIP(req)

    if (securityManager.isIPBlocked(ip)) {
      securityManager.logSecurityEvent("unauthorized_access", req, { reason: "IP blocked" })
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return handler(req)
  }
}

// Input validation middleware
export function withInputValidation(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Check request size (10MB limit)
      const contentLength = req.headers.get("content-length")
      if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Request too large" }, { status: 413 })
      }

      // Validate JSON requests
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.text()

        // Check for potential injection attempts
        if (securityManager.detectSQLInjection(body)) {
          securityManager.logSecurityEvent("sql_injection_attempt", req, { body: body.substring(0, 200) })
          return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        if (securityManager.detectXSS(body)) {
          securityManager.logSecurityEvent("xss_attempt", req, { body: body.substring(0, 200) })
          return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // Recreate request with validated body
        const newReq = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: body,
        })

        return handler(newReq)
      }

      return handler(req)
    } catch (error) {
      console.error("[v0] Input validation error:", error)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }
  }
}

// CORS middleware
export function withCORS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin":
            process.env.NODE_ENV === "production" ? process.env.ALLOWED_ORIGINS || "https://yourdomain.com" : "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    const response = await handler(req)

    // Add CORS headers to response
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.NODE_ENV === "production" ? process.env.ALLOWED_ORIGINS || "https://yourdomain.com" : "*",
    )

    return response
  }
}

// Combined security middleware
export function withFullSecurity(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withSecurityHeaders(withCORS(withIPBlocking(withInputValidation(handler))))
}
