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
    action: handleRecipeCommand
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

const userState = new Map<number, { step: string, recipe?: string }>()

async function handleRecipeCommand (msg: Message): Promise<void> {
  const chatId = msg.chat.id

  userState.delete(chatId)
  userState.set(chatId, { step: 'waiting_for_recipe' })
  await bot.sendMessage(chatId, 'Insert a recipe name').catch(console.error)
}

const handleRecipeMessage = async (msg: Message): Promise<void> => {
  const chatId = msg.chat.id
  const text: string = msg.text?.trim() ?? ''

  if (text === null || text.startsWith('/')) return

  const currentState = userState.get(chatId)
  if (currentState === null) return

  try {
    switch (currentState?.step) {
      case 'waiting_for_recipe': {
        userState.set(chatId, { step: 'waiting_for_number', recipe: text })
        await bot.sendMessage(chatId, 'Insert a number of recipes').catch(console.error)
        break
      }

      case 'waiting_for_number': {
        const number = parseInt(text, 10) ?? 1
        if (isNaN(number) || number <= 0) {
          await bot.sendMessage(chatId, 'Please enter a valid number greater than 0').catch(console.error)
          return
        }

        const recipe = currentState.recipe ?? ''
        const response = await getAllRecipes(recipe, number)
        if (response.recipes === null || response.recipes.length === 0) {
          await bot.sendMessage(chatId, 'No recipes found').catch(console.error)
        } else {
          const recipiesFormatted = response.recipes
            .slice(0, number)
            .map((r: { title: string, image: string }, index: number) =>
              `🍽️ Recipe ${index + 1}: ${r.title}\n🔗 ${r.image}`
            )
            .join('\n\n')

          await bot.sendMessage(chatId, recipiesFormatted).catch(console.error)
        }

        userState.delete(chatId)
        break
      }
    }
  } catch (err) {
    console.error('Error handling recipe message', err)
    await bot.sendMessage(chatId, 'An error occurred while processing your request').catch(console.error)
    userState.delete(chatId)
  }
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

bot.on('message', handleRecipeMessage)

bot.on('polling_error', (err: Error) => {
  console.log(err.message)
})

export default bot
