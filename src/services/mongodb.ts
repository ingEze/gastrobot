import { MongooseError } from 'mongoose'
import { GetRecipeFunction, RecipeFavoriteFunction } from '../types'
import RecipeFavoriteModel from '../models/recipeFavorites'
import { getRecipeId } from '../controllers/api'

export const addFavorite: RecipeFavoriteFunction = async (recipeId, telegramId) => {
  if (recipeId === undefined || recipeId === null || telegramId === undefined || telegramId === null) {
    return {
      success: false,
      message: 'RecipeId y TelegramId son obligatorios'
    }
  }

  try {
    const userUniqueIdentifier = await RecipeFavoriteModel.generateUniqueIdentifier(telegramId)

    const existingFavorite = await RecipeFavoriteModel.findOne({
      recipeId,
      telegramId
    })

    if (existingFavorite != null) {
      return {
        success: false,
        message: 'La receta ya se encuentra agregada a favoritos.'
      }
    }

    const newRecipe = new RecipeFavoriteModel({
      recipeId,
      telegramId,
      userUniqueIdentifier,
      addedAt: new Date()
    })

    await newRecipe.save()

    return {
      success: true,
      message: 'Receta agregada a favoritos.'
    }
  } catch (error) {
    if (error instanceof MongooseError && 'code' in error && error.code === 11000) {
      return {
        success: false,
        message: 'La receta ya está en tus favoritos'
      }
    }
    console.error('Error en el servicio de base de datos:', error instanceof Error ? error.message : error)
    throw error
  }
}

export const getFavoriteRecipe: GetRecipeFunction = async (telegramId) => {
  try {
    const favoriteRecipes = await RecipeFavoriteModel.find({ telegramId })
    if (favoriteRecipes.length === 0) {
      return 'No tienes recetas favoritas aún 📖'
    }

    const recipeList = await Promise.all(favoriteRecipes.map(async (recipe) => {
      const recipeDetails = await getRecipeId(recipe.recipeId)
      const recipeId = recipeDetails.id
      const title: string = recipeDetails?.title ?? 'No recipe title'
      const favoriteAdded = recipe.addedAt.toLocaleDateString()
      return {
        recipeId,
        title,
        favoriteAdded
      }
    }))

    return recipeList
  } catch (err) {
    const error = err as Error
    console.error('Error al mostrar receta de favoritos:', error.message)
    throw err
  }
}
