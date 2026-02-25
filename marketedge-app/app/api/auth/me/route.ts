import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const user = await User.findById(auth.userId).select('-passwordHash')
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        })
    } catch (err) {
        console.error('Auth me error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
