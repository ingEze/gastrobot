import { Message } from 'node-telegram-bot-api'

export interface Command {
  description: string
  action: (msg: Message) => Promise<void>
}

export type SearchRecipe = (query: string, number: number) => Promise<result>
