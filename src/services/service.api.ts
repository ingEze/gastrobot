import axios from 'axios'
import { SearchRecipe } from '../types.js'

const API_KEY = process.env.API_KEY ?? ''

export const searchRecipeService: SearchRecipe = async (recipeName, extraIngredients, number) => {
  try {
    if (recipeName === null || typeof recipeName !== 'string') throw new Error('Recipe name is invalid')
    if (!Array.isArray(extraIngredients)) throw new Error('Extra ingredients must be an array')
    if (typeof number !== 'number' || number <= 0) throw new Error('Number must be a positive value')
    if (API_KEY === null) throw new Error('KEY not valid')

    const ingredientsValue = extraIngredients.length > 0 ? extraIngredients.join(', ') : ''

    const params = {
      query: recipeName,
      includeIngredients: ingredientsValue,
      number,
      apiKey: API_KEY
    }

    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', { params })

    if (response.data === false || response.data.results === false) throw new Error('Invalid API response')

    const responseData = await response.data.results

    return {
      recipes: responseData,
      extraIngredients
    }
  } catch (err) {
    console.error('Error searching recipe:', err)
    return []
  }
}
