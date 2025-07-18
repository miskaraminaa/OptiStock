import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { ClipLoader } from 'react-spinners';

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
          if (typeof date === 'string') {
            const parsed = new Date(date);
            return isNaN(parsed) ? null : parsed.toISOString().split('T')[0];
          }
          return date.toISOString().split('T')[0];
        };

        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        if (!formattedStartDate || !formattedEndDate) {
          throw new Error('Plage de dates invalide fournie');
        }

        const url = new URL(`${BASE_URL}/charts/stock-over-time`);
        url.searchParams.append('startDate', formattedStartDate);
        url.searchParams.append('endDate', formattedEndDate);
        if (article) {
          url.searchParams.append('article', article);
        }

        console.log('[Graphique en ligne] Récupération des données depuis :', url.toString());

        const res = await fetch(url.toString());

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Erreur HTTP ${res.status} : ${errorText}`);
        }

        const result = await res.json();
        console.log('[Graphique en ligne] Réponse API :', result);

        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Format de données invalide reçu de l\'API');
        }

        if (result.data.length === 0) {
          setData({
            labels: [],
            datasets: [{
              label: article ? `Stock pour ${article}` : 'Quantité totale en stock',
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
              tension: 0.1,
              pointRadius: 3,
              pointHoverRadius: 5,
            }],
          });
          setError('Aucune donnée disponible pour la plage de dates sélectionnée');
          return;
        }

        const processedData = result.data.map(row => ({
          date: new Date(row.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          total_quantity: parseFloat(row.total_quantity) || 0,
        }));

        const chartData = {
          labels: processedData.map(row => row.date),
          datasets: [{
            label: article ? `Stock pour ${article}` : 'Quantité totale en stock',
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
        console.error('[Graphique en ligne] Erreur lors de la récupération des données :', error);
        setError(`Échec du chargement des données : ${error.message}`);
        setData({ labels: [], datasets: [] });
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchData();
    } else {
      setError('Veuillez fournir des dates de début et de fin valides');
      setLoading(false);
    }
  }, [startDate, endDate, article, BASE_URL]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">
        Niveaux de stock au fil du temps
        {article && <span className="text-sm text-gray-600 ml-2">({article})</span>}
      </h3>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="ml-3 text-gray-600 text-sm">Chargement...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        </div>
      ) : data.labels.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm text-center">Aucune donnée disponible pour la période sélectionnée</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                    font: { size: 12 },
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 10 },
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Quantité',
                    font: { size: 12 },
                  },
                  beginAtZero: true,
                  ticks: {
                    font: { size: 10 },
                    callback: value => value.toLocaleString('fr-FR'),
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,
                    font: { size: 12 },
                    padding: 10,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label} : ${ctx.parsed.y.toLocaleString('fr-FR')} unités`,
                  },
                },
              },
              interaction: {
                intersect: false,
                mode: 'index',
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

export default LineChart;