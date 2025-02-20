import mongoose from 'mongoose'

import { config } from './config.js'

class Database {
  private static instance: Database | null = null
  private connection: Promise<typeof mongoose> | null = null

  private constructor () {}

  async connect (): Promise<typeof mongoose> {
    if (this.connection !== null) {
      return await this.connection
    }

    this.connection = mongoose.connect(config.MONGO_URI ?? '')

    try {
      const db = await this.connection
      console.log('Database connected successfully')
      return db
    } catch (err) {
      console.error('Database connection failed', err)
      this.connection = null
      throw err
    }
  }

  static getInstance (): Database {
    if (this.instance === null) {
      this.instance = new Database()
    }

    return this.instance
  }
}

export default Database
