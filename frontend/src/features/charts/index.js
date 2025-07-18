import React, { useState, useEffect } from 'react';
import { FaChartBar } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import Datepicker from 'react-tailwindcss-datepicker';
import LineChart from '../dashboard/components/LineChart';
import BarChart from '../dashboard/components/BarChart';
import DoughnutChart from '../dashboard/components/DoughnutChart';
import PieChart from '../dashboard/components/PieChart';
import ScatterChart from '../dashboard/components/ScatterChart';
import StackBarChart from '../dashboard/components/StackBarChart';
import DeliveryStatusChart from '../dashboard/components/DeliveryStatusChart';
import TaskCompletionChart from '../dashboard/components/TaskCompletionChart';
import StockDiscrepanciesChart from '../dashboard/components/StockDiscrepanciesChart';
import StockQualityChart from '../dashboard/components/StockQualityChart';
import DeliveryDelaysChart from '../dashboard/components/DeliveryDelaysChart';

function Charts() {
    const [dateValue, setDateValue] = useState({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
    });
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState('');
    const [error, setError] = useState(null);
    const [kpis, setKpis] = useState({
        totalStock: 0,
        totalInput: 0,
        totalOutput: 0,
        uniqueArticles: 0,
        freeStock: 0,
        qualityControlStock: 0,
        blockedStock: 0,
    });
    const [loadingKpis, setLoadingKpis] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                console.log('[Tableau de bord] Récupération des articles depuis :', `${BASE_URL}/charts/articles`);
                const res = await fetch(`${BASE_URL}/charts/articles`);
                if (!res.ok) throw new Error(`Erreur HTTP ! statut : ${res.status}`);
                const result = await res.json();
                console.log('[Tableau de bord] Données des articles :', JSON.stringify(result.data, null, 2));
                if (!result.data || !Array.isArray(result.data)) throw new Error('Données des articles invalides');
                setArticles(result.data);
                setError(null);
            } catch (err) {
                console.error('[Tableau de bord] Erreur lors de la récupération des articles :', err);
                setError('Échec du chargement des articles. Veuillez réessayer.');
            }
        };
        fetchArticles();
    }, [BASE_URL]);

    useEffect(() => {
        const fetchKpis = async () => {
            setLoadingKpis(true);
            setError(null);
            try {
                const start = dateValue.startDate?.toISOString().split('T')[0];
                const end = dateValue.endDate?.toISOString().split('T')[0];
                const [stockRes, inputRes, outputRes, uniqueRes, qualityRes] = await Promise.all([
                    fetch(`${BASE_URL}/charts/total-stock?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/total-input?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/total-output?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/unique-articles`),
                    fetch(`${BASE_URL}/charts/stock-quality?startDate=${start}&endDate=${end}`),
                ]);

                if (!stockRes.ok || !inputRes.ok || !outputRes.ok || !uniqueRes.ok || !qualityRes.ok) {
                    throw new Error(`Erreur HTTP : ${stockRes.status || inputRes.status || outputRes.status || uniqueRes.status || qualityRes.status}`);
                }

                const [stockData, inputData, outputData, uniqueData, qualityData] = await Promise.all([
                    stockRes.json(),
                    inputRes.json(),
                    outputRes.json(),
                    uniqueRes.json(),
                    qualityRes.json(),
                ]);

                console.log('[Tableau de bord] Données KPI :', { stockData, inputData, outputData, uniqueData, qualityData });
                setKpis({
                    totalStock: stockData.data || 0,
                    totalInput: inputData.data || 0,
                    totalOutput: outputData.data || 0,
                    uniqueArticles: uniqueData.data || 0,
                    freeStock: qualityData.data.free_stock || 0,
                    qualityControlStock: qualityData.data.quality_control_stock || 0,
                    blockedStock: qualityData.data.blocked_stock || 0,
                });
            } catch (err) {
                console.error('[Tableau de bord] Erreur lors de la récupération des KPI :', err);
                setError(`Échec du chargement des données KPI. Détails : ${err.message}`);
            } finally {
                setLoadingKpis(false);
            }
        };
        if (dateValue.startDate && dateValue.endDate) {
            fetchKpis();
        }
    }, [dateValue, BASE_URL]);

    const handleDatePickerValueChange = (newValue) => {
        console.log('[Tableau de bord] Date modifiée à :', newValue);
        setDateValue({
            startDate: newValue.startDate ? new Date(newValue.startDate) : null,
            endDate: newValue.endDate ? new Date(newValue.endDate) : null,
        });
    };

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                    <FaChartBar className="mr-3 text-blue-600" />
                    Tableau de bord des KPI
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Visualisez et analysez les indicateurs clés de performance
                </p>
            </div>

            {loadingKpis && (
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600 text-sm">
                        Chargement des KPI...
                    </p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-3">⚠️</div>
                            <span className="text-red-800 text-sm sm:text-base">{error}</span>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                setLoadingKpis(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200 flex items-center text-sm"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-72">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                    <Datepicker
                        containerClassName="w-full"
                        value={dateValue}
                        theme="light"
                        inputClassName="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                        popoverDirection="down"
                        toggleClassName="invisible"
                        onChange={handleDatePickerValueChange}
                        showShortcuts={true}
                        primaryColor="blue"
                        i18n="fr"
                        configs={{
                            shortcuts: {
                                today: "Aujourd'hui",
                                yesterday: "Hier",
                                past: period => `Derniers ${period} jours`,
                                currentMonth: "Ce mois-ci",
                                pastMonth: "Mois dernier",
                            },
                            footer: {
                                cancel: "Annuler",
                                apply: "Appliquer",
                            },
                        }}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
                    <select
                        value={selectedArticle}
                        onChange={(e) => setSelectedArticle(e.target.value)}
                        className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                    >
                        <option value="">Tous les articles</option>
                        {articles.map((article) => (
                            <option key={article} value={article}>{article}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!loadingKpis && !error && (
                <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Indicateurs clés</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Stock total</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.totalStock.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Entrées totales</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.totalInput.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Sorties totales</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.totalOutput.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Articles uniques</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.uniqueArticles.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Stock libre</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.freeStock.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Stock en contrôle qualité</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.qualityControlStock.toLocaleString('fr-FR')}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg shadow-sm text-center">
                            <h3 className="text-sm font-medium text-gray-600">Stock bloqué</h3>
                            <p className="text-2xl font-bold text-gray-800">{kpis.blockedStock.toLocaleString('fr-FR')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Entrées vs Sorties (Rotations)</h3>
                    <StackBarChart startDate={dateValue.startDate} endDate={dateValue.endDate} article={selectedArticle} />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Mouvements par code (Rotations)</h3>
                    <BarChart startDate={dateValue.startDate} endDate={dateValue.endDate} article={selectedArticle} />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution par division (Dimensions)</h3>
                    <DoughnutChart />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribution par type de stock (Dimensions)</h3>
                    <PieChart />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock vs Prix (Explorer)</h3>
                    <ScatterChart />
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut des livraisons (Livraison)</h3>
                    <DeliveryStatusChart />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Taux d'achèvement des tâches (Rangement)</h3>
                    <TaskCompletionChart startDate={dateValue.startDate} endDate={dateValue.endDate} />
                </div>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Écarts de stock SAP vs NX (Rotations)</h3>
                    <StockDiscrepanciesChart />
                </div>
                
            </div>
        </div>
    );
}

export default Charts;