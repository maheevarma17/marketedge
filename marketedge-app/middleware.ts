// ──────────────────────────────────────────────
// Next.js Middleware — Security Headers + Protection
// ──────────────────────────────────────────────
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers applied to every response
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Needed for Next.js
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://api.groq.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com",
        "frame-ancestors 'none'",
    ].join('; '),
}

export function middleware(request: NextRequest) {
    const response = NextResponse.next()

    // Apply security headers to all responses
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value)
    }

    // Remove server fingerprinting
    response.headers.delete('X-Powered-By')
    response.headers.delete('Server')

    return response
}

// Apply to all routes
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (browser icon)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
