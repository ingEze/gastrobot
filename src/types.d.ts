import TelegramBot, { Message } from 'node-telegram-bot-api'
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
  recipeId: number
  userId: number
  addedAt: Date
}

export interface RecipeDetails {
  id: number
  title: string
  summary?: string
  instructions?: string
  readyInMinutes?: number
  servings?: number
  spoonacularScore?: number
  image?: string
}

export type AddRecipeFavorite = (recipeId: number, telegramId: number) => Promise<newRecipe>

export type HandleFavoriteRecipe = (callbackQuery: TelegramBot.CallbackQuery, chatId: number, data: string) => Promise<void>

export type HandleShowRecipe = (callbackQuery: TelegramBot.CallbackQuery, chatId: number, recipeId: number) => Promise<void>
