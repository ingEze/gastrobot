import TelegramBot, { Message } from 'node-telegram-bot-api'
import { config } from './config/config.js'
import { Command, UserState } from './types.js'
import getAllRecipes from './controllers/controller.api.js'

const TOKEN_TELEGRAM: string = config.TOKEN_BOT ?? ''
const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true })

// map to maintain the state of each user by their chatId
const userState = new Map<number, UserState | undefined>()

// class to handle all bot messages and commands
class MessageHandlers {
  static async sendWelcomeMessage (msg: Message): Promise<void> {
    const userName = msg.from?.first_name ?? 'User'
    const WELCOME_MESSAGE = `
¡Hola ${userName}! 👋 Soy GastroBot, tu asistente culinario personal.

¿Qué te gustaría hacer?
🔍 /recipe - Buscar una receta
➕ /add - Añadir un ingrediente
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

    if (text === null || text.startsWith('/')) return

    const currentState = userState.get(chatId)
    if (currentState == null) return

    try {
      switch (currentState.step) {
        case 'waiting_for_recipe': {
          userState.set(chatId, {
            step: 'waiting_for_number',
            recipe: text,
            ingredients: []
          })
          await bot.sendMessage(chatId, '¿Cuántas recetas quieres ver? 🔢')
          break
        }

        case 'waiting_for_number': {
          const number = parseInt(text, 10) ?? 1
          if (isNaN(number) || number <= 0) {
            await bot.sendMessage(chatId, 'Por favor, ingresa un número válido mayor que 0 ❌')
            return
          }

          const recipe = currentState.recipe ?? ''
          const response = await getAllRecipes(recipe, number)

          if (response.recipes?.length === 0) {
            await bot.sendMessage(chatId, 'No encontré recetas con esos criterios 😔')
          } else {
            const recipesFormatted: string = response.recipes
              .slice(0, number)
              .map((r: { title: string, image: string }, index: number) =>
                `🍽️ Receta ${index + 1}: ${r.title}\n🔗 ${r.image}`
              )
              .join('\n\n')

            await bot.sendMessage(chatId, `¡Aquí tienes tus recetas! 🎉\n\n${recipesFormatted}`)
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

  static async handleAddIngredient (msg: Message): Promise<void> {
    const chatId = msg.chat.id

    const ingredient = msg.text?.split(' ').slice(1).join(' ')

    if (ingredient === undefined) {
      await bot.sendMessage(chatId, 'Por favor, especifica un ingrediente. Ejemplo: /add tomato 🍅')
      return
    }

    const userData = userState.get(chatId)
    if (userData == null) {
      await bot.sendMessage(chatId, 'Primero busca una receta con /recipe 😊')
      return
    }

    userData.ingredients = userData.ingredients ?? []
    userData.ingredients.push(ingredient)
    userState.set(chatId, userData)

    const updateRecipes = await getAllRecipes(userData.recipe ?? '', userData.ingredients.length)

    let message = `✅ Ingrediente "${ingredient}" añadido.\n\n🍽️ Recetas actualizadas:\n`
    updateRecipes.forEach((r: { title: string, image: string }, index: number) => {
      message += `${index + 1}. ${r.title}\n🔗 ${r.image}\n\n`
    })

    await bot.sendMessage(chatId, message)
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
  '/add': {
    command: '/add',
    description: 'Añadir un ingrediente',
    action: MessageHandlers.handleAddIngredient,
    emoji: '➕'
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

bot.onText(/\/add (.+)/, (msg: Message, match: RegExpMatchArray | null) => {
  if (match == null) return
  MessageHandlers.handleAddIngredient(msg).catch(console.error)
})

bot.on('polling_error', (error: Error) => {
  console.error('Error de polling:', error.message)
})

export default bot
