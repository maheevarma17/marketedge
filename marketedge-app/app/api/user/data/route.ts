import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserData from '@/lib/models/UserData'
import { getUserFromRequest } from '@/lib/auth'
import { userDataSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

// GET: Load user's saved data
export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit
        const rateCheck = checkRateLimit(`data:${auth.userId}`, RATE_LIMITS.userData)
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
            )
        }

        await connectDB()
        const data = await UserData.findOne({ userId: auth.userId })
        if (!data) {
            return NextResponse.json({
                trades: [], alerts: [], journalEntries: [],
                watchlist: [], paperPortfolio: { balance: 1000000, trades: [] },
            })
        }

        return NextResponse.json({
            trades: data.trades,
            alerts: data.alerts,
            journalEntries: data.journalEntries,
            watchlist: data.watchlist,
            paperPortfolio: data.paperPortfolio,
        })
    } catch (err) {
        console.error('Load data error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST: Save/sync user's data
export async function POST(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit
        const rateCheck = checkRateLimit(`data:${auth.userId}`, RATE_LIMITS.userData)
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
            )
        }

        // Validate input
        const body = await req.json()
        const validation = validateBody(userDataSchema, body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const validData = validation.data

        await connectDB()

        await UserData.findOneAndUpdate(
            { userId: auth.userId },
            {
                $set: {
                    ...(validData.trades !== undefined && { trades: validData.trades }),
                    ...(validData.alerts !== undefined && { alerts: validData.alerts }),
                    ...(validData.journalEntries !== undefined && { journalEntries: validData.journalEntries }),
                    ...(validData.watchlist !== undefined && { watchlist: validData.watchlist }),
                    ...(validData.paperPortfolio !== undefined && { paperPortfolio: validData.paperPortfolio }),
                    updatedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        )

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Save data error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
