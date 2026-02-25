import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserData from '@/lib/models/UserData'
import { getUserFromRequest, clearAuthCookies } from '@/lib/auth'
import { deleteAccountSchema, validateBody } from '@/lib/validations'

export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Validate input — requires password + "DELETE MY ACCOUNT" confirmation
        const body = await req.json()
        const validation = validateBody(deleteAccountSchema, body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const { password } = validation.data

        await connectDB()

        // Verify password
        const user = await User.findById(auth.userId)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 403 })
        }

        // Delete all user data first, then the user account
        await UserData.deleteMany({ userId: auth.userId })
        await User.findByIdAndDelete(auth.userId)

        // Clear cookies
        const response = NextResponse.json({
            success: true,
            message: 'Your account and all associated data have been permanently deleted.',
        })
        return clearAuthCookies(response)
    } catch (err) {
        console.error('Account deletion error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
