import React, { useState, useEffect } from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, PointElement, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(PointElement, LinearScale, Tooltip, Legend);

const ScatterChart = () => {
  const [data, setData] = useState({ datasets: [] });
  const [error, setError] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE_URL}/charts/stock-vs-price`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        const chartData = {
          datasets: [{
            label: 'Stock vs Price',
            data: result.data.map(row => ({ x: row.quantite, y: row.prix })),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            pointRadius: 5,
          }],
        };
        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('Error fetching ScatterChart data:', error);
        setError('Failed to load data. Please try again.');
      }
    };
    fetchData();
  }, [BASE_URL]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg h-80">
      <h2 className="text-lg font-semibold mb-2">Stock vs Price</h2>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <Scatter
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { title: { display: true, text: 'Quantity' }, beginAtZero: true },
              y: { title: { display: true, text: 'Price' }, beginAtZero: true },
            },
            plugins: {
              legend: { position: 'top', labels: { boxWidth: 10, font: { size: 12 } } },
              tooltip: { callbacks: { label: ctx => `Quantity: ${ctx.raw.x}, Price: ${ctx.raw.y}` } },
            },
          }}
        />
      )}
    </div>
  );
};

export default ScatterChart;