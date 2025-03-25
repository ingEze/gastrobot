import { GetRecipeFunction, RecipeFavoriteFunction } from '../types'
import RecipeFavoriteModel from '../models/recipeFavorites'

export const addFavorite: RecipeFavoriteFunction = async (recipeId, telegramId, userUniqueIdentifier) => {
  try {
    const existingFavorite = await RecipeFavoriteModel.findOne({
      recipeId,
      telegramId,
      userUniqueIdentifier
    })

    if ((existingFavorite != null)) {
      console.log('Favorito existente encontrado:', existingFavorite)
      return {
        success: false,
        message: 'This recipe already in your favorites'
      }
    }

    const newRecipe = new RecipeFavoriteModel({
      recipeId,
      telegramId,
      userUniqueIdentifier
    })

    await newRecipe.save()

    return {
      success: true,
      message: 'Recipe added in your favorites.'
    }
  } catch (err) {
    const error = err as Error
    console.error('Error in DB service:', error.message)
    throw err
  }
}

export const getFavoriteRecipe: GetRecipeFunction = async (telegramId, userUniqueIdentifier) => {
  try {
    const favoriteRecipes = await RecipeFavoriteModel.find({
      telegramId,
      userUniqueIdentifier
    })

    if (favoriteRecipes.length === 0) return 'No tienes recetas favoritas aún 📖'

    const recipeList = favoriteRecipes.map(recipe =>
      `🍽 Receta ${recipe.recipeId} (Añadida el: ${recipe.addedAt.toLocaleDateString()})`
    ).join('\n')

    return recipeList
  } catch (err) {
    const error = err as Error
    console.error('Error al mostrar receta de favoritos:', error.message)
    throw err
  }
}
