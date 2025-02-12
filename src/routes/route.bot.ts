import { Router } from 'express'

import getAllRecipes from '../controllers/controller.bot.js'

const botRouter = Router()

botRouter.get('/query', getAllRecipes)

export default botRouter
