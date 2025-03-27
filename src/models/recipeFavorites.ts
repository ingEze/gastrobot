import mongoose from 'mongoose'
import { IRecipeFavorite, IRecipeFavoriteStatic } from '../types'
import { randomUUID } from 'node:crypto'

const RecipeFavorite = new mongoose.Schema<IRecipeFavorite>({
  recipeId: {
    type: Number,
    required: true,
    validate: {
      validator: function (v: number) {
        return v != null && v !== 0
      },
      message: 'RecipeId debe ser un número válido distinto de cero'
    }
  },
  telegramId: {
    type: Number,
    required: true,
    validate: {
      validator: function (v: number) {
        return v != null && v !== 0
      },
      message: 'TelegramId debe ser un número válido distinto de cero'
    }
  },
  userUniqueIdentifier: {
    type: String,
    required: true,
    default: () => randomUUID()
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  autoIndex: true,
  optimisticConcurrency: true
})

RecipeFavorite.index({ telegramId: 1, recipeId: 1 }, {
  unique: true,
  name: 'unique_telegram_recipe'
})

RecipeFavorite.statics.generateUniqueIdentifier = async function (telegramId: number): Promise<string> {
  const existingIdentifier = await this.findOne({ telegramId })
  if (existingIdentifier !== null) return existingIdentifier.userUniqueIdentifier

  return randomUUID()
}

const RecipeFavoriteModel = mongoose.model<IRecipeFavorite, IRecipeFavoriteStatic>(
  'RecipeFavorite',
  RecipeFavorite
)

export default RecipeFavoriteModel
