const { Reminder } = require('../models');

const addReminder = async (userId, cronTime, message) => {
  try {
    const reminder = await Reminder.create({
      user_id: userId,
      cron_time: cronTime,
      message
    });
    return reminder;
  } catch (error) {
    console.error('[ReminderController] addReminder error:', error);
    throw error;
  }
};

const getActiveReminders = async () => {
  try {
    return await Reminder.findAll({ where: { is_active: true } });
  } catch (error) {
    console.error('[ReminderController] getActiveReminders error:', error);
    return [];
  }
};

module.exports = {
  addReminder,
  getActiveReminders
};
