// ──────────────────────────────────────────────
// In-Memory Sliding Window Rate Limiter
// ──────────────────────────────────────────────
// No Redis required — works on serverless (Vercel)
// Entries auto-expire to prevent memory leaks

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean expired entries every 60 seconds
if (typeof globalThis !== 'undefined') {
    const CLEANUP_INTERVAL = 60_000
    let cleanupTimer: ReturnType<typeof setInterval> | null = null

    if (!cleanupTimer) {
        cleanupTimer = setInterval(() => {
            const now = Date.now()
            for (const [key, entry] of store) {
                if (now > entry.resetAt) store.delete(key)
            }
        }, CLEANUP_INTERVAL)
        // Don't prevent process exit
        if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
            cleanupTimer.unref()
        }
    }
}

interface RateLimitConfig {
    /** Max requests allowed in the window */
    maxRequests: number
    /** Window duration in seconds */
    windowSeconds: number
}

interface RateLimitResult {
    success: boolean
    remaining: number
    resetAt: number
    retryAfterSeconds: number
}

/**
 * Check rate limit for a given key (typically IP or userId)
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000
    const entry = store.get(key)

    // No existing entry or window expired — allow
    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetAt: now + windowMs,
            retryAfterSeconds: 0,
        }
    }

    // Within window — check count
    if (entry.count < config.maxRequests) {
        entry.count++
        return {
            success: true,
            remaining: config.maxRequests - entry.count,
            resetAt: entry.resetAt,
            retryAfterSeconds: 0,
        }
    }

    // Rate limited
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterSeconds,
    }
}

/**
 * Extract client IP from Next.js request
 */
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    const real = req.headers.get('x-real-ip')
    if (real) return real
    return '127.0.0.1'
}

// ─── Pre-configured rate limiters ───

export const RATE_LIMITS = {
    login: { maxRequests: 5, windowSeconds: 60 },      // 5 per minute
    signup: { maxRequests: 3, windowSeconds: 60 },      // 3 per minute
    ai: { maxRequests: 10, windowSeconds: 60 },         // 10 per minute
    userData: { maxRequests: 30, windowSeconds: 60 },   // 30 per minute
    marketData: { maxRequests: 60, windowSeconds: 60 }, // 60 per minute
} as const
