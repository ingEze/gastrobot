import { Message } from 'node-telegram-bot-api'

export interface Command {
  description: string
  action: (msg: Message) => Promise<void>
}

export type SearchRecipe = (recipeName: string, extraIngredients: string[], number: number) => responseData

export interface UserState {
  step?: string
  recipe?: string
  ingredients?: string[]
}
