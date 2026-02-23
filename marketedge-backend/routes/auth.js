const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const router = express.Router()

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hash]
    )
    const token = jwt.sign({ userId: result.rows[0].id, name }, process.env.JWT_SECRET)
    res.json({ token, name })
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    const user = result.rows[0]
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const token = jwt.sign({ userId: user.id, name: user.name }, process.env.JWT_SECRET)
    res.json({ token, name: user.name })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

