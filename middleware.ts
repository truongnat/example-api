import { type NextRequest, NextResponse } from "next/server"
import { withFullSecurity } from "./lib/security-middleware"

export function middleware(request: NextRequest) {
  // Apply security middleware to all API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return withFullSecurity(async (req: NextRequest) => {
      return NextResponse.next()
    })(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
