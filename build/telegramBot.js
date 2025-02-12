import TelegramBot from 'node-telegram-bot-api';
import { config } from './config/config.js';
const TOKEN_TELEGRAM = config.TOKEN_BOT ?? '';
const bot = new TelegramBot(TOKEN_TELEGRAM, { polling: true });
const commands = {
    '/start': {
        description: 'Start bot',
        action: async (msg) => {
            await bot.sendMessage(msg.chat.id, `Hello ${((msg.from?.first_name) != null) ? msg.from?.first_name : 'User'}, my name is GastroBot, what can I do for you?`);
        }
    },
    '/help': {
        description: 'View available commands',
        action: async (msg) => {
            const availableCommands = Object.keys(commands)
                .map((command) => `${command} - ${commands[command].description}`)
                .join('\n');
            await bot.sendMessage(msg.chat.id, `Available commands: \n ${availableCommands}`);
        }
    },
    // '/favorites': {
    //   description: 'View your favorites recipes',
    //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Your favorites recipes: in process...')
    // },
    '/about': {
        description: 'About GastroBot',
        action: async (msg) => {
            await bot.sendMessage(msg.chat.id, `🤖 GastroBot - Your AI Culinary Assistant 🍳

        Hi! I'm GastroBot, your intelligent kitchen companion.

        🔹 What can I do?
        • Suggest recipes based on your available ingredients
        • Help you make the most of your pantry
        • Inspire you with new culinary ideas

        💡 Just tell me what ingredients you have, and I'll help you create something delicious.

        👨‍💻 Developed by:
        Ezequiel Saucedo
        GitHub: https://github.com/ingEze

        Let's start cooking! 🥘`);
        }
    }
    // '/recipe': {
    //   description: 'Search a recipe',
    //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Search a recipe: in process...')
    // },
    // '/add': {
    //   description: 'Add a ingredient',
    //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Add a ingredient: in process...')
    // },
    // '/clear': {
    //   description: 'Clear all ingredients',
    //   action: async (msg: Message) => await bot.sendMessage(msg.chat.id, 'Clear all ingredients: in process...')
    // }
};
bot.onText(/\/\w+/, (msg, match) => {
    if (match != null) {
        const command = match[0];
        const availableCommands = Object.keys(commands)
            .map((command) => `${command} - ${commands[command].description}`)
            .join('\n');
        console.log('Available commands: \n', availableCommands);
        try {
            if (commands[command] != null) {
                commands[command].action(msg).catch(console.error);
            }
            else {
                bot.sendMessage(msg.chat.id, 'Unknown command').catch(console.error);
            }
        }
        catch (err) {
            console.error(err);
        }
    }
});
bot.on('polling_error', (err) => {
    console.log(err.message);
});
export default bot;
