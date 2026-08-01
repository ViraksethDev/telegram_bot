const express = require('express');
const bot = require('./src/bot');
const config = require('./src/config/env');
const { connectDB, syncDB } = require('./src/models');
const { initCronJobs } = require('./src/services/cronService');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Start bot in polling mode
bot.launch()
  .then(() => console.log('[Bot] Started using polling mode.'))
  .catch((err) => console.error('[Bot] Failed to start polling:', err));

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Telegram Finance Bot Server is running!');
});

app.listen(config.PORT, async () => {
  console.log(`[Server] Express server running on port ${config.PORT}`);
  
  // Initialize Database
  await connectDB();
  await syncDB();
  
  // Initialize Cron Jobs
  await initCronJobs();
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
