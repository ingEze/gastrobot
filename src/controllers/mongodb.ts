import { addFavorite } from '../services/mongodb'
import { AddRecipeFavorite } from '../types'

export const handleAddFavorite: AddRecipeFavorite = async (userId, recipeId) => {
  console.log('userId controller', userId)
  console.log('recipeId controller', recipeId)
  return await addFavorite(userId, recipeId)
}
