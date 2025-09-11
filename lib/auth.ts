import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key"

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export class AuthUtils {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Generate access token (15 minutes)
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" })
  }

  // Generate refresh token (7 days)
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" })
  }

  // Verify access token
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  // Generate random token for email verification/password reset
  static generateRandomToken(): string {
    return randomBytes(32).toString("hex")
  }

  // Generate unique ID
  static generateId(): string {
    return randomBytes(16).toString("hex")
  }
}
