import dotenv from 'dotenv';
dotenv.config();
export const config = {
    TOKEN_BOT: process.env.TOKEN_BOT,
    MONGO_URI: process.env.MONGO_URI,
    API_KEY: process.env.API_KEY
};
