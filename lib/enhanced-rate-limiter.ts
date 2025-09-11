// Enhanced rate limiter with different strategies
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
  requests: Array<{ timestamp: number; success: boolean }>
}

export class EnhancedRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  isAllowed(identifier: string, isSuccess = true): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
        requests: [{ timestamp: now, success: isSuccess }],
      })
      return true
    }

    // Check if we should skip this request type
    if (this.config.skipSuccessfulRequests && isSuccess) {
      return true
    }
    if (this.config.skipFailedRequests && !isSuccess) {
      return true
    }

    if (entry.count >= this.config.maxRequests) {
      return false
    }

    entry.count++
    entry.requests.push({ timestamp: now, success: isSuccess })
    return true
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests
    }
    return Math.max(0, this.config.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.config.windowMs
    }
    return entry.resetTime
  }

  // Get request pattern analysis
  getRequestPattern(identifier: string): {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    requestsPerMinute: number
  } {
    const entry = this.limits.get(identifier)
    if (!entry) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        requestsPerMinute: 0,
      }
    }

    const now = Date.now()
    const recentRequests = entry.requests.filter((req) => now - req.timestamp < this.config.windowMs)

    const successful = recentRequests.filter((req) => req.success).length
    const failed = recentRequests.filter((req) => !req.success).length
    const requestsPerMinute = recentRequests.length / (this.config.windowMs / 60000)

    return {
      totalRequests: recentRequests.length,
      successfulRequests: successful,
      failedRequests: failed,
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
    }
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

// Specialized rate limiters
export const strictAuthLimiter = new EnhancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3, // Only 3 failed auth attempts
  skipSuccessfulRequests: true, // Don't count successful logins
})

export const apiLimiter = new EnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
})

export const uploadLimiter = new EnhancedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
})

export const chatLimiter = new EnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 messages per minute
})
