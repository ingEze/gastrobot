import searchRecipeService from '../services/service.api.js';
const getAllRecipes = async (req, res) => {
    try {
        const { query, number } = req.query;
        if (query === null || number === null) {
            res.status(400).json({
                success: false,
                message: 'Please provide a query and a number'
            });
        }
        const recipes = await searchRecipeService(query, parseInt(number));
        res.status(200).json(recipes);
    }
    catch (err) {
        console.error(err);
    }
};
export default { getAllRecipes };
