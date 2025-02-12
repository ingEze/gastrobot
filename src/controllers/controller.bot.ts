import searchRecipeService from '../services/service.api.js'

const getAllRecipes = async (query: string, number: number): Promise<any> => {
  try {
    if (query === null || number === null) {
      return {
        success: false,
        message: 'Please provide a query and a number'
      }
    }

    console.log('query', query)
    console.log('number', number)

    const response = await searchRecipeService(query, number)
    const { result } = response

    const recipesMap = result.results.map((recipe: any) => ({
      title: recipe.title,
      image: recipe.image
    }))
    console.log('recipesMap', recipesMap)

    const recipes = {
      recipes: recipesMap
    }

    if (recipes.recipes.length === 0) {
      return {
        message: 'No recipes found'
      }
    }

    return recipes
  } catch (err) {
    console.error(err)
  }
}

export default getAllRecipes
