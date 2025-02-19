import { Message } from 'node-telegram-bot-api'

export interface Command {
  command: string
  description: string
  action: (msg: Message) => Promise<void>
  emoji: string
}

export type SearchRecipe = (recipeName: string, extraIngredients: string[], number: number) => responseData

export interface UserState {
  step?: string
  recipe?: string
  ingredients?: string[]
}
