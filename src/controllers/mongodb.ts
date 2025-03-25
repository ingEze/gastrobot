import { addFavorite, getFavoriteRecipe } from '../services/mongodb'
import { GetRecipeFunction, RecipeFavoriteFunction } from '../types'

export const handleAddFavorite: RecipeFavoriteFunction = async (recipeId, telegramId) => {
  return await addFavorite(recipeId, telegramId)
}

export const handleGetFavorite: GetRecipeFunction = async (telegramId, userUniqueIdentifier) => {
  return await getFavoriteRecipe(telegramId, userUniqueIdentifier)
}
