let revenueChart = null;

async function updateRevenueChart(range = 'month') {
    try {
        const response = await fetch(`/admin/api/dashboard/revenue/${range}`);
        const data = await response.json();
        console.log(data);
        
        const chartData = formatChartData(data, range);
        console.log(chartData);
        renderChart(chartData, range);
        
        // Update active button
        document.querySelectorAll('[data-range]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === range);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function formatChartData(data, range) {
    let labels, values;
    const now = new Date();

    switch (range) {
        case 'day':
            labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            values = new Array(24).fill(0);
            data.forEach((item, index) => {
                // Assume sequential hourly revenue data for simplicity
                if (index < 24) values[index] = item.revenue;
            });
            break;

        case 'week':
            labels = ['1', '2', '3', '4', '5', '6', '7'];
            values = new Array(7).fill(0);
            data.forEach((item, index) => {
                // Assume sequential daily revenue for a week
                if (index < 7) values[index] = item.revenue;
            });
            break;

        default: // month
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
            values = new Array(daysInMonth).fill(0);
            data.forEach((item, index) => {
                // Assume sequential daily revenue for a month
                if (index < daysInMonth) values[index] = item.revenue;
            });
            break;
    }

    return { labels, values };
}


function renderChart(data, range) {
  if (revenueChart) {
      revenueChart.destroy();
  }

  const ctx = document.getElementById('statisticsChart').getContext('2d');
  revenueChart = new Chart(ctx, {
      type: 'bar', // Change to 'bar' for a bar chart
      data: {
          labels: data.labels,
          datasets: [{
              label: 'Revenue ($)',
              data: data.values,
              backgroundColor: '#1572E8',
              borderColor: '#0F4C81',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              y: {
                  beginAtZero: true,
                  ticks: {
                      callback: value => `$${value.toLocaleString()}`
                  }
              }
          },
          plugins: {
              tooltip: {
                  callbacks: {
                      label: context => `Revenue: $${context.parsed.y.toLocaleString()}`
                  }
              }
          }
      }
  });
}

document.addEventListener('DOMContentLoaded', () => {
    updateRevenueChart('month');
    
    document.querySelectorAll('[data-range]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const range = e.target.dataset.range;
            updateRevenueChart(range);
        });
    });
});