const { Telegraf } = require('telegraf');
const config = require('../config/env');
const { ensureUser } = require('../controllers/userController');
const { addTransaction, getBalance } = require('../controllers/transactionController');
const { setBudget, checkBudgetAlert } = require('../controllers/budgetController');
const { getTodayReport, getWeekReport, getMonthReport } = require('../services/reportService');
const { generateExpenseChart } = require('../services/chartService');
const { generateExcelExport } = require('../services/exportService');
const { addReminder } = require('../controllers/reminderController');
// Note: We use dynamic require for cronService to avoid circular dependency
let cronService;

if (!config.BOT_TOKEN) {
  throw new Error('BOT_TOKEN must be provided!');
}

const bot = new Telegraf(config.BOT_TOKEN);

// Basic commands
bot.start(async (ctx) => {
  try {
    await ensureUser(ctx.from);
    ctx.reply('សួស្តី! 👋 ខ្ញុំគឺជា Bot សម្រាប់គ្រប់គ្រងចំណូល-ចំណាយប្រចាំថ្ងៃរបស់អ្នក។\n\nសូមវាយ /help ដើម្បីមើលបញ្ជា (commands) ទាំងអស់។');
  } catch (error) {
    ctx.reply('សុំទោស មានបញ្ហាខ្លះកើតឡើងពេលចុះឈ្មោះអ្នក។');
  }
});

bot.help((ctx) => {
  const helpText = `
**បញ្ជាសម្រាប់ប្រើប្រាស់ (Commands)**

💰 **ចំណូល-ចំណាយ**
/income <ចំនួន> <ប្រភេទ> <ចំណាំ> - កត់ត្រាចំណូល
/expense <ចំនួន> <ប្រភេទ> <ចំណាំ> - កត់ត្រាចំណាយ

📊 **របាយការណ៍**
/today - របាយការណ៍ថ្ងៃនេះ
/week - របាយការណ៍សប្តាហ៍នេះ
/month - របាយការណ៍ខែនេះ
/balance - សមតុល្យសរុប
/report <ខែ> <ឆ្នាំ> - របាយការណ៍តាមខែ

🎯 **ថវិកា & ការរំលឹក**
/setbudget <ប្រភេទ> <ចំនួន> - កំណត់ថវិកា
/remind <ពេល> <សារ> - កំណត់ការរំលឹក

📁 **ផ្សេងៗ**
/history - មើលប្រវត្តិប្រតិបត្តិការ
/export - ទាញយកទិន្នន័យ (Excel)
`;
  ctx.replyWithMarkdown(helpText);
});

// Helper function to parse transaction command
const parseTransactionArgs = (text) => {
  const parts = text.split(' ').slice(1);
  if (parts.length < 2) return null;
  
  let amountStr = parts[0].toUpperCase();
  let currency = 'USD';
  
  if (amountStr.endsWith('R') || amountStr.endsWith('KHR')) {
    currency = 'KHR';
    amountStr = amountStr.replace(/R|KHR/g, '');
  } else if (amountStr.endsWith('$') || amountStr.endsWith('USD')) {
    currency = 'USD';
    amountStr = amountStr.replace(/\$|USD/g, '');
  }
  
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return null;
  
  const category = parts[1];
  const note = parts.slice(2).join(' ') || '';
  
  return { amount, currency, category, note };
};

bot.command('income', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const args = parseTransactionArgs(ctx.message.text);
    
    if (!args) {
      return ctx.reply('⚠️ ទម្រង់មិនត្រឹមត្រូវ។ សូមប្រើ៖ /income <ចំនួន> <ប្រភេទ> <ចំណាំ>\nឧទាហរណ៍៖ /income 500$ ប្រាក់ខែ ខែសីហា');
    }
    
    await addTransaction(user.id, 'income', args.amount, args.currency, args.category, args.note);
    ctx.reply(`✅ បានកត់ត្រាចំណូល: 💰 ${args.amount} ${args.currency} (${args.category})`);
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការកត់ត្រាចំណូល។');
  }
});

bot.command('expense', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const args = parseTransactionArgs(ctx.message.text);
    
    if (!args) {
      return ctx.reply('⚠️ ទម្រង់មិនត្រឹមត្រូវ។ សូមប្រើ៖ /expense <ចំនួន> <ប្រភេទ> <ចំណាំ>\nឧទាហរណ៍៖ /expense 15000R អាហារ អាហារថ្ងៃត្រង់');
    }
    
    await addTransaction(user.id, 'expense', args.amount, args.currency, args.category, args.note);
    ctx.reply(`✅ បានកត់ត្រាចំណាយ: 💸 ${args.amount} ${args.currency} (${args.category})`);
    
    // Check Budget
    const alert = await checkBudgetAlert(user.id, args.category, args.amount, args.currency);
    if (alert) {
      if (alert.status === 'exceeded') {
        ctx.reply(`🚨 **ប្រយ័ត្ន!** ការចំណាយរបស់អ្នកលើ "${args.category}" បានលើសថវិកាកំណត់ហើយ!\nចំណាយបច្ចុប្បន្ន: $${alert.currentTotal.toFixed(2)} / ថវិកា: $${alert.limit.toFixed(2)}`, { parse_mode: 'Markdown' });
      } else if (alert.status === 'warning') {
        ctx.reply(`⚠️ **ចំណាំ!** ការចំណាយរបស់អ្នកលើ "${args.category}" ជិតដល់កម្រិតថវិកាហើយ (80%+)\nចំណាយបច្ចុប្បន្ន: $${alert.currentTotal.toFixed(2)} / ថវិកា: $${alert.limit.toFixed(2)}`, { parse_mode: 'Markdown' });
      }
    }
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការកត់ត្រាចំណាយ។');
  }
});

bot.command('setbudget', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const args = parseTransactionArgs(ctx.message.text);
    
    if (!args) {
      return ctx.reply('⚠️ ទម្រង់មិនត្រឹមត្រូវ។ សូមប្រើ៖ /setbudget <ចំនួន> <ប្រភេទ>\nឧទាហរណ៍៖ /setbudget 200$ អាហារ');
    }
    
    // Convert to USD for budget storage if KHR is given
    let budgetUSD = args.amount;
    if (args.currency === 'KHR') budgetUSD = args.amount / 4000;

    await setBudget(user.id, budgetUSD, args.category);
    ctx.reply(`🎯 បានកំណត់ថវិកាសម្រាប់ "${args.category}" ចំនួន $${budgetUSD.toFixed(2)} ក្នុងខែនេះ។`);
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការកំណត់ថវិកា។');
  }
});

bot.command('balance', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const balance = await getBalance(user.id);
    
    ctx.reply(`⚖️ **សមតុល្យបច្ចុប្បន្នរបស់អ្នក៖**\n\n💵 USD: $${balance.USD.toFixed(2)}\n៛ KHR: ${balance.KHR.toLocaleString()} រៀល`, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការទាញយកសមតុល្យ។');
  }
});

const formatReportMessage = (title, report) => {
  return `📊 **${title}**\n\n` +
         `ចំណូលសរុប៖\n💵 $${report.incomeUSD.toFixed(2)}\n៛ ${report.incomeKHR.toLocaleString()}\n\n` +
         `ចំណាយសរុប៖\n💵 $${report.expenseUSD.toFixed(2)}\n៛ ${report.expenseKHR.toLocaleString()}\n\n` +
         `ចំនួនប្រតិបត្តិការ៖ ${report.transactions.length}`;
};

bot.command('today', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const report = await getTodayReport(user.id);
    ctx.reply(formatReportMessage('របាយការណ៍ថ្ងៃនេះ', report), { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការទាញយកររបាយការណ៍។');
  }
});

bot.command('week', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const report = await getWeekReport(user.id);
    ctx.reply(formatReportMessage('របាយការណ៍សប្តាហ៍នេះ', report), { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ មានបញ្ហាក្នុងការទាញយកររបាយការណ៍។');
  }
});

bot.command('month', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const report = await getMonthReport(user.id);
    const text = formatReportMessage('របាយការណ៍ខែនេះ', report);
    
    const chartBuffer = await generateExpenseChart(report.transactions);
    
    if (chartBuffer) {
      await ctx.replyWithPhoto({ source: chartBuffer }, { caption: text, parse_mode: 'Markdown' });
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error(error);
    ctx.reply('❌ មានបញ្ហាក្នុងការទាញយកររបាយការណ៍។');
  }
});

bot.command('export', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    ctx.reply('⏳ កំពុងរៀបចំឯកសារទិន្នន័យរបស់អ្នក...');
    
    const buffer = await generateExcelExport(user.id);
    
    await ctx.replyWithDocument({
      source: buffer,
      filename: `Finance_Export_${user.id}_${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    console.error(error);
    ctx.reply('❌ មានបញ្ហាក្នុងការទាញយកទិន្នន័យ។');
  }
});

bot.command('remind', async (ctx) => {
  try {
    const user = await ensureUser(ctx.from);
    const parts = ctx.message.text.split(' ').slice(1);
    
    if (parts.length < 2) {
      return ctx.reply('⚠️ ទម្រង់មិនត្រឹមត្រូវ។ សូមប្រើ៖ /remind HH:mm <សារ>\nឧទាហរណ៍៖ /remind 08:30 បង់ថ្លៃភ្លើង');
    }
    
    const timeStr = parts[0];
    const message = parts.slice(1).join(' ');
    
    // Parse HH:mm
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 2) {
      return ctx.reply('⚠️ ម៉ោងត្រូវស្ថិតក្នុងទម្រង់ HH:mm (ឧទាហរណ៍ 08:30)');
    }
    
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return ctx.reply('⚠️ ម៉ោងមិនត្រឹមត្រូវ។');
    }
    
    const cronTime = `${minute} ${hour} * * *`;
    
    const reminder = await addReminder(user.id, cronTime, message);
    
    if (!cronService) {
      cronService = require('../services/cronService');
    }
    cronService.scheduleReminder(reminder);
    
    ctx.reply(`✅ បានកំណត់ការរំលឹក: "${message}" ជារៀងរាល់ថ្ងៃម៉ោង ${timeStr}`);
  } catch (error) {
    console.error(error);
    ctx.reply('❌ មានបញ្ហាក្នុងការកំណត់ការរំលឹក។');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
  ctx.reply('សុំទោស មានបញ្ហាខ្លះកើតឡើង។ សូមព្យាយាមម្តងទៀត។ 😥');
});

module.exports = bot;
