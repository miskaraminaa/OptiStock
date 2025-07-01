import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = () => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/charts/division-distribution`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        if (!result.data || !Array.isArray(result.data)) throw new Error('Invalid data format');
        const chartData = {
          labels: result.data.map(row => row.division || 'Unknown'),
          datasets: [{
            data: result.data.map(row => row.article_count || 0),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
            borderWidth: 1,
          }],
        };
        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('Error fetching DoughnutChart data:', error);
        setError('Failed to load data. Please check the API server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [BASE_URL]);

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg h-80 flex flex-col">
      <h2 className="text-lg font-semibold mb-2 flex-shrink-0">Article Distribution by Division</h2>
      {loading ? (
        <p className="text-gray-500 flex-1 flex items-center justify-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 flex-1 flex items-center justify-center">{error}</p>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <Doughnut
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 10,
                    font: { size: 10 },
                    padding: 6,
                    usePointStyle: true,
                  },
                  maxHeight: 60,
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.label}: ${ctx.parsed} articles`
                  }
                },
              },
              layout: {
                padding: {
                  top: 10,
                  bottom: 5,
                  left: 10,
                  right: 10,
                },
              },
              cutout: '60%',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DoughnutChart;