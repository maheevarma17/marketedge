import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { setAuthCookies } from '@/lib/auth'
import { loginSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIP(req)
        const rateCheck = checkRateLimit(`login:${ip}`, RATE_LIMITS.login)
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateCheck.retryAfterSeconds}s` },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
            )
        }

        // Validate input
        const body = await req.json()
        const validation = validateBody(loginSchema, body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const { email, password } = validation.data

        await connectDB()

        const user = await User.findOne({ email })
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        // Set secure HTTP-only cookies
        const payload = { userId: user._id.toString(), email: user.email }
        const response = NextResponse.json({
            name: user.name,
            email: user.email,
        })

        return setAuthCookies(response, payload)
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
