import { searchRecipeService } from '../services/service.api'

const getAllRecipes = async (query: string, number: number): Promise<any> => {
  try {
    if (query === undefined || number === undefined) {
      return {
        success: false,
        message: 'Please provide a query and a number'
      }
    }

    const extraIngredients: string[] = []
    const response = await searchRecipeService(query, extraIngredients, number)
    console.log('response', response)

    if (response === false) {
      return {
        success: false,
        message: 'Invalid response from API'
      }
    }

    const recipesMap = response.map((recipe: any) => ({
      title: recipe.title,
      image: recipe.image
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

export default getAllRecipes
