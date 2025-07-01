import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StackBarChart = ({ startDate, endDate, article }) => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Convert to Date objects and validate
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          throw new Error('Invalid date range provided');
        }

        const url = new URL(`${BASE_URL}/charts/movement-by-code`);
        url.searchParams.append('startDate', start.toISOString().split('T')[0]);
        url.searchParams.append('endDate', end.toISOString().split('T')[0]);
        if (article) url.searchParams.append('article', article);

        console.log('[StackBarChart] Fetching from:', url.toString());
        const res = await fetch(url, { method: 'GET' }); // Explicitly set method
        if (!res.ok) {
          const errorText = await res.text();
          console.log('[StackBarChart] Error response:', errorText); // Debug error response
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const result = await res.json();
        console.log('[StackBarChart] API Response:', result);

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format from API');
        }

        const chartData = {
          labels: result.data.map(row => row.code_mouvement || 'Unknown'),
          datasets: [{
            label: 'Quantity by Movement Code',
            data: result.data.map(row => row.total_quantity || 0),
            backgroundColor: result.data.map(row =>
              ['101', '531'].includes(row.code_mouvement) ? 'rgba(54, 162, 235, 0.7)' : 'rgba(255, 99, 132, 0.7)'
            ),
            borderColor: result.data.map(row =>
              ['101', '531'].includes(row.code_mouvement) ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'
            ),
            borderWidth: 1,
          }],
        };
        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('Error fetching StackBarChart data:', error);
        setError(`Failed to load data. Please try again. Details: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, article, BASE_URL]);

  return (
    <div className="bg-white p-2 rounded-lg shadow-lg h-48 flex flex-col">
      <h2 className="text-lg font-semibold mb-1">Stock Movement by Code</h2>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <Bar
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              height: 150,
              scales: {
                x: {
                  title: { display: true, text: 'Movement Code', font: { size: 10 } },
                  ticks: { font: { size: 8 } },
                },
                y: {
                  title: { display: true, text: 'Quantity', font: { size: 10 } },
                  beginAtZero: true,
                  ticks: { font: { size: 8 } },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: ctx => {
                      const code = ctx.label;
                      const value = ctx.parsed.y;
                      const isIssue = ['201', '261'].includes(code);
                      return `Code ${code}: ${value} units ${isIssue ? '(Goods Issued)' : '(Goods Received)'}`;
                    },
                  },
                },
              },
              layout: { padding: 5 },
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StackBarChart;