import { Message } from 'node-telegram-bot-api'
import { Document } from 'mongoose'

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

export interface IRecipeFavorite extends Document {
  query: string
  url: string
  recipeType: string
}

export type AddRecipeFavorite = (query: string, url: string, recipeType: string) => Promise<void>
