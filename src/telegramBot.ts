import TelegramBot, { Message } from 'node-telegram-bot-api'
import { config } from './config/config.js'
import { Command, UserState, RecipeDetails, HandleFavoriteRecipe, HandleShowRecipe } from './types.js'
import { getAllRecipes, getRecipeId } from './controllers/api.js'
import { handleAddFavorite } from './controllers/mongodb.js'

const TOKEN_TELEGRAM: string = config.TOKEN_BOT ?? ''
const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true })

// map to maintain the state of each user by their chatId
const userState = new Map<number, UserState | undefined>()

// map to temporarily store the title and ID of the recipes requested by the user
const userRecipes: Record<number, Map<number, string>> = {}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class MessageHandlers {
  static async sendWelcomeMessage (msg: Message): Promise<void> {
    const userName = msg.from?.first_name ?? 'User'
    const WELCOME_MESSAGE = `
¡Hola ${userName}! 👋 Soy GastroBot, tu asistente culinario personal.

¿Qué te gustaría hacer?
🔍 /recipe - Buscar una receta
❓ /help - Ver todos los comandos disponibles
ℹ️ /about - Conocer más sobre mí

¡Empecemos a cocinar! 🍳
    `
    await bot.sendMessage(msg.chat.id, WELCOME_MESSAGE)
  }

  static async handleHelpCommand (msg: Message): Promise<void> {
    const header = '🌟 *¡Bienvenido a GastroBot!* 🌟\n\nAquí tienes los comandos disponibles:\n\n'

    const commandList = Object.values(commands)
      .map(cmd => `${cmd.emoji} ${cmd.command} - ${cmd.description}`)
      .join('\n')

    const footer = '\n\n👉 ¡Explora y disfruta de todas las funcionalidades que GastroBot tiene para ofrecerte! 😊'

    const message = header + commandList + footer

    await bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' })
  }

  static async handleRecipeStart (msg: Message): Promise<void> {
    const chatId = msg.chat.id
    userState.delete(chatId)
    userState.set(chatId, { step: 'waiting_for_recipe' })
    await bot.sendMessage(chatId, '¿Qué receta te gustaría buscar? 🔍')
  }

  static async handleRecipeFlow (msg: Message): Promise<void> {
    const chatId = msg.chat.id
    const text: string = msg.text?.trim() ?? ''

    if (text === undefined || text.startsWith('/')) return

    const currentState = userState.get(chatId)
    if (currentState == null) return

    let queryText: string | null = null

    try {
      switch (currentState.step) {
        case 'waiting_for_recipe': {
          queryText = text
          userState.set(chatId, {
            step: 'waiting_for_ingredients',
            recipe: queryText,
            ingredients: []
          })
          await bot.sendMessage(chatId, '¿Deseas buscar con algún ingrediente en especial? 🤔')
          break
        }

        case 'waiting_for_ingredients': {
          const userData = userState.get(chatId)
          if (userData == null) {
            await bot.sendMessage(chatId, 'Hubo un error, por favor intenta nuevamente.')
            break
          }

          userState.set(chatId, {
            step: 'waiting_for_number',
            recipe: userData?.recipe,
            ingredients: [...((userData.ingredients) ?? []), text]
          })
          await bot.sendMessage(chatId, '¿Cúantas recetas deseas buscar? 🔢')
          break
        }

        case 'waiting_for_number': {
          const number = parseInt(text, 10) ?? 1
          if (isNaN(number) || number <= 0) {
            await bot.sendMessage(chatId, 'Por favor, ingresa un número válido mayor que 0 ❌')
            return
          }
          const recipe = currentState.recipe ?? ''
          const extraIngredients = currentState.ingredients ?? []
          const response = await getAllRecipes(recipe, extraIngredients, number)

          if (response.recipes?.length === 0) {
            await bot.sendMessage(chatId, 'No encontré recetas con esos criterios 😔')
          } else {
            userRecipes[chatId] = new Map()

            const formatRecipes = (recipes: Array<{ title: string, image: string, id: number }>, limit: number): string => {
              return recipes
                .slice(0, limit)
                .map((recipe, index) => {
                  const recipeNumber = String(index + 1)
                  return [
                    `📝 Receta #${recipeNumber}`,
                    `🍳 ${String(recipe.title)}`,
                    `🖼️ ${String(recipe.image)}`
                  ].join('\n')
                })
                .join('\n\n')
            }

            const formatIngredients = (recipes: Array<{ ingredients: string }>): string => {
              const uniqueIngredients = Array.from(
                new Set(
                  recipes
                    .map(r => r.ingredients)
                    .flat()
                )
              )
              return `🧂 Ingredientes: ${uniqueIngredients.map(String).join(' • ')}`
            }

            await bot.sendMessage(
              chatId,
              [
                '🌟 ¡Aquí tienes tus recetas! 🌟',
                '',
                String(formatRecipes(response.recipes, number)),
                '',
                String(formatIngredients(response.recipes))
              ].join('\n'),
              {
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: response.recipes.slice(0, number).map((recipe: { title: string, id: number }) => {
                    userRecipes[chatId].set(recipe.id, recipe.title)

                    return [{
                      text: `🍳 ${recipe.title}`,
                      callback_data: `show_recipe_${recipe.id}`
                    }]
                  })
                }
              }
            )
          }

          userState.delete(chatId)
          break
        }
      }
    } catch (err) {
      console.error('Error al procesar la receta:', err)
      await bot.sendMessage(chatId, 'Ocurrió un error al procesar tu solicitud 😔')
      userState.delete(chatId)
    }
  }

  static async handleFavoriteCommand (msg: Message): Promise<void> {
    await bot.sendMessage(msg.chat.id, 'Aquí puedes ver tus recetas favoritas. Usa el comando /recipe primero para buscar y añadir favoritos.')
  }
}

const commands: Record<string, Command> = {
  '/start': {
    command: '/start',
    description: 'Iniciar el bot',
    action: MessageHandlers.sendWelcomeMessage,
    emoji: '🚀'
  },
  '/help': {
    command: '/help',
    description: 'Ver comandos disponibles',
    action: MessageHandlers.handleHelpCommand,
    emoji: '❓'
  },
  '/about': {
    command: '/about',
    description: 'Acerca de GastroBot',
    action: async (msg: Message) => {
      const ABOUT_MESSAGE = `
🤖 GastroBot - Tu Asistente Culinario AI 🍳

¡Hola! Soy GastroBot, tu compañero inteligente en la cocina.

🔹 ¿Qué puedo hacer?
• Sugerir recetas basadas en tus ingredientes
• Ayudarte a aprovechar tu despensa
• Inspirarte con nuevas ideas culinarias

💡 Solo dime qué ingredientes tienes y te ayudaré a crear algo delicioso.

👨‍💻 Desarrollado por:
Ezequiel Saucedo
GitHub: https://github.com/ingEze

¡Comencemos a cocinar! 🥘
      `
      await bot.sendMessage(msg.chat.id, ABOUT_MESSAGE)
    },
    emoji: '❕'
  },
  '/recipe': {
    command: '/recipe',
    description: 'Buscar una receta',
    action: MessageHandlers.handleRecipeStart,
    emoji: '🔍'
  },
  '/favorite': {
    command: '/favorite',
    description: 'Your recipes favorites',
    action: MessageHandlers.handleFavoriteCommand,
    emoji: '🤩'
  }
}

const handleShowRecipe: HandleShowRecipe = async (callbackQuery, chatId, recipeId) => {
  try {
    const recipe = await getRecipeId(recipeId) as RecipeDetails
    const recipeName = userRecipes[chatId]?.get(recipeId) ?? 'Receta desconocida'

    if (recipe === null || recipe === undefined) {
      await bot.sendMessage(chatId, `No se pudo obtener información para: ${recipeName}`)
      return
    }

    // Función auxiliar para sanitizar strings HTML de forma segura
    const sanitizeHtml = (text: string | undefined): string => {
      return (text != null) ? text.replace(/<\/?[^>]+(>|$)/g, '') : ''
    }

    // Función para manejar de forma segura valores que podrían ser undefined
    const safeValue = <T>(value: T | undefined, defaultValue: string): string => {
      if (value === undefined || value === null) return defaultValue
      return String(value)
    }

    const formattedMessage = [
      `📜 *Detalles de la receta: ${recipeName}*`,
      '',
      (recipe.summary != null) ? `📝 *Resumen:* ${sanitizeHtml(recipe.summary)}` : '',
      '',
      (recipe.instructions != null)
        ? `👨‍🍳 *Instrucciones:* ${sanitizeHtml(recipe.instructions)}`
        : '👨‍🍳 *Instrucciones:* No hay instrucciones disponibles',
      '',
      `⏱ *Tiempo de preparación:* ${safeValue(recipe.readyInMinutes, 'No especificado')} minutos`,
      `👥 *Porciones:* ${safeValue(recipe.servings, 'No especificado')}`,
      `❤️ *Puntuación:* ${(recipe.spoonacularScore != null)
        ? recipe.spoonacularScore.toFixed(1)
        : 'No disponible'}/100`
    ].join('\n')

    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: '♥ Add to favorite', callback_data: `add_to_favorite_${recipeId}` }]
        ]
      }
    })
    console.log(`Botón de favoritos creado para: ${recipeId} con callback_data: add_to_favorite_${recipeId}`)
    await bot.answerCallbackQuery(callbackQuery.id)
  } catch (err) {
    console.error('Error al obtener detalles de la receta:', err)
    await bot.sendMessage(chatId, 'No se pudo obtener los detalles de la receta seleccionada')
  }
}

const handleAddFavoriteRecipe: HandleFavoriteRecipe = async (callbackQuery, chatId, data) => {
  try {
    const recipeId = Number(data.split('_')[3])
    if (isNaN(recipeId)) {
      console.error(`ID de receta inválido: ${data.split('_')[3]}`)
      return
    }

    const recipeName = userRecipes[chatId]?.get(recipeId) ?? 'Receta desconocida'

    await handleAddFavorite(chatId, recipeId)
    await bot.sendMessage(chatId, `¡Receta "${recipeName}" añadida a favoritos! ⭐`)
    await bot.answerCallbackQuery(callbackQuery.id, { text: '¡Añadidos a favoritos!' })
  } catch (err) {
    console.error('Error al agregar a favoritos:', err)
    await bot.sendMessage(chatId, '❌ Ocurrió un error al agregar la receta a favoritos.')
  }
}

bot.onText(/\/\w+/, (msg: Message, match: RegExpMatchArray | null) => {
  if (match == null) return

  const command = match[0]
  if (commands[command] !== null) {
    commands[command].action(msg).catch(console.error)
  } else {
    bot.sendMessage(msg.chat.id, 'Comando desconocido ❌').catch(console.error)
  }
})

bot.on('message', (msg: Message) => {
  if ((msg.text?.startsWith('/')) ?? false) return
  MessageHandlers.handleRecipeFlow(msg).catch(console.error)
})

bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message
  if (msg == null) return

  const chatId = msg?.chat.id
  const data = callbackQuery.data
  if (data === null || data === undefined) return

  if (data.startsWith('show_recipe_')) {
    const recipeId = Number(data.split('_')[2])
    if (isNaN(recipeId)) return
    await handleShowRecipe(callbackQuery, chatId, recipeId)
  } else if (data.startsWith('add_to_favorite_')) {
    await handleAddFavoriteRecipe(callbackQuery, chatId, data)
  }
})

bot.on('polling_error', (error: Error) => {
  console.error('Error de polling:', error.message)
})

export default bot
