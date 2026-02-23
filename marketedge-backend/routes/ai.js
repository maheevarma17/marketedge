const express = require('express')
const router = express.Router()

router.post('/analyze', async (req, res) => {
  const { message } = req.body

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are MarketEdge AI, an expert Indian stock market analyst. Give BUY/SELL/HOLD recommendations with price targets and stop losses. Use Rs symbol. Reference NSE/BSE. Market hours: 9:15AM-3:30PM IST. Always add a risk disclaimer at the end.'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    })

    const data = await response.json()
    console.log('Groq response:', JSON.stringify(data))

    if (data.error) {
      return res.status(500).json({ error: data.error.message })
    }

    res.json({ reply: data.choices[0].message.content })
  } catch (err) {
    console.log('Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
