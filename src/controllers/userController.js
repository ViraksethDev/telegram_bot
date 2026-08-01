const { User } = require('../models');

/**
 * Ensure user exists in the database, if not create one.
 * @param {Object} from - Telegram user object
 * @returns {Promise<User>}
 */
const ensureUser = async (from) => {
  try {
    let [user] = await User.findOrCreate({
      where: { id: from.id },
      defaults: {
        username: from.username,
        first_name: from.first_name,
        currency: 'USD', // Default
        language: from.language_code || 'km',
      }
    });
    return user;
  } catch (error) {
    console.error('[UserController] ensureUser error:', error);
    throw error;
  }
};

module.exports = {
  ensureUser,
};
