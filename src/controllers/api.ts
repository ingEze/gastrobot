import { getRecipeIdService, searchRecipeService } from '../services/api'
import { SearchRecipe } from '../types'

export const getAllRecipes: SearchRecipe = async (query, extraIngredients, number) => {
  try {
    if (query === undefined || number === undefined) {
      return {
        success: false,
        message: 'Please provide a query and a number'
      }
    }

    const response = await searchRecipeService(query, extraIngredients, number)

    if (response === false) {
      return {
        success: false,
        message: 'Invalid response from API'
      }
    }

    const recipesMap = response.recipes.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      ingredients: extraIngredients
    }))

    if (recipesMap.length === 0) {
      return {
        success: false,
        message: 'No recipes found'
      }
    }

    return {
      success: true,
      recipes: recipesMap
    }
  } catch (err) {
    console.error('Error in getAllRecipes:', err)
    return {
      success: false,
      message: 'An error ocurred while fetching recipes'
    }
  }
}

export const getRecipeId = async (id: number): Promise<any> => {
  try {
    const result = await getRecipeIdService(id)

    if (result === false) {
      console.error('Error: No se pudo obtener la receta.')
      return
    }

    return result
  } catch (err) {
    console.error('Error in getRecipeId:', err)
  }
}
