import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { FaSearch, FaRedo, FaMapMarkerAlt, FaBoxes, FaWarehouse, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { setPageTitle } from '../../features/common/headerSlice';
import debounce from 'lodash/debounce';

// Centralized data validation
const validateRangementLEData = (data) =>
    data.map((item) => ({
        article_code: item.article_code || 'N/A',
        description: item.description || 'N/A',
        emplacement_cedant: item.emplacement_cedant || 'N/A',
        emplacement_prenant: item.emplacement_prenant || 'N/A',
        final_location: item.final_location || 'N/A',
        suitable_location: item.suitable_location || 'N/A',
        Storage_Location: item.Storage_Location || 'N/A',
        Storage_location_Validé: item.Storage_location_Validé || 'N/A',
        BIN_SAP: item.BIN_SAP || 'N/A',
        quantity_ewm: item.quantity_ewm != null ? Number(item.quantity_ewm).toFixed(3) : 'N/A',
        quantity_controlled: item.quantity_controlled != null ? Number(item.quantity_controlled).toFixed(3) : 'N/A',
        quantity_iam: item.quantity_iam != null ? Number(item.quantity_iam).toFixed(3) : 'N/A',
        unit: item.unit || 'N/A',
        LE: item.LE || 'N/A',
        LS: item.LS || 'N/A',
    }));

const RangementLE = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const limit = 25; // Consistent with Rotations
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        dispatch(setPageTitle({ title: 'Guide de Rangement LE' }));
    }, [dispatch]);

    const fetchData = useCallback(
        async (page, search, retryCount = 0) => {
            const maxRetries = 3;
            const timeoutDuration = 120000;
            setLoading(true);
            setError(null);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
                const response = await fetch(
                    `${API_URL}/rangement-le?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
                    { signal: controller.signal, headers: { 'Content-Type': 'application/json' } }
                );
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const result = await response.json();
                if (!result.data || !Array.isArray(result.data)) throw new Error('Invalid data format');
                setData(validateRangementLEData(result.data));
                setTotalRecords(result.totalRecords || result.data.length);
                setTotalPages(result.totalPages || Math.ceil(result.totalRecords / limit));
            } catch (err) {
                if (err.name === 'AbortError' && retryCount < maxRetries) {
                    setTimeout(() => fetchData(page, search, retryCount + 1), 1000 * (retryCount + 1));
                    return;
                }
                setError(`Erreur lors du chargement des données: ${err.message}`);
            } finally {
                setLoading(false);
            }
        },
        [limit, API_URL]
    );

    const debouncedFetchData = useMemo(() => debounce(fetchData, 300), [fetchData]);

    useEffect(() => {
        debouncedFetchData(page, searchTerm);
        return () => debouncedFetchData.cancel();
    }, [page, searchTerm, debouncedFetchData]);

    const handleSearch = useCallback((e) => {
        setSearchTerm(e.target.value.trim());
        setPage(1);
    }, []);

    const handleRetry = () => {
        setData([]);
        setPage(1);
        setError(null);
        fetchData(page, searchTerm);
    };

    const handleResetCache = async () => {
        try {
            const response = await fetch(`${API_URL}/rangement-le/reset-cache`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reset cache');
            setData([]);
            setPage(1);
            setError(null);
            fetchData(page, searchTerm);
        } catch (err) {
            setError('Erreur lors de la réinitialisation du cache');
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return [...data];
        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key] === 'N/A' ? '' : a[sortConfig.key];
            const bValue = b[sortConfig.key] === 'N/A' ? '' : b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const getLocationStatus = (final, suitable) => {
        if (final === 'N/A' && suitable === 'N/A') return { status: 'unknown', color: 'bg-gray-100 text-gray-600' };
        if (final !== 'N/A' && suitable !== 'N/A' && final === suitable) return { status: 'correct', color: 'bg-green-100 text-green-600' };
        if (final !== 'N/A' && suitable !== 'N/A' && final !== suitable) return { status: 'incorrect', color: 'bg-red-100 text-red-600' };
        return { status: 'pending', color: 'bg-yellow-100 text-yellow-600' };
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) pages.push('...');
            }
            for (let i = startPage; i <= endPage; i++) pages.push(i);
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                    <FaWarehouse className="mr-3 text-blue-600" />
                    Guide de Rangement LE
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Suivi des emplacements historiques et recommandations de rangement
                </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative w-full sm:flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        onChange={handleSearch}
                        placeholder="Rechercher par code article ou désignation"
                        value={searchTerm}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                        aria-label="Rechercher par code article ou désignation"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                        <FaBoxes className="mr-1" />
                        {totalRecords.toLocaleString()} articles
                    </span>
                    <span className="text-gray-400">Page {page} / {totalPages}</span>
                    <button
                        onClick={handleResetCache}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition duration-200 flex items-center text-sm"
                        aria-label="Réinitialiser le cache"
                    >
                        <FaRedo className="mr-2" /> Réinitialiser Cache
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600">Chargement des données...</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Page {page} sur {totalPages} - {limit} articles par page
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
                            onClick={handleRetry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 flex items-center text-sm"
                            aria-label="Réessayer le chargement des données"
                        >
                            <FaRedo className="mr-2" /> Réessayer
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && sortedData.length === 0 && (
                <div className="text-center py-12">
                    <FaBoxes className="mx-auto text-gray-300 text-5xl mb-4" />
                    <p className="text-gray-500 text-lg">Aucune donnée disponible</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Vérifiez la configuration des données ou essayez une autre recherche
                    </p>
                </div>
            )}

            {!loading && !error && sortedData.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr className="text-gray-700 text-sm">
                                    {[
                                        { key: 'article_code', label: 'Code Article' },
                                        { key: 'description', label: 'Désignation' },
                                        { key: 'emplacement_cedant', label: 'Emplacement Cédant' },
                                        { key: 'emplacement_prenant', label: 'Emplacement Prenant' },
                                        { key: 'final_location', label: 'Emplacement Final' },
                                        { key: 'suitable_location', label: 'Emplacement Convenable' },
                                        { key: 'Storage_Location', label: 'Storage Location' },
                                        { key: 'Storage_location_Validé', label: 'Storage Location Validé' },
                                        { key: 'BIN_SAP', label: 'BIN SAP' },
                                        { key: 'quantity_ewm', label: 'Quantité EWM' },
                                        { key: 'quantity_controlled', label: 'Quantité Contrôlée' },
                                        { key: 'quantity_iam', label: 'Quantité IAM' },
                                        { key: 'unit', label: 'Unité' },
                                        { key: 'LE', label: 'LE' },
                                        { key: 'LS', label: 'LS' },
                                    ].map(({ key, label }) => (
                                        <th
                                            key={key}
                                            className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                            onClick={() => handleSort(key)}
                                            role="button"
                                            aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                            scope="col"
                                        >
                                            {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedData.map((row, index) => {
                                    const locationStatus = getLocationStatus(row.final_location, row.suitable_location);
                                    return (
                                        <tr key={`${row.article_code}-${index}`} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-4 py-3 text-gray-900 font-medium text-sm">{row.article_code}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[16rem]">
                                                <div className="truncate" title={row.description}>{row.description}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[16rem] whitespace-pre-wrap">{row.emplacement_cedant}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[16rem] whitespace-pre-wrap">{row.emplacement_prenant}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">
                                                <div className="flex items-center">
                                                    <FaMapMarkerAlt className="mr-1 text-blue-500" />
                                                    {row.final_location}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${locationStatus.color.split(' ')[0]}`}></div>
                                                    {row.suitable_location}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm whitespace-pre-wrap">{row.Storage_Location}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.Storage_location_Validé}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.BIN_SAP}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm font-medium">{row.quantity_ewm}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm font-medium">{row.quantity_controlled}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm font-medium">{row.quantity_iam}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.unit}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.LE}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.LS}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                        aria-label="Page précédente"
                    >
                        <FaChevronLeft className="mr-2" /> Précédent
                    </button>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {getPageNumbers().map((pageNum, index) => (
                            <button
                                key={index}
                                onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
                                disabled={pageNum === '...' || pageNum === page}
                                className={`px-3 py-1 rounded-md text-sm transition duration-200 ${pageNum === page
                                        ? 'bg-blue-600 text-white'
                                        : pageNum === '...' ? 'text-gray-400 cursor-default' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                aria-label={pageNum === '...' ? 'Ellipsis' : `Page ${pageNum}`}
                                aria-current={pageNum === page ? 'page' : undefined}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                        aria-label="Page suivante"
                    >
                        Suivant <FaChevronRight className="ml-2" />
                    </button>
                </div>
            )}

            {!loading && sortedData.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Affichage {(page - 1) * limit + 1} à {Math.min(page * limit, totalRecords)} sur {totalRecords.toLocaleString()} articles
                </div>
            )}
        </div>
    );
};

export default RangementLE;