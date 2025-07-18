import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux'; // Added for dispatch
import { FaSearch, FaChevronLeft, FaChevronRight, FaBoxes } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { setPageTitle } from '../../features/common/headerSlice';

// Centralized data validation function
const validateKpiData = (data) => {
    return data.map((item) => ({
        id: item.id || 'N/A',
        totalExits: item.totalExits === 'Aucune Sortie' ? 0 : Number(item.totalExits) || 0,
        averageStock: item.averageStock === 'Aucune Donnée de Stock' ? 0 : Number(item.averageStock) || 0,
        turnoverRate: item.turnoverRate === 'Non Calculé' || item.turnoverRate === 'Aucune Sortie' ? 0 : Number(item.turnoverRate) || 0,
        stockoutTasks: item.stockoutTasks === 'Aucune Tâche de Prélèvement' ? 0 : Number(item.stockoutTasks) || 0,
        totalPickupTasks: item.totalPickupTasks === 'Aucune Tâche de Prélèvement' ? 0 : Number(item.totalPickupTasks) || 0,
        stockoutRate: item.stockoutRate === 'Non Calculé' || item.stockoutRate === 'Aucune Rupture de Stock' ? 0 : Number(item.stockoutRate) || 0,
    }));
};

const Rotations = () => {
    const dispatch = useDispatch(); // Initialize dispatch
    const [tableData, setTableData] = useState([]);
    const [filter, setFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [turnoverFilter, setTurnoverFilter] = useState('all');
    const [stockoutFilter, setStockoutFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2025');
    const [yearError, setYearError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Use environment variable for API URL
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        dispatch(setPageTitle({ title: 'KPI du stock' }));
    }, [dispatch]);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedYear) {
                setYearError('Veuillez sélectionner une année.');
                setLoading(false);
                return;
            }
            setYearError(null);
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/rotation/kpi?years=${selectedYear}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch KPI data');
                }
                let data;
                try {
                    data = await response.json();
                } catch (jsonError) {
                    throw new Error('Invalid JSON response from server');
                }
                const validatedData = validateKpiData(data);
                setTableData(validatedData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedYear, API_URL]);

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        setCurrentPage(1);
    };

    const handleTurnoverFilterChange = (e) => {
        setTurnoverFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleStockoutFilterChange = (e) => {
        setStockoutFilter(e.target.value);
        setCurrentPage(1);
    };

    const availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

    // Memoized filtering
    const filteredData = useMemo(() => {
        return tableData.filter(
            (item) =>
                item.id.includes(filter) &&
                (turnoverFilter === 'all' ||
                    (turnoverFilter === 'high' && item.turnoverRate > 1) ||
                    (turnoverFilter === 'low' && item.turnoverRate < 1)) &&
                (stockoutFilter === 'all' ||
                    (stockoutFilter === 'high' && item.stockoutRate > 10) ||
                    (stockoutFilter === 'low' && item.stockoutRate < 10))
        );
    }, [tableData, filter, turnoverFilter, stockoutFilter]);

    // Memoized sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) {
            return [...filteredData].sort((a, b) => {
                const aHasValues = a.turnoverRate > 0 && a.stockoutRate > 0 ? 1 : 0;
                const bHasValues = b.turnoverRate > 0 && b.stockoutRate > 0 ? 1 : 0;
                if (aHasValues !== bHasValues) {
                    return bHasValues - aHasValues;
                }
                return b.turnoverRate - a.turnoverRate;
            });
        }
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key] === 'Aucune Donnée' ? 0 : a[sortConfig.key];
            const bValue = b[sortConfig.key] === 'Aucune Donnée' ? 0 : b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    // Pagination page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600">Chargement des données...</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Page {currentPage} sur {totalPages}
                    </p>
                </div>
            </div>
        );
    }

    if (error || yearError) {
        return (
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-3">⚠️</div>
                            <span className="text-red-800 text-sm sm:text-base">{error || yearError}</span>
                        </div>
                        <button
                            onClick={() => {
                                setError(null);
                                setYearError(null);
                                setCurrentPage(1);
                                // Re-run useEffect by changing selectedYear or triggering fetch
                                setSelectedYear((prev) => prev);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 text-sm"
                            aria-label="Réessayer le chargement des données"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                    <FaBoxes className="mr-3 text-blue-600" />
                    KPI des Stocks par Article
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Analyse des taux de rotation et de rupture de stock
                </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative w-full sm:flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Filtrer par ID d'article..."
                        value={filter}
                        onChange={handleFilterChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                        aria-label="Filtrer les articles par ID"
                    />
                </div>
                <select
                    value={turnoverFilter}
                    onChange={handleTurnoverFilterChange}
                    className="w-full sm:w-48 border border-gray-300 rounded-lg p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                    aria-label="Filtrer par taux de rotation"
                >
                    <option value="all">Tous les taux de rotation</option>
                    <option value="high">Taux de rotation &gt; 1</option>
                    <option value="low">Taux de rotation &lt; 1</option>
                </select>
                <select
                    value={stockoutFilter}
                    onChange={handleStockoutFilterChange}
                    className="w-full sm:w-48 border border-gray-300 rounded-lg p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                    aria-label="Filtrer par taux de rupture"
                >
                    <option value="all">Tous les taux de rupture</option>
                    <option value="high">Taux de rupture &gt; 10%</option>
                    <option value="low">Taux de rupture &lt; 10%</option>
                </select>
                <select
                    value={selectedYear}
                    onChange={handleYearChange}
                    className="w-full sm:w-32 border border-gray-300 rounded-lg p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                    aria-label="Sélectionner l'année"
                >
                    <option value="">Sélectionner une année</option>
                    {availableYears.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50">
                            <tr className="text-gray-700 text-sm">
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('id')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'id' ? sortConfig.direction : 'none'}
                                >
                                    Article {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('totalExits')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'totalExits' ? sortConfig.direction : 'none'}
                                >
                                    Total Sorties {sortConfig.key === 'totalExits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('averageStock')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'averageStock' ? sortConfig.direction : 'none'}
                                >
                                    Stock Moyen {sortConfig.key === 'averageStock' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('turnoverRate')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'turnoverRate' ? sortConfig.direction : 'none'}
                                >
                                    Taux de Rotation {sortConfig.key === 'turnoverRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('stockoutTasks')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'stockoutTasks' ? sortConfig.direction : 'none'}
                                >
                                    Tâches de Rupture {sortConfig.key === 'stockoutTasks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('totalPickupTasks')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'totalPickupTasks' ? sortConfig.direction : 'none'}
                                >
                                    Total Tâches de Prélèvement{' '}
                                    {sortConfig.key === 'totalPickupTasks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                    onClick={() => handleSort('stockoutRate')}
                                    role="button"
                                    aria-sort={sortConfig.key === 'stockoutRate' ? sortConfig.direction : 'none'}
                                >
                                    Taux de Rupture (%) {sortConfig.key === 'stockoutRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-4 px-4 text-center text-gray-500 text-sm">
                                        Aucun article trouvé
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50 transition duration-150 ${item.turnoverRate > 1 || item.stockoutRate > 10 ? 'bg-yellow-100 text-yellow-700 font-semibold' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.id}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">
                                            {item.totalExits === 0 ? '_' : item.totalExits.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">
                                            {item.averageStock === 0 ? '_' : item.averageStock.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm flex items-center">
                                            {item.turnoverRate === 0 ? '_' : item.turnoverRate.toFixed(2)}
                                            {item.turnoverRate > 1 && (
                                                <span className="ml-2 text-yellow-600" aria-label="Alerte : taux de rotation élevé">
                                                    ⚠️
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">
                                            {item.stockoutTasks === 0 ? '_' : item.stockoutTasks}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">
                                            {item.totalPickupTasks === 0 ? '_' : item.totalPickupTasks}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm flex items-center">
                                            {item.stockoutRate === 0 ? '_' : `${item.stockoutRate.toFixed(2)}%`}
                                            {item.stockoutRate > 10 && (
                                                <span className="ml-2 text-red-600" aria-label="Alerte : taux de rupture élevé">
                                                    ⚠️
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                        aria-label="Page précédente"
                    >
                        <FaChevronLeft className="mr-2" /> Précédent
                    </button>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {getPageNumbers().map((pageNum, index) => (
                            <button
                                key={index}
                                onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                                disabled={pageNum === '...' || pageNum === currentPage}
                                className={`px-3 py-1 rounded-md text-sm transition duration-200 ${pageNum === currentPage
                                        ? 'bg-blue-600 text-white'
                                        : pageNum === '...' ? 'text-gray-400 cursor-default' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                aria-label={pageNum === '...' ? 'Ellipsis' : `Page ${pageNum}`}
                                aria-current={pageNum === currentPage ? 'page' : undefined}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                        aria-label="Page suivante"
                    >
                        Suivant <FaChevronRight className="ml-2" />
                    </button>
                </div>
            )}

            {!loading && currentItems.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedData.length)} sur{' '}
                    {sortedData.length.toLocaleString()} articles
                </div>
            )}

            <p className="mt-4 text-sm text-gray-600">
                <strong>Remarque :</strong> Les articles avec un taux de rotation supérieur à 1 ou un taux de rupture supérieur à
                10% sont en surbrillance avec une alerte.
            </p>
        </div>
    );
};

export default Rotations;