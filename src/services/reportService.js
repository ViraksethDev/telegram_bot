const { Transaction } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const getReport = async (userId, startDate, endDate) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate, endDate],
        }
      },
      order: [['date', 'DESC']]
    });

    let summary = {
      incomeUSD: 0, incomeKHR: 0,
      expenseUSD: 0, expenseKHR: 0,
      transactions: transactions
    };

    transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        if (t.currency === 'USD') summary.incomeUSD += amt;
        else summary.incomeKHR += amt;
      } else {
        if (t.currency === 'USD') summary.expenseUSD += amt;
        else summary.expenseKHR += amt;
      }
    });

    return summary;
  } catch (error) {
    console.error('[ReportService] getReport error:', error);
    throw error;
  }
};

const getTodayReport = (userId) => {
  const start = moment().startOf('day').toDate();
  const end = moment().endOf('day').toDate();
  return getReport(userId, start, end);
};

const getWeekReport = (userId) => {
  const start = moment().startOf('week').toDate();
  const end = moment().endOf('week').toDate();
  return getReport(userId, start, end);
};

const getMonthReport = (userId) => {
  const start = moment().startOf('month').toDate();
  const end = moment().endOf('month').toDate();
  return getReport(userId, start, end);
};

module.exports = {
  getReport,
  getTodayReport,
  getWeekReport,
  getMonthReport
};
