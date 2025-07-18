import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ClipLoader } from 'react-spinners';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DeliveryDelaysChart = ({ startDate, endDate }) => {
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
                const res = await fetch(`${BASE_URL}/charts/delivery-delays?startDate=${start}&endDate=${end}`);
                if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
                const result = await res.json();
                if (!result.data) throw new Error('Données invalides');

                const chartData = {
                    labels: result.data.map(row => `Doc ${row.document}`),
                    datasets: [{
                        label: 'Retards de livraison',
                        data: result.data.map(row => row.delay_days),
                        backgroundColor: '#e74c3c',
                        borderColor: '#e74c3c',
                        borderWidth: 1,
                    }],
                };
                setData(chartData);
                setError(null);
            } catch (error) {
                console.error('[DeliveryDelaysChart] Erreur:', error);
                setError(`Échec du chargement : ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        if (startDate && endDate) {
            fetchData();
        }
    }, [startDate, endDate, BASE_URL]);

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
                                    label: context => `${context.label}: ${context.raw.toLocaleString('fr-FR')} jours`,
                                },
                            },
                        },
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: 'Retard (jours)' } },
                            x: { title: { display: true, text: 'Document' }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
                        },
                    }}
                />
            )}
        </div>
    );
};

export default DeliveryDelaysChart;