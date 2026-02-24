import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        await connectDB()

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        const token = signToken({ userId: user._id.toString(), email: user.email })

        return NextResponse.json({
            token,
            name: user.name,
            email: user.email,
        })
    } catch (err) {
        console.error('Login error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
