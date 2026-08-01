const ExcelJS = require('exceljs');
const { Transaction } = require('../models');

const generateExcelExport = async (userId) => {
  const transactions = await Transaction.findAll({
    where: { user_id: userId },
    order: [['date', 'DESC']]
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Note', key: 'note', width: 30 },
    { header: 'Date', key: 'date', width: 20 },
  ];

  transactions.forEach(t => {
    worksheet.addRow({
      id: t.id,
      type: t.type === 'income' ? 'ចំណូល' : 'ចំណាយ',
      amount: t.amount,
      currency: t.currency,
      category: t.category,
      note: t.note || '',
      date: t.date.toISOString().split('T')[0],
    });
  });

  // Style headers
  worksheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateExcelExport
};
