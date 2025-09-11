// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs
    }
    return entry.resetTime
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

export { RateLimiter }

// Keep existing exports for backward compatibility
export const generalLimiter = new RateLimiter(15 * 60 * 1000, 100) // 100 requests per 15 minutes
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5) // 5 auth attempts per 15 minutes
export const chatLimiter = new RateLimiter(60 * 1000, 30) // 30 messages per minute
