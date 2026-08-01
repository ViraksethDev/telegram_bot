require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  BOT_TOKEN: process.env.BOT_TOKEN,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'telegram-finance-bot',
  DB_PORT: process.env.DB_PORT || 3306,
};
