import mongoose from 'mongoose'
import { IRecipeFavorite } from '../types'

const RecipeFavorite = new mongoose.Schema<IRecipeFavorite>({
  query: {
    type: String,
    require: true
  },
  url: {
    type: String,
    require: true
  },
  recipeType: {
    type: String,
    require: true
  }
})

const RecipeFavoriteModel: mongoose.Model<IRecipeFavorite> = mongoose.model<IRecipeFavorite>(
  'RecipeFavorite',
  RecipeFavorite
)

export default RecipeFavoriteModel
