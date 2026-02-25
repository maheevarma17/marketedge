// ──────────────────────────────────────────────
// JWT Auth Helpers — Secure Cookie-Based
// ──────────────────────────────────────────────
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Config ───

function getSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret || secret === 'marketedge-default-secret-change-in-production') {
        throw new Error('JWT_SECRET must be set in environment variables. Never use default secrets in production.')
    }
    return secret
}

const ACCESS_TOKEN_EXPIRY = '15m'   // Short-lived
const REFRESH_TOKEN_EXPIRY = '7d'   // Longer-lived
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
}

// ─── Types ───

export interface JWTPayload {
    userId: string
    email: string
    type?: 'access' | 'refresh'
}

// ─── Token Generation ───

export function signAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign({ ...payload, type: 'access' }, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export function signRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign({ ...payload, type: 'refresh' }, getSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY })
}

// Legacy compatibility — still used by some routes during migration
export function signToken(payload: Omit<JWTPayload, 'type'>): string {
    return signAccessToken(payload)
}

// ─── Token Verification ───

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, getSecret()) as JWTPayload
    } catch {
        return null
    }
}

// ─── Cookie Helpers ───

/**
 * Set auth cookies on a NextResponse
 */
export function setAuthCookies(
    response: NextResponse,
    payload: Omit<JWTPayload, 'type'>
): NextResponse {
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    response.cookies.set('me_access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set('me_refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
}

/**
 * Clear auth cookies (logout)
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
    response.cookies.set('me_access_token', '', {
        ...COOKIE_OPTIONS,
        maxAge: 0,
    })
    response.cookies.set('me_refresh_token', '', {
        ...COOKIE_OPTIONS,
        maxAge: 0,
    })
    return response
}

/**
 * Get user ID from request cookies (preferred) or Authorization header (fallback)
 */
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
    // Try cookie first (secure)
    const cookieToken = req.cookies.get('me_access_token')?.value
    if (cookieToken) {
        const payload = verifyToken(cookieToken)
        if (payload && payload.type === 'access') return payload
    }

    // Fallback to Authorization header (backward compat)
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const payload = verifyToken(token)
        if (payload) return payload
    }

    return null
}

/**
 * Check refresh token from cookies
 */
export function getRefreshTokenPayload(req: NextRequest): JWTPayload | null {
    const refreshToken = req.cookies.get('me_refresh_token')?.value
    if (!refreshToken) return null

    const payload = verifyToken(refreshToken)
    if (payload && payload.type === 'refresh') return payload
    return null
}

// Legacy helper — backward compat
export function getUserIdFromHeader(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    return payload?.userId || null
}
