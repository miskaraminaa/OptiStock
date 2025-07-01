import React, { useState, useEffect } from 'react';
import LineChart from './components/LineChart';
import BarChart from './components/BarChart';
import DoughnutChart from './components/DoughnutChart';
import PieChart from './components/PieChart';
import ScatterChart from './components/ScatterChart';
import StackBarChart from './components/StackBarChart';
import Datepicker from 'react-tailwindcss-datepicker';

function Charts() {
    const [dateValue, setDateValue] = useState({
        startDate: new Date('2025-01-01'), // Changed to a past range with likely data
        endDate: new Date('2025-04-31'),
    });
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState('');
    const [error, setError] = useState(null);
    const [kpis, setKpis] = useState({
        totalStock: 0,
        totalInput: 0,
        totalOutput: 0,
        uniqueArticles: 0,
    });
    const [loadingKpis, setLoadingKpis] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                console.log('[Charts] Fetching articles from:', `${BASE_URL}/charts/articles`);
                const res = await fetch(`${BASE_URL}/charts/articles`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const result = await res.json();
                console.log('[Charts] Articles data:', JSON.stringify(result.data, null, 2));
                if (!result.data || !Array.isArray(result.data)) throw new Error('Invalid article data');
                setArticles(result.data);
                setError(null);
            } catch (err) {
                console.error('[Charts] Articles fetch error:', err);
                setError('Failed to load articles. Please try again.');
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
                const [stockRes, inputRes, outputRes, uniqueRes] = await Promise.all([
                    fetch(`${BASE_URL}/charts/total-stock?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/total-input?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/total-output?startDate=${start}&endDate=${end}`),
                    fetch(`${BASE_URL}/charts/unique-articles`),
                ]);

                if (!stockRes.ok || !inputRes.ok || !outputRes.ok || !uniqueRes.ok) {
                    throw new Error(`HTTP error: ${stockRes.status || inputRes.status || outputRes.status || uniqueRes.status}`);
                }

                const [stockData, inputData, outputData, uniqueData] = await Promise.all([
                    stockRes.json(),
                    inputRes.json(),
                    outputRes.json(),
                    uniqueRes.json(),
                ]);

                console.log('[Charts] KPI Data:', { stockData, inputData, outputData, uniqueData });
                setKpis({
                    totalStock: stockData.data || 0,
                    totalInput: inputData.data || 0,
                    totalOutput: outputData.data || 0,
                    uniqueArticles: uniqueData.data || 0,
                });
            } catch (err) {
                console.error('[Charts] KPI fetch error:', err);
                setError(`Failed to load KPI data. Details: ${err.message}`);
            } finally {
                setLoadingKpis(false);
            }
        };
        if (dateValue.startDate && dateValue.endDate) {
            fetchKpis();
        }
    }, [dateValue, BASE_URL]);

    const handleDatePickerValueChange = (newValue) => {
        console.log('[Charts] Date changed to:', newValue);
        setDateValue({
            startDate: newValue.startDate ? new Date(newValue.startDate) : null,
            endDate: newValue.endDate ? new Date(newValue.endDate) : null,
        });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Data Analysis Dashboard</h2>
            <div className="mb-6 flex space-x-4 items-end">
                <Datepicker
                    containerClassName="w-72"
                    value={dateValue}
                    theme="light"
                    inputClassName="input input-bordered w-full"
                    popoverDirection="down"
                    toggleClassName="invisible"
                    onChange={handleDatePickerValueChange}
                    showShortcuts={true}
                    primaryColor="white"
                />
            </div>
            <div className="mb-4">
                {loadingKpis ? (
                    <p className="text-gray-500 text-center">Loading KPIs...</p>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-lg text-center">
                            <h3 className="text-sm font-medium text-gray-600">Total Stock</h3>
                            <p className="text-2xl font-bold">{kpis.totalStock.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg shadow-lg text-center">
                            <h3 className="text-sm font-medium text-gray-600">Total Input</h3>
                            <p className="text-2xl font-bold">{kpis.totalInput.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg shadow-lg text-center">
                            <h3 className="text-sm font-medium text-gray-600">Total Output</h3>
                            <p className="text-2xl font-bold">{kpis.totalOutput.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg shadow-lg text-center">
                            <h3 className="text-sm font-medium text-gray-600">Unique Articles</h3>
                            <p className="text-2xl font-bold">{kpis.uniqueArticles.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <StackBarChart startDate={dateValue.startDate} endDate={dateValue.endDate} article={selectedArticle} />
                <BarChart startDate={dateValue.startDate} endDate={dateValue.endDate} />
                <DoughnutChart />
                <PieChart />
                <ScatterChart />
                <LineChart startDate={dateValue.startDate} endDate={dateValue.endDate} />
            </div>
        </div>
    );
}

export default Charts;