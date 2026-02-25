import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserData from '@/lib/models/UserData'
import { setAuthCookies } from '@/lib/auth'
import { signupSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIP(req)
        const rateCheck = checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup)
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: `Too many signup attempts. Try again in ${rateCheck.retryAfterSeconds}s` },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
            )
        }

        // Validate input
        const body = await req.json()
        const validation = validateBody(signupSchema, body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const { name, email, password } = validation.data

        await connectDB()

        // Check if user exists
        const existing = await User.findOne({ email })
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        // Hash password (cost factor 12) and create user
        const passwordHash = await bcrypt.hash(password, 12)
        const user = await User.create({ name, email, passwordHash })

        // Create empty user data document
        await UserData.create({ userId: user._id })

        // Set secure HTTP-only cookies
        const payload = { userId: user._id.toString(), email: user.email }
        const response = NextResponse.json({
            name: user.name,
            email: user.email,
        })

        return setAuthCookies(response, payload)
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
