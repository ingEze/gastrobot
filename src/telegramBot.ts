import TelegramBot, { InlineKeyboardButton, Message } from 'node-telegram-bot-api'
import { config } from './config/config.js'
import { Command, UserState, RecipeDetails, HandleFavoriteRecipe, FavoriteRecipeMessage } from './types.js'
import { getAllRecipes, getRecipeId } from './controllers/api.js'
import { handleAddFavorite, handleGetFavorite } from './controllers/mongodb.js'

const TOKEN_TELEGRAM: string = config.TOKEN_BOT ?? ''
const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true })

// map to maintain the state of each user by their chatId
const userState = new Map<number, UserState | undefined>()

// map to temporarily store the title and ID of the recipes requested by the user
const userRecipes: Record<number, Map<number, string>> = {}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class MessageHandlers {
  static async sendWelcomeMessage (msg: Message): Promise<void> {
    const username = msg.from?.first_name ?? 'User'
    const WELCOME_MESSAGE = `
¡Hola ${username}! 👋 Soy GastroBot, tu asistente culinario personal.

🔹 ¿Cómo usarme?

1️⃣ Usa el comando /recipe y dime qué tipo de receta buscas (ej: pizza, tea, coffee).
2️⃣ Elige si quieres buscar con ingredientes específicos (ej: tomate albahaca sal).
3️⃣ Indica cuántas recetas quieres ver ingresando un número positivo.

📌 Ejemplo de uso:
/recipe → pizza → tomate albahaca sal → 3

🍕 ¡Y listo! Te mostraré las mejores opciones para que cocines algo increíble.

💾 También puedes guardar tus recetas favoritas y explorarlas más tarde utilizando el comando /favorite.

❓ ¿Necesitas ayuda? Usa el comando /help para obtener más información.

¡Dime qué quieres preparar y comencemos a cocinar juntos! 🥗🍰🔥
    `
    await bot.sendMessage(msg.chat.id, WELCOME_MESSAGE)
  }

  static async handleHelpCommand (msg: Message): Promise<void> {
    const username = msg.from?.first_name ?? 'Chef'
    const header = `👋 ¡Hola *${username}*! Bienvenido a *GastroBot*, tu asistente culinario personal.\n\n` +
                   '📌 Aquí tienes los comandos disponibles para aprovechar al máximo el bot:\n\n'

    const commandList = Object.values(commands)
      .map(cmd => `🔹 *${cmd.command}* - ${cmd.description}`)
      .join('\n')

    const footer = '\n\nℹ️ *¿Necesitas más ayuda?* Escríbeme y estaré encantado de asistirte. ¡Feliz cocina! 🍳🔥'

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
    try {
      const chatId = msg.chat.id

      const header = '🍽️ ¡Hola! Aquí tienes tus recetas favoritas guardadas. 🎉\n' +
               'Para agregar más, usa el comando /recipe y descubre nuevas delicias. 😍\n\n'

      const favoriteRecipes: Array<{ recipeId: number, title: string, favoriteAdded: string }> = await handleGetFavorite(chatId)

      const favoriteRecipesData: FavoriteRecipeMessage[] = favoriteRecipes.map((recipe) => ({
        title: recipe.title,
        favoriteAdded: recipe.favoriteAdded
      }))

      const recipeListMessage = favoriteRecipesData
        .map((recipe, index) => `📌 ${index + 1}. ${recipe.title} - (Añadida el ${recipe.favoriteAdded})`)
        .join('\n')

      const footer = '\n\n 👨‍🍳 Elige una receta y ponte manos a la obra! 🔥'

      const message = header + recipeListMessage + footer

      const recipeButtons: InlineKeyboardButton[][] = favoriteRecipes.map((recipe) => [
        {
          text: recipe.title,
          callback_data: `recipe_in_favorite_${recipe.recipeId}`
        }
      ])

      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: recipeButtons
        }
      })
    } catch (err) {
      console.error('Error al obtener las recetas favoritas:', err)
    }
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
    description: 'Tus recetas favoritas',
    action: MessageHandlers.handleFavoriteCommand,
    emoji: '🤩'
  }
}

const showRecipeMessage = async (chatId: number, recipeId: number, textData: string, callbackData: string): Promise<void> => {
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
        [{ text: textData, callback_data: `${callbackData}${recipeId}` }]
      ]
    }
  })
}

const handleAddFavoriteRecipe: HandleFavoriteRecipe = async (callbackQuery, chatId, data) => {
  try {
    const recipeId = Number(data.split('_')[2])
    if (isNaN(recipeId)) {
      console.error(`ID de receta inválido: ${data.split('_')[2]}`)
      return
    }

    const response = await handleAddFavorite(recipeId, chatId)

    if (response.success === true) {
      await bot.sendMessage(chatId, '¡Receta añadida a favoritos! ⭐')
      await bot.answerCallbackQuery(callbackQuery.id, { text: '¡Añadidos a favoritos!' })
    } else {
      console.error('Error al guardar como favoritos')
      await bot.sendMessage(chatId, 'La receta ya se encuentra en favoritos.')
    }
  } catch (err) {
    const error = err as Error
    console.error('Error al agregar a favoritos:', error.message)
    await bot.sendMessage(chatId, 'Error al agregar a favoritos.')
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
    await handleAddFavoriteRecipe(callbackQuery, chatId, data) // no tocar
  } else if (data.startsWith('add_to_favorite_')) {
    const recipeId = Number(data.split('_')[3])
    const text = '♥ Add to favorite'
    const callbackData = 'recipe_in_favorite_'
    await showRecipeMessage(chatId, recipeId, text, callbackData)
  } else if (data.startsWith('recipe_in_favorite_')) {
    const recipeId = Number(data.split('_')[3])
    const text = '🗑 Remove to favorite'
    const callbackData = 'remove_recipe_in_favorite_'
    await showRecipeMessage(chatId, recipeId, text, callbackData)
  }
})

bot.on('polling_error', (error: Error) => {
  console.error('Error de polling:', error.message)
})

export default bot
