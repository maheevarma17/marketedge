// ──────────────────────────────────────────────
// Input Validation Schemas (Zod v4)
// ──────────────────────────────────────────────
import { z } from 'zod'

// ─── Password Rules ───
// At least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(v => /[A-Z]/.test(v), 'Password must contain at least one uppercase letter')
    .refine(v => /[a-z]/.test(v), 'Password must contain at least one lowercase letter')
    .refine(v => /[0-9]/.test(v), 'Password must contain at least one number')

// ─── Auth Schemas ───

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .max(255, 'Email too long')
        .transform(v => v.toLowerCase().trim()),
    password: z
        .string()
        .min(1, 'Password is required')
        .max(128, 'Password too long'),
})

export const signupSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long')
        .transform(v => v.trim()),
    email: z
        .string()
        .email('Invalid email format')
        .max(255, 'Email too long')
        .transform(v => v.toLowerCase().trim()),
    password: passwordSchema,
})

// ─── User Data Schema ───

export const userDataSchema = z.object({
    trades: z.array(z.record(z.string(), z.unknown())).optional(),
    alerts: z.array(z.record(z.string(), z.unknown())).optional(),
    journalEntries: z.array(z.record(z.string(), z.unknown())).optional(),
    watchlist: z.array(z.string().max(50)).max(200).optional(),
    paperPortfolio: z.object({
        balance: z.number().min(0).max(100_000_000),
        trades: z.array(z.record(z.string(), z.unknown())),
    }).optional(),
})

// ─── AI Analyze Schema ───

export const aiAnalyzeSchema = z.object({
    message: z
        .string()
        .min(1, 'Message is required')
        .max(2000, 'Message too long (max 2000 chars)')
        .transform(v => sanitizeInput(v)),
})

// ─── Delete Account Schema ───

export const deleteAccountSchema = z.object({
    password: z.string().min(1, 'Password confirmation required'),
    confirmText: z.literal('DELETE MY ACCOUNT', 'Please type "DELETE MY ACCOUNT" to confirm'),
})

// ─── Helpers ───

/**
 * Strip potentially dangerous HTML/script content from user input
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
}

/**
 * Validate request body against a Zod schema.
 * Returns { success: true, data } or { success: false, error }
 */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown):
    | { success: true; data: T }
    | { success: false; error: string } {
    const result = schema.safeParse(body)
    if (result.success) {
        return { success: true, data: result.data }
    }
    const issues = result.error.issues
    const firstIssue = issues?.[0]
    return {
        success: false,
        error: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid input',
    }
}

/**
 * Password strength score (0-4) for UI indicator
 */
export function getPasswordStrength(password: string): {
    score: number
    label: string
    color: string
} {
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const levels = [
        { label: 'Very Weak', color: '#ef4444' },
        { label: 'Weak', color: '#f97316' },
        { label: 'Fair', color: '#eab308' },
        { label: 'Strong', color: '#22c55e' },
        { label: 'Very Strong', color: '#10b981' },
    ]

    const capped = Math.min(score, 4)
    return { score: capped, ...levels[capped] }
}
