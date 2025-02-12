import { Router } from 'express';
import SearchRecipeController from '../controllers/controller.bot.js';
const apiRouter = Router();
apiRouter.get('/recipe', SearchRecipeController.getAllRecipes);
export default apiRouter;
