import mongoose from 'mongoose'

import { config } from './config.js'

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI ?? '')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('Error connecting to MongoDB: ', err)
    process.exit(1)
  }
}

export default connectDB
