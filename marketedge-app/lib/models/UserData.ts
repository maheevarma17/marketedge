// ──────────────────────────────────────────────
// UserData Model — stores all user-specific data
// ──────────────────────────────────────────────
import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserData extends Document {
    userId: mongoose.Types.ObjectId
    trades: object[]
    alerts: object[]
    journalEntries: object[]
    watchlist: string[]
    paperPortfolio: object
    updatedAt: Date
}

const UserDataSchema = new Schema<IUserData>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    trades: { type: [Schema.Types.Mixed], default: [] },
    alerts: { type: [Schema.Types.Mixed], default: [] },
    journalEntries: { type: [Schema.Types.Mixed], default: [] },
    watchlist: { type: [String], default: [] },
    paperPortfolio: { type: Schema.Types.Mixed, default: { balance: 1000000, trades: [] } },
    updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.UserData || mongoose.model<IUserData>('UserData', UserDataSchema)
