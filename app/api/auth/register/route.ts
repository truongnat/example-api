import { type NextRequest, NextResponse } from "next/server"
import { db, type User } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withRateLimit, authLimiter } from "@/lib/middleware"

async function registerHandler(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create user
    const hashedPassword = await AuthUtils.hashPassword(password)
    const verificationToken = AuthUtils.generateRandomToken()

    const user: User = {
      id: AuthUtils.generateId(),
      email,
      password: hashedPassword,
      name,
      isVerified: false,
      verificationToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    db.createUser(user)

    // In a real app, you would send verification email here
    console.log(`[v0] Verification token for ${email}: ${verificationToken}`)

    return NextResponse.json(
      {
        message: "User registered successfully. Please verify your email to continue.",
        userId: user.id,
        verificationToken, // Include verification token in response
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withRateLimit(authLimiter)(registerHandler)
