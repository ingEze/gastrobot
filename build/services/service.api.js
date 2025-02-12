import axios from 'axios';
const searchRecipeService = async (query, number) => {
    const API_KEY = process.env.API_KEY ?? '';
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=${number}&apiKey=${API_KEY}`;
    if (query === null || number === null || API_KEY === null)
        throw new Error('Please provide a query and a number');
    //   if (query !== string || number !== number) throw new Error('Please provide a query and a number')
    try {
        const response = await axios.get(url);
        const result = {
            totalResults: response.data.totalResults ?? 0,
            results: response.data.results ?? []
        };
        if (result.totalResults === 0) {
            throw new Error('No recipes found');
        }
        return { result };
    }
    catch (err) {
        console.error(err);
    }
};
export default searchRecipeService;
