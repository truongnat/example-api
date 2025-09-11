import type { NextRequest } from "next/server"

// Security event types
export type SecurityEventType =
  | "failed_login"
  | "suspicious_activity"
  | "rate_limit_exceeded"
  | "invalid_token"
  | "unauthorized_access"
  | "file_upload_blocked"
  | "sql_injection_attempt"
  | "xss_attempt"

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  ip: string
  userAgent: string
  userId?: string
  details: any
  timestamp: Date
}

export interface BlockedIP {
  ip: string
  reason: string
  blockedAt: Date
  expiresAt: Date
  attempts: number
}

class SecurityManager {
  private securityEvents: Map<string, SecurityEvent> = new Map()
  private blockedIPs: Map<string, BlockedIP> = new Map()
  private suspiciousIPs: Map<string, { attempts: number; lastAttempt: Date }> = new Map()

  // Log security events
  logSecurityEvent(type: SecurityEventType, req: NextRequest, details: any = {}, userId?: string) {
    const event: SecurityEvent = {
      id: this.generateId(),
      type,
      ip: this.getClientIP(req),
      userAgent: req.headers.get("user-agent") || "unknown",
      userId,
      details,
      timestamp: new Date(),
    }

    this.securityEvents.set(event.id, event)
    console.log(`[v0] Security Event: ${type} from ${event.ip}`, details)

    // Auto-block for certain events
    this.handleSecurityEvent(event)
  }

  // Handle security events and auto-blocking
  private handleSecurityEvent(event: SecurityEvent) {
    const ip = event.ip

    switch (event.type) {
      case "failed_login":
      case "invalid_token":
      case "unauthorized_access":
        this.trackSuspiciousActivity(ip)
        break

      case "sql_injection_attempt":
      case "xss_attempt":
        // Immediate block for injection attempts
        this.blockIP(ip, `${event.type} detected`, 24 * 60 * 60 * 1000) // 24 hours
        break
    }
  }

  // Track suspicious activity
  private trackSuspiciousActivity(ip: string) {
    const now = new Date()
    const suspicious = this.suspiciousIPs.get(ip) || { attempts: 0, lastAttempt: now }

    // Reset counter if last attempt was more than 1 hour ago
    if (now.getTime() - suspicious.lastAttempt.getTime() > 60 * 60 * 1000) {
      suspicious.attempts = 0
    }

    suspicious.attempts++
    suspicious.lastAttempt = now
    this.suspiciousIPs.set(ip, suspicious)

    // Block after 5 suspicious attempts
    if (suspicious.attempts >= 5) {
      this.blockIP(ip, "Multiple suspicious attempts", 60 * 60 * 1000) // 1 hour
    }
  }

  // Block IP address
  blockIP(ip: string, reason: string, durationMs: number) {
    const blockedIP: BlockedIP = {
      ip,
      reason,
      blockedAt: new Date(),
      expiresAt: new Date(Date.now() + durationMs),
      attempts: this.suspiciousIPs.get(ip)?.attempts || 0,
    }

    this.blockedIPs.set(ip, blockedIP)
    console.log(`[v0] IP ${ip} blocked: ${reason}`)
  }

  // Check if IP is blocked
  isIPBlocked(ip: string): boolean {
    const blocked = this.blockedIPs.get(ip)
    if (!blocked) return false

    // Check if block has expired
    if (blocked.expiresAt < new Date()) {
      this.blockedIPs.delete(ip)
      return false
    }

    return true
  }

  // Get client IP
  getClientIP(req: NextRequest): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || req.ip || "unknown"
  }

  // Validate and sanitize input
  sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim()
  }

  // Detect potential SQL injection
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    ]

    return sqlPatterns.some((pattern) => pattern.test(input))
  }

  // Detect XSS attempts
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
    ]

    return xssPatterns.some((pattern) => pattern.test(input))
  }

  // Generate unique ID
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Get security stats
  getSecurityStats() {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const recentEvents = Array.from(this.securityEvents.values()).filter((event) => event.timestamp >= last24h)

    const eventsByType = recentEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      blockedIPs: Array.from(this.blockedIPs.values()).filter((blocked) => blocked.expiresAt > now),
      suspiciousIPs: this.suspiciousIPs.size,
    }
  }

  // Cleanup expired blocks and old events
  cleanup() {
    const now = new Date()

    // Remove expired IP blocks
    for (const [ip, blocked] of this.blockedIPs.entries()) {
      if (blocked.expiresAt < now) {
        this.blockedIPs.delete(ip)
      }
    }

    // Remove old security events (keep last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    for (const [id, event] of this.securityEvents.entries()) {
      if (event.timestamp < weekAgo) {
        this.securityEvents.delete(id)
      }
    }

    // Reset suspicious IP counters older than 24 hours
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    for (const [ip, suspicious] of this.suspiciousIPs.entries()) {
      if (suspicious.lastAttempt < dayAgo) {
        this.suspiciousIPs.delete(ip)
      }
    }
  }
}

export const securityManager = new SecurityManager()

// Cleanup every hour
setInterval(
  () => {
    securityManager.cleanup()
  },
  60 * 60 * 1000,
)
