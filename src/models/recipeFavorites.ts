import mongoose from 'mongoose'
import { IRecipeFavorite } from '../types'

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
    required: true,
    unique: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

RecipeFavorite.index({ telegramId: 1, RecipeId: 1 }, { unique: true })

const RecipeFavoriteModel: mongoose.Model<IRecipeFavorite> = mongoose.model<IRecipeFavorite>(
  'RecipeFavorite',
  RecipeFavorite
)

export default RecipeFavoriteModel
