// ──────────────────────────────────────────────
// JWT Auth Helpers
// ──────────────────────────────────────────────
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'marketedge-default-secret-change-in-production'

export interface JWTPayload {
    userId: string
    email: string
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch {
        return null
    }
}

export function getUserIdFromHeader(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    return payload?.userId || null
}
