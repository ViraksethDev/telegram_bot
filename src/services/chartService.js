const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const width = 600;
const height = 400;
const chartCallback = (ChartJS) => {
  // Global config can go here
  ChartJS.defaults.font.family = 'Arial';
  ChartJS.defaults.color = '#333';
};

const canvasRenderService = new ChartJSNodeCanvas({ width, height, chartCallback });

const generateExpenseChart = async (transactions) => {
  // Aggregate expenses by category
  const categories = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      // Normalize currency to USD for chart (rough estimate if KHR, assuming 4000)
      let amt = parseFloat(t.amount);
      if (t.currency === 'KHR') amt = amt / 4000;
      
      if (categories[t.category]) {
        categories[t.category] += amt;
      } else {
        categories[t.category] = amt;
      }
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  if (labels.length === 0) return null;

  const configuration = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'ចំណាយ (គិតជា USD)',
        data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ],
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'របាយការណ៍ចំណាយតាមប្រភេទ',
          font: { size: 20 }
        }
      }
    }
  };

  const imageBuffer = await canvasRenderService.renderToBuffer(configuration);
  return imageBuffer;
};

module.exports = {
  generateExpenseChart
};
