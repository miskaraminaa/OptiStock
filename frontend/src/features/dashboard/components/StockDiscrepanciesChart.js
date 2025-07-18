import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ClipLoader } from 'react-spinners';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StockDiscrepanciesChart = () => {
    const [data, setData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${BASE_URL}/charts/stock-discrepancies`);
                if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
                const result = await res.json();
                if (!result.data) throw new Error('Données invalides');

                const chartData = {
                    labels: result.data.map(row => row.article),
                    datasets: [{
                        label: 'Écart de stock (SAP - NX)',
                        data: result.data.map(row => row.discrepancy),
                        backgroundColor: '#e74c3c',
                        borderColor: '#e74c3c',
                        borderWidth: 1,
                    }],
                };
                setData(chartData);
                setError(null);
            } catch (error) {
                console.error('[StockDiscrepanciesChart] Erreur:', error);
                setError(`Échec du chargement : ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [BASE_URL]);

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
                <Bar
                    data={data}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { size: 12 } } },
                            tooltip: {
                                callbacks: {
                                    label: context => `${context.label}: ${context.raw.toLocaleString('fr-FR')} unités`,
                                },
                            },
                        },
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Écart (unités)' } },
                            x: { title: { display: true, text: 'Article' }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
                        },
                    }}
                />
            )}
        </div>
    );
};

export default StockDiscrepanciesChart;