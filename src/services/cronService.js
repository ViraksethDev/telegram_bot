const cron = require('node-cron');
const { getActiveReminders } = require('../controllers/reminderController');
const bot = require('../bot');

const scheduledJobs = {};

const initCronJobs = async () => {
  const reminders = await getActiveReminders();
  
  reminders.forEach(reminder => {
    scheduleReminder(reminder);
  });
  
  console.log(`[Cron] Initialized ${reminders.length} reminder jobs.`);
};

const scheduleReminder = (reminder) => {
  if (scheduledJobs[reminder.id]) {
    scheduledJobs[reminder.id].stop();
  }

  const job = cron.schedule(reminder.cron_time, () => {
    bot.telegram.sendMessage(reminder.user_id, `⏰ **ការរំលឹក:** ${reminder.message}`, { parse_mode: 'Markdown' })
      .catch(err => console.error(`[Cron] Failed to send reminder to ${reminder.user_id}:`, err));
  });

  scheduledJobs[reminder.id] = job;
};

module.exports = {
  initCronJobs,
  scheduleReminder
};
