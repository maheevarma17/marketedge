import { NextRequest, NextResponse } from 'next/server'
import { getRefreshTokenPayload, setAuthCookies } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const payload = getRefreshTokenPayload(req)
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 })
        }

        // Issue new access + refresh tokens
        const response = NextResponse.json({ success: true })
        return setAuthCookies(response, {
            userId: payload.userId,
            email: payload.email,
        })
    } catch (err) {
        console.error('Token refresh error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
