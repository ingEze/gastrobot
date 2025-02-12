import TelegramBot, { Message } from 'node-telegram-bot-api'
import { config } from './config/config.js'

import { Command } from './types.js'
import getAllRecipes from './controllers/controller.bot.js'

const TOKEN_TELEGRAM: string = config.TOKEN_BOT ?? ''

const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true })

const commands: Record<string, Command> = {
  '/start': {
    description: 'Start bot',
    action: async (msg: Message) => {
      await bot.sendMessage(msg.chat.id, `Hello ${((msg.from?.first_name) != null) ? msg.from?.first_name : 'User'}, my name is GastroBot, what can I do for you?`)
    }
  },
  '/help': {
    description: 'View available commands',
    action: async (msg: Message) => {
      const availableCommands = Object.keys(commands)
        .map((command) => `${command} - ${commands[command].description}`)
        .join('\n')
      await bot.sendMessage(msg.chat.id, `Available commands: \n ${availableCommands}`)
    }
  },
  '/about': {
    description: 'About GastroBot',
    action: async (msg: Message) => {
      await bot.sendMessage(
        msg.chat.id,
        `🤖 GastroBot - Your AI Culinary Assistant 🍳

        Hi! I'm GastroBot, your intelligent kitchen companion.

        🔹 What can I do?
        • Suggest recipes based on your available ingredients
        • Help you make the most of your pantry
        • Inspire you with new culinary ideas

        💡 Just tell me what ingredients you have, and I'll help you create something delicious.

        👨‍💻 Developed by:
        Ezequiel Saucedo
        GitHub: https://github.com/ingEze

        Let's start cooking! 🥘`
      )
    }
  },
  '/recipe': {
    description: 'Search a recipe',
    action: async (msg: Message) => {
      await bot.sendMessage(
        msg.chat.id,
        await getRecipies()

      ).catch(console.error)
    }
  }
  // '/add': {
  //   description: 'Add a ingredient',
  //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Add a ingredient: in process...')
  // },
  // '/clear': {
  //   description: 'Clear all ingredients',
  //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Clear all ingredients: in process...')
  // }

  // '/favorites': {
  //   description: 'View your favorites recipes',
  //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Your favorites recipes: in process...')
  // },
}

const getRecipies = async (): Promise<string> => {
  const userState: Record<number, { step: string, number?: number }> = {}
  return await new Promise((resolve, reject) => {
    bot.onText(/\/recipe/, (msg: Message) => {
      const chatId = msg.chat.id
      bot.sendMessage(chatId, 'Insert a number of recipes').catch(console.error)
      userState[chatId] = { step: 'waiting_for_user' }
    })

    bot.on('message', async (msg: Message) => {
      const chatId = msg.chat.id
      const text = msg.text?.trim() ?? ''

      if (text === null || ((msg.text?.startsWith('/')) ?? false)) {
        return
      }

      if (userState[chatId]?.step === 'waiting_for_user') {
        const number = parseInt(text, 10)
        if (isNaN(number)) {
          bot.sendMessage(chatId, 'Please enter a valid number').catch(console.error)
          return
        }

        userState[chatId] = { step: 'waiting_for_recipe', number }
        bot.sendMessage(chatId, 'Insert a recipe').catch(console.error)
        return
      }

      if (userState[chatId]?.step === 'waiting_for_recipe') {
        const recipe: string = text
        const number = userState[chatId].number ?? 1

        try {
          const response: { recipes: Array<{ title: string, image: string }> } = await getAllRecipes(recipe, number)
          if (response.recipes === null || response.recipes.length === 0) {
            resolve('No recipes found')
          } else {
            const recipiesFormatted = response.recipes
              .slice(0, number)
              .map((r, index) => `🍽️ Recipe ${index + 1}: ${r.title}\n🔗 ${r.image}`)
              .join('\n\n')

            resolve(recipiesFormatted)
          }
        } catch (err) {
          reject(err)
        }
      }
    })
  })
}

bot.onText(/\/\w+/, (msg: Message, match: RegExpMatchArray | null) => {
  if (match != null) {
    const command = match[0]

    Object.keys(commands)
      .map((command) => `${command} - ${commands[command].description}`)
      .join('\n')

    try {
      if (commands[command] != null) {
        commands[command].action(msg).catch(console.error)
      } else {
        bot.sendMessage(msg.chat.id, 'Unknown command').catch(console.error)
      }
    } catch (err) {
      console.error(err)
    }
  }
})

bot.on('polling_error', (err: Error) => {
  console.log(err.message)
})

export default bot
