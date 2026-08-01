const { Transaction } = require('../models');

/**
 * Add a new transaction (income or expense)
 */
const addTransaction = async (userId, type, amount, currency, category, note) => {
  try {
    const transaction = await Transaction.create({
      user_id: userId,
      type,
      amount,
      currency,
      category,
      note,
    });
    return transaction;
  } catch (error) {
    console.error('[TransactionController] addTransaction error:', error);
    throw error;
  }
};

/**
 * Get current balance for a user
 */
const getBalance = async (userId) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: userId }
    });

    let balanceUSD = 0;
    let balanceKHR = 0;

    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        if (t.currency === 'USD') balanceUSD += amt;
        else balanceKHR += amt;
      } else if (t.type === 'expense') {
        if (t.currency === 'USD') balanceUSD -= amt;
        else balanceKHR -= amt;
      }
    });

    return { USD: balanceUSD, KHR: balanceKHR };
  } catch (error) {
    console.error('[TransactionController] getBalance error:', error);
    throw error;
  }
};

module.exports = {
  addTransaction,
  getBalance,
};
