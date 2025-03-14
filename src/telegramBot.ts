import TelegramBot, { Message } from 'node-telegram-bot-api'
import { config } from './config/config.js'
import { Command, UserState } from './types.js'
import getAllRecipes from './controllers/api.js'

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

  static async handleFavoriteRecipe (msg: Message): Promise<void> {
    // const chatId = msg.chat.id
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
    action: MessageHandlers.handleFavoriteRecipe,
    emoji: '🤩'
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
  const recipeId = Number(data?.split('_')[2])

  const recipeName = userRecipes[chatId]?.get(recipeId) ?? 'Unknow recipe'

  if ((data?.startsWith('show_recipe_')) ?? false) {
    await bot.sendMessage(
      chatId,
      `📜 Detalles de la receta: ${recipeName}\n\nAquí vendrán los detalles de la receta...`
    ).catch(console.error)
  }
})

bot.on('polling_error', (error: Error) => {
  console.error('Error de polling:', error.message)
})

export default bot
