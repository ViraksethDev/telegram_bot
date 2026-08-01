const { sequelize, connectDB } = require('../config/db');
const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const Reminder = require('./Reminder');

// Set up associations
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Budget, { foreignKey: 'user_id' });
Budget.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Reminder, { foreignKey: 'user_id' });
Reminder.belongsTo(User, { foreignKey: 'user_id' });

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // Alter table to fit models if it exists
    console.log('[DB] All models were synchronized successfully.');
  } catch (error) {
    console.error('[DB] Failed to synchronize models:', error);
  }
};

module.exports = {
  sequelize,
  connectDB,
  syncDB,
  User,
  Transaction,
  Budget,
  Reminder
};
