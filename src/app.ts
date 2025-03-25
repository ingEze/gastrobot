import express from 'express'
import dotenv from 'dotenv'

import './telegramBot.js'
import Database from './config/db'

dotenv.config()

const app = express()
app.use(express.json())

// connect to MongoDB database
Database.getInstance().connect().catch(console.error)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
