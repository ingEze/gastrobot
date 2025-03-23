import mongoose from 'mongoose'
import { IRecipeFavorite } from '../types'

const RecipeFavorite = new mongoose.Schema<IRecipeFavorite>({
  recipeId: {
    type: Number,
    require: true
  },
  userId: {
    type: Number,
    require: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
})

const RecipeFavoriteModel: mongoose.Model<IRecipeFavorite> = mongoose.model<IRecipeFavorite>(
  'RecipeFavorite',
  RecipeFavorite
)

export default RecipeFavoriteModel
