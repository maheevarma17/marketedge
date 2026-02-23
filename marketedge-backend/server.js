const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'MarketEdge Backend is running!' })
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/ai',   require('./routes/ai'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))

