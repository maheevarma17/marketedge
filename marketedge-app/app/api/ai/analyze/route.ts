import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { message } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Use Groq API (free) — same as the user's existing backend
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
