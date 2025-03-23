import { AddRecipeFavorite } from '../types'
import RecipeFavoriteModel from '../models/recipeFavorites'

export const addFavorite: AddRecipeFavorite = async (recipeId, userId) => {
  console.log('recipeId', recipeId)
  console.log('userId', userId)
  try {
    const existingFavorite = await RecipeFavoriteModel.findOne({ userId, recipeId })
    if (existingFavorite != null) {
      return {
        success: false,
        message: 'This recipe already in your favorites'
      }
    }

    const newRecipe = new RecipeFavoriteModel({ userId, recipeId })
    await newRecipe.save()

    return {
      success: true,
      message: 'Recipe added in your favorites.'
    }
  } catch (err) {
    console.error('Error in DB service:', err)
    throw err
  }
}
