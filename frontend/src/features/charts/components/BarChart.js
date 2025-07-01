import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const BarChart = ({ startDate, endDate, article }) => {
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

        const url = new URL(`${BASE_URL}/charts/input-vs-output`);
        url.searchParams.append('startDate', formattedStartDate);
        url.searchParams.append('endDate', formattedEndDate);
        if (article) {
          url.searchParams.append('article', article);
        }

        console.log('[BarChart] Fetching:', url.toString());

        const res = await fetch(url.toString());

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const result = await res.json();
        console.log('[BarChart] Raw API response:', result);

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from API');
        }

        if (result.data.length === 0) {
          setData({
            labels: [],
            datasets: [
              {
                label: 'Input (Receipts)',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
              },
              {
                label: 'Output (Issues)',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
              },
            ]
          });
          setError('No data available for the selected date range');
          return;
        }

        const processedData = result.data.map(row => {
          let formattedDate = 'Unknown';
          if (row.date) {
            try {
              const parsedDate = new Date(row.date);
              formattedDate = !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : row.date;
            } catch (e) {
              console.warn('[BarChart] Date formatting error:', e);
              formattedDate = String(row.date);
            }
          }
          return {
            date: formattedDate,
            input_quantity: parseFloat(row.input_quantity) || 0,
            output_quantity: parseFloat(row.output_quantity) || 0
          };
        });

        const chartData = {
          labels: processedData.map(row => row.date),
          datasets: [
            {
              label: 'Input (Receipts)',
              data: processedData.map(row => row.input_quantity),
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Output (Issues)',
              data: processedData.map(row => row.output_quantity),
              backgroundColor: 'rgba(255, 99, 132, 0.7)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        };

        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('[BarChart] Fetch error:', error);
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
    <div className="bg-white p-2 rounded-lg shadow-lg h-48 flex flex-col"> {/* Adjusted to h-48, reduced padding */}
      <h2 className="text-lg font-semibold mb-1 flex-shrink-0"> {/* Reduced margin */}
        Input vs Output Quantities
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
      ) : data.labels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <Bar
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
                  position: 'bottom', // Moved to bottom for consistency
                  labels: {
                    boxWidth: 8, // Reduced for consistency
                    font: { size: 10 }, // Reduced font size
                    padding: 5 // Reduced padding
                  }
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const suffix = ctx.dataset.label.includes('Output') ? ' (Goods Issued)' : ' (Goods Received)';
                      return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} units${suffix}`;
                    },
                  },
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

export default BarChart;