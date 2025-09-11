import { type NextRequest, NextResponse } from "next/server"
import { db, type RefreshToken } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withRateLimit, authLimiter } from "@/lib/middleware"

async function loginHandler(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = db.getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await AuthUtils.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is verified
    if (!user.isVerified) {
      return NextResponse.json({ error: "Please verify your email before logging in" }, { status: 403 })
    }

    // Generate tokens
    const payload = { userId: user.id, email: user.email }
    const accessToken = AuthUtils.generateAccessToken(payload)
    const refreshToken = AuthUtils.generateRefreshToken(payload)

    // Store refresh token
    const refreshTokenRecord: RefreshToken = {
      id: AuthUtils.generateId(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    }
    db.createRefreshToken(refreshTokenRecord)

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(authLimiter)(loginHandler)
