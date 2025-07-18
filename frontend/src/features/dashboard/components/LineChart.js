import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ClipLoader } from 'react-spinners';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const LineChart = ({ startDate, endDate, article }) => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const start = startDate?.toISOString().split('T')[0];
        const end = endDate?.toISOString().split('T')[0];
        const url = `${BASE_URL}/charts/stock-over-time?startDate=${start}&endDate=${end}${article ? `&article=${article}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const result = await res.json();
        if (!result.data) throw new Error('Données invalides');

        const chartData = {
          labels: result.data.map(row => new Date(row.date).toLocaleDateString('fr-FR')),
          datasets: [{
            label: 'Stock total',
            data: result.data.map(row => row.total_quantity),
            fill: false,
            borderColor: '#36b9cc',
            tension: 0.1,
          }],
        };
        setData(chartData);
        setError(null);
      } catch (error) {
        console.error('[LineChart] Erreur:', error);
        setError(`Échec du chargement : ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate, article, BASE_URL]);

  return (
    <div className="h-96">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="ml-3 text-gray-600 text-sm">Chargement...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      ) : (
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { font: { size: 12 } } },
              tooltip: {
                callbacks: {
                  label: context => `${context.dataset.label}: ${context.raw.toLocaleString('fr-FR')} unités`,
                },
              },
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Quantité (unités)' } },
              x: { title: { display: true, text: 'Date' } },
            },
          }}
        />
      )}
    </div>
  );
};

export default LineChart;