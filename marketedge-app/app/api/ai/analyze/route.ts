import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { aiAnalyzeSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
    try {
        // Require authentication
        const auth = getUserFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Please log in to use AI Assistant' }, { status: 401 })
        }

        // Rate limit per user
        const rateCheck = checkRateLimit(`ai:${auth.userId}`, RATE_LIMITS.ai)
        if (!rateCheck.success) {
            return NextResponse.json(
                { error: `AI rate limit reached. Try again in ${rateCheck.retryAfterSeconds}s` },
                { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
            )
        }

        // Validate & sanitize input
        const body = await req.json()
        const validation = validateBody(aiAnalyzeSchema, body)
        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        const { message } = validation.data

        // Use Groq API
        const GROQ_API_KEY = process.env.GROQ_API_KEY
        if (!GROQ_API_KEY) {
            return NextResponse.json({
                reply: 'AI is not configured. Please add GROQ_API_KEY to your .env.local file.\n\nGet a free key at: https://console.groq.com'
            })
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 1500,
                messages: [
                    {
                        role: 'system',
                        content: `You are MarketEdge AI, an expert Indian stock market analyst. 
Your job is to provide stock analysis, BUY/SELL/HOLD recommendations, and market insights.
Rules:
- Always use ₹ symbol for prices
- Reference NSE/BSE exchanges
- Indian market hours: 9:15 AM – 3:30 PM IST
- Give clear price targets and stop losses
- Include technical and fundamental reasoning
- Always add a risk disclaimer at the end
- Format your response with clear sections using markdown-style formatting
- Be concise but thorough`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ]
            })
        })

        const data = await response.json()

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 500 })
        }

        return NextResponse.json({ reply: data.choices[0].message.content })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'AI request failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
