import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserData from '@/lib/models/UserData'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const user = await User.findById(auth.userId).select('-passwordHash')
        const userData = await UserData.findOne({ userId: auth.userId })

        const exportData = {
            exportDate: new Date().toISOString(),
            format: 'MarketEdge GDPR Data Export',
            account: user ? {
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            } : null,
            data: userData ? {
                trades: userData.trades,
                alerts: userData.alerts,
                journalEntries: userData.journalEntries,
                watchlist: userData.watchlist,
                paperPortfolio: userData.paperPortfolio,
                lastUpdated: userData.updatedAt,
            } : null,
        }

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="marketedge-data-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })
    } catch (err) {
        console.error('Data export error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
