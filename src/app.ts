import express from 'express'
import dotenv from 'dotenv'

// import connectDB from './config/db.js'
// import apiRouter from './routes/route.api.js'

import './telegramBot.js'

dotenv.config()

const app = express()
app.use(express.json())

// connectDB().catch(console.error)

// app.use('/api', apiRouter)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
