import mongoose from 'mongoose'
import { IRecipeFavorite, IRecipeFavoriteStatic } from '../types'
import { randomUUID } from 'node:crypto'

const RecipeFavorite = new mongoose.Schema<IRecipeFavorite>({
  recipeId: {
    type: Number,
    required: true
  },
  telegramId: {
    type: Number,
    required: true
  },
  userUniqueIdentifier: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

RecipeFavorite.index({ telegramId: 1, RecipeId: 1 }, { unique: true })

RecipeFavorite.statics.generateUniqueIdentifier = async function (telegramId: number): Promise<string> {
  const existingIdentifier = await this.findOne({ telegramId })
  if (existingIdentifier !== null) return existingIdentifier.userUniqueIdentifier

  const newIdentifier = randomUUID()

  await this.create({ telegramId, userUniqueIdentifier: newIdentifier })

  return newIdentifier
}

const RecipeFavoriteModel = mongoose.model<IRecipeFavorite, IRecipeFavoriteStatic>(
  'RecipeFavorite',
  RecipeFavorite
)

export default RecipeFavoriteModel
