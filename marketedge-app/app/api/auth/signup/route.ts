import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserData from '@/lib/models/UserData'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        await connectDB()

        // Check if user exists
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 12)
        const user = await User.create({ name, email: email.toLowerCase(), passwordHash })

        // Create empty user data document
        await UserData.create({ userId: user._id })

        // Sign JWT
        const token = signToken({ userId: user._id.toString(), email: user.email })

        return NextResponse.json({
            token,
            name: user.name,
            email: user.email,
        })
    } catch (err) {
        console.error('Signup error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
