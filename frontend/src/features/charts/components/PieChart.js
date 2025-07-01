import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/charts/type-stock-distribution`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        const chartData = {
          labels: result.data.map(row => row.type_stock || 'Unknown'),
          datasets: [{
            data: result.data.map(row => row.article_count || 0),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
            borderWidth: 1,
          }],
        };
        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('Error fetching PieChart data:', error);
        setError('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, [BASE_URL]);

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg h-80 flex flex-col">
      <h2 className="text-lg font-semibold mb-2 flex-shrink-0">Article Distribution by Stock Type</h2>
      {error ? (
        <p className="text-red-500 flex-1 flex items-center justify-center">{error}</p>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <Pie
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                  labels: {
                    boxWidth: 12,
                    font: { size: 11 },
                    padding: 8,
                    usePointStyle: true,
                  },
                  maxWidth: 120,
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.parsed} articles`
                  }
                },
              },
              layout: {
                padding: 10,
              },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PieChart;