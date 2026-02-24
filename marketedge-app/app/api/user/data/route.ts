import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserData from '@/lib/models/UserData'
import { getUserIdFromHeader } from '@/lib/auth'

// GET: Load user's saved data
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromHeader(req.headers.get('authorization'))
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const data = await UserData.findOne({ userId })
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
        const userId = getUserIdFromHeader(req.headers.get('authorization'))
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        await connectDB()

        await UserData.findOneAndUpdate(
            { userId },
            {
                $set: {
                    ...(body.trades !== undefined && { trades: body.trades }),
                    ...(body.alerts !== undefined && { alerts: body.alerts }),
                    ...(body.journalEntries !== undefined && { journalEntries: body.journalEntries }),
                    ...(body.watchlist !== undefined && { watchlist: body.watchlist }),
                    ...(body.paperPortfolio !== undefined && { paperPortfolio: body.paperPortfolio }),
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
