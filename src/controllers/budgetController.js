const { Budget, Transaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const setBudget = async (userId, amount, category) => {
  try {
    const month = moment().month() + 1; // 1-12
    const year = moment().year();

    let [budget, created] = await Budget.findOrCreate({
      where: { user_id: userId, category, month, year },
      defaults: { amount }
    });

    if (!created) {
      budget.amount = amount;
      await budget.save();
    }
    
    return budget;
  } catch (error) {
    console.error('[BudgetController] setBudget error:', error);
    throw error;
  }
};

const checkBudgetAlert = async (userId, category, newExpenseAmount, currency) => {
  try {
    const month = moment().month() + 1;
    const year = moment().year();
    
    // Convert new expense to USD approx if it's KHR
    let amountToAdd = parseFloat(newExpenseAmount);
    if (currency === 'KHR') {
      amountToAdd = amountToAdd / 4000;
    }

    const budget = await Budget.findOne({
      where: { user_id: userId, category, month, year }
    });

    if (!budget) return null;

    // Get current total expenses for this category this month
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        category,
        type: 'expense',
        date: { [Op.between]: [startOfMonth, endOfMonth] }
      }
    });

    let currentTotalUSD = 0;
    transactions.forEach(t => {
      let amt = parseFloat(t.amount);
      if (t.currency === 'KHR') amt = amt / 4000;
      currentTotalUSD += amt;
    });
    
    const budgetAmount = parseFloat(budget.amount);
    const newTotal = currentTotalUSD; // This already includes the new transaction since we call this AFTER adding the transaction

    if (newTotal >= budgetAmount) {
      return { status: 'exceeded', currentTotal: newTotal, limit: budgetAmount };
    } else if (newTotal >= budgetAmount * 0.8) {
      return { status: 'warning', currentTotal: newTotal, limit: budgetAmount };
    }
    
    return null;
  } catch (error) {
    console.error('[BudgetController] checkBudgetAlert error:', error);
    return null; // Don't throw, just return null so it doesn't break the transaction flow
  }
};

module.exports = {
  setBudget,
  checkBudgetAlert
};
