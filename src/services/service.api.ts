import axios from 'axios'
import { SearchRecipe } from '../types.js'

const API_KEY = process.env.API_KEY ?? ''

export const searchRecipeService: SearchRecipe = async (recipeName: string, extraIngredients: string[] = [], number: number) => {
  try {
    const params = {
      query: recipeName,
      includeIngredients: extraIngredients.join(','),
      number,
      apiKey: API_KEY
    }

    console.log('params', params)

    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', { params })

    if (recipeName === null || API_KEY === null) throw new Error('Please provide a query and a number')
    if (typeof recipeName !== 'string') throw new Error('Please provide a query and a number')

    if (extraIngredients.length > 0) {
      if (typeof extraIngredients !== 'string') throw new Error('Extra ingredients be a string')
    }

    const responseData = await response.data.results

    return responseData
  } catch (err) {
    console.error('Error searching recipe:', err)
    return []
  }
}
