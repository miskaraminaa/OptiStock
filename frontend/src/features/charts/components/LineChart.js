import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const LineChart = ({ startDate, endDate, article }) => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const formatDate = (date) => {
          if (!date) return null;
          if (typeof date === 'string') return date;
          return date.toISOString().split('T')[0];
        };

        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        if (!formattedStartDate || !formattedEndDate) {
          throw new Error('Invalid date range provided');
        }

        const url = new URL(`${BASE_URL}/charts/stock-over-time`);
        url.searchParams.append('startDate', formattedStartDate);
        url.searchParams.append('endDate', formattedEndDate);
        if (article) {
          url.searchParams.append('article', article);
        }

        console.log('Fetching data from:', url.toString());

        const res = await fetch(url.toString());

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const result = await res.json();
        console.log('API Response:', result);

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from API');
        }

        if (result.data.length === 0) {
          setData({
            labels: [],
            datasets: [{
              label: 'Stock Quantity',
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
              tension: 0.1,
            }]
          });
          setError('No data available for the selected date range');
          return;
        }

        const processedData = result.data.map(row => ({
          date: new Date(row.date).toLocaleDateString(),
          total_quantity: parseFloat(row.total_quantity) || 0
        }));

        const chartData = {
          labels: processedData.map(row => row.date),
          datasets: [{
            label: article ? `Stock for ${article}` : 'Total Stock Quantity',
            data: processedData.map(row => row.total_quantity),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        };

        setData(chartData);
        setError(null);

      } catch (error) {
        console.error('Error fetching LineChart data:', error);
        setError(`Failed to load data: ${error.message}`);
        setData({ labels: [], datasets: [] });
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchData();
    } else {
      setError('Please provide valid start and end dates');
      setLoading(false);
    }
  }, [startDate, endDate, article, BASE_URL]);

  return (
    <div className="bg-white p-2 rounded-lg shadow-lg h-80 flex flex-col"> {/* Adjusted to h-48 for consistency */}
      <h2 className="text-lg font-semibold mb-1 flex-shrink-0"> {/* Reduced margin */}
        Stock Levels Over Time
        {article && <span className="text-sm text-gray-600 ml-2">({article})</span>}
      </h2>
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
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              height: 150, // Fixed height to match other charts
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                    font: { size: 10 } // Reduced font size
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 8 } // Reduced font size
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Quantity',
                    font: { size: 10 } // Reduced font size
                  },
                  beginAtZero: true,
                  ticks: {
                    font: { size: 8 } // Reduced font size
                  }
                },
              },
              plugins: {
                legend: {
                  position: 'bottom', // Moved to bottom for consistency with latest DoughnutChart
                  labels: {
                    boxWidth: 8, // Reduced for consistency
                    font: { size: 10 }, // Reduced font size
                    padding: 5 // Reduced padding
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} units`
                  }
                },
              },
              interaction: {
                intersect: false,
                mode: 'index'
              },
              layout: {
                padding: 5 // Reduced padding for consistency
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LineChart;