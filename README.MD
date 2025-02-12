# 🤖 GastroBot - Your Culinary Assistant on Telegram

GastroBot is an intelligent cooking assistant that helps you discover new recipes and inspires you when you don't know what to cook. Using artificial intelligence, the bot provides personalized recommendations based on your preferences, available ingredients, and dietary restrictions.

## 🚧 Project Status

⚠️ **This project is currently under development** ⚠️

## 🌟 Features

- **Recipe Recommendations**: Personalized suggestions based on your preferences
- **Smart Search**: Find recipes based on ingredients you have available
- **Save Favorites**: Store your favorite recipes for easy access
- **Dietary Filters**: Options for vegetarian, vegan, gluten-free diets, etc.
- **Meal Planning**: Helps organize your weekly menu
- **Natural Conversation**: Friendly interaction thanks to AI

## 💡 Use Cases

- "What can I cook with chicken and potatoes?"
- "I need a quick vegetarian recipe"
- "Show me healthy dinner recipes"
- "Save this recipe to my favorites"
- "Give me ideas to cook with what I have in the fridge"

## 🛠️ Technologies Used

- **Node.js** - Main runtime environment
- **Express** - Web framework for Node.js
- **Python** - AI processing and data analysis
- **MongoDB** - Database for storing recipes and preferences
- **TypeScript** - Static typing for better maintainability
- **node-telegram-bot-api** - Telegram integration
- **Axios** - HTTP client for API requests

## 📋 Prerequisites

```bash
node >= 14.x
python >= 3.8
mongodb >= 4.4
```

## 🚀 Installation

1. Clone the repository
```bash
git clone https://github.com/ingEze/gastrobot
```

2. Install Node.js dependencies
```bash
npm install
```

3. Install Python dependencies
```bash
pip install -r requirements.txt
```

4. Configure environment variables
```bash
cp .env.example .env
```

5. Start the project
```bash
npm run dev
```

## 🔑 Configuration

Create an `.env` file in the project root with the following variables:

```env
TELEGRAM_BOT_TOKEN=your_token_here
MONGODB_URI=your_mongodb_uri
API_KEY=your_api_key
```

## 📱 Bot Usage

1. Search for "GastroBot" on Telegram
2. Start a conversation with /start
3. Follow the instructions to configure your preferences
4. Start discovering new recipes!

## 👤 Author

**Ezequiel Saucedo**
* GitHub: ingEze || https://github.com/ingEze
* LinkedIn: Ezequiel Rodrigo Saucedo || www.linkedin.com/in/ezequiel-rodrigo-saucedo-50451a294

## 📞 Contact

If you have any questions about this project or are interested in collaborating, don't hesitate to contact me.
