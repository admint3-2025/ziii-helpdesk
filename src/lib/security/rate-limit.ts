/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

type RateLimitStore = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitStore>()

// Clean up expired entries - lazy initialization to avoid issues in serverless
let cleanupIntervalId: NodeJS.Timeout | null = null

function initCleanup() {
  if (cleanupIntervalId === null) {
    cleanupIntervalId = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of store.entries()) {
        if (value.resetAt < now) {
          store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }
}

export type RateLimitConfig = {
  maxRequests: number
  windowMs: number
}

export function rateLimit(identifier: string, config: RateLimitConfig): boolean {
  // Initialize cleanup on first use
  initCleanup()
  
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    store.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return true
  }

  if (entry.count >= config.maxRequests) {
    return false
  }

  entry.count++
  return true
}

export function getRateLimitStatus(identifier: string, config: RateLimitConfig) {
  const entry = store.get(identifier)
  const now = Date.now()

  if (!entry || entry.resetAt < now) {
    return {
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip = cfConnectingIp || realIp || forwarded?.split(',')[0]?.trim() || 'unknown'
  
  return ip
}
