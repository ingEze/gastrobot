import { Router } from 'express';
import SearchRecipeController from '../controllers/controller.bot.js';
const botRouter = Router();
botRouter.get('/query', SearchRecipeController.getAllRecipes);
export default botRouter;
