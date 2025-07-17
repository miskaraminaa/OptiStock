import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaSearch, FaRedo, FaMapMarkerAlt, FaBoxes, FaWarehouse, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const RangementLE = () => {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback((page, search) => {
        setLoading(true);
        setError(null);
        console.log(`Fetching rangement LE data for page ${page}, search: ${search || 'none'}`);

        const eventSource = new EventSource(
            `http://localhost:5000/rangement-le?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
        );

        const timeoutId = setTimeout(() => {
            eventSource.close();
            setError('La requête a pris trop de temps (30s). Vérifiez le serveur ou essayez une recherche plus précise.');
            setLoading(false);
        }, 30000); // 30-second timeout

        let newData = [];

        eventSource.onmessage = (event) => {
            clearTimeout(timeoutId);
            try {
                const parsedData = JSON.parse(event.data);
                console.log('Received SSE event:', parsedData);

                if (parsedData.error) {
                    setError(parsedData.error);
                    setLoading(false);
                    eventSource.close();
                    return;
                }

                if (parsedData.batch) {
                    newData = [...newData, ...parsedData.data];
                    setData(newData);
                    setTotalRecords(parsedData.totalRecords);
                    setTotalPages(parsedData.totalPages);
                    console.log(`Adding ${parsedData.data.length} rows, total: ${newData.length}`);
                }

                if (parsedData.complete) {
                    setLoading(false);
                    eventSource.close();
                    console.log('SSE stream completed');
                }
            } catch (err) {
                console.error('Error parsing SSE data:', err.message);
                setError('Erreur lors du traitement des données');
                setLoading(false);
                eventSource.close();
            }
        };

        eventSource.onerror = (err) => {
            clearTimeout(timeoutId);
            console.error('SSE connection error:', err);
            setError('Erreur de connexion au serveur. Veuillez réessayer.');
            setLoading(false);
            eventSource.close();
        };

        return () => {
            clearTimeout(timeoutId);
            eventSource.close();
            console.log('SSE connection closed');
        };
    }, []);

    useEffect(() => {
        fetchData(page, searchTerm);
        return () => {
            setData([]);
        };
    }, [page, searchTerm, fetchData]);

    const handleSearch = useCallback((e) => {
        const value = e.target.value.trim();
        setSearchTerm(value);
        setPage(1);
        setData([]);
    }, []);

    const handleRetry = () => {
        setData([]);
        setPage(1);
        setError(null);
        fetchData(page, searchTerm);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
            setPage(newPage);
            setData([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const memoizedData = useMemo(() => data, [data]);

    const getLocationStatus = (historical, final, suitable) => {
        if (historical === 'N/A' && final === 'N/A' && suitable === 'N/A') {
            return { status: 'unknown', color: 'bg-gray-100 text-gray-600' };
        }
        if (final !== 'N/A' && suitable !== 'N/A' && final === suitable) {
            return { status: 'correct', color: 'bg-green-100 text-green-600' };
        }
        if (final !== 'N/A' && suitable !== 'N/A' && final !== suitable) {
            return { status: 'incorrect', color: 'bg-red-100 text-red-600' };
        }
        return { status: 'pending', color: 'bg-yellow-100 text-yellow-600' };
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, page - 2);
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

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                    <FaWarehouse className="mr-3 text-blue-600" />
                    Guide au Rangement LE
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
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                        <FaBoxes className="mr-1" />
                        {totalRecords.toLocaleString()} articles
                    </span>
                    <span className="text-gray-400">
                        Page {page} / {totalPages}
                    </span>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600">Chargement des données...</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Page {page} sur {totalPages} - 25 articles par page
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
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200 flex items-center text-sm"
                        >
                            <FaRedo className="mr-2" /> Réessayer
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && memoizedData.length === 0 && totalRecords === 0 && (
                <div className="text-center py-12">
                    <FaBoxes className="mx-auto text-gray-300 text-5xl mb-4" />
                    <p className="text-gray-500 text-lg">Aucune donnée disponible</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Vérifiez la configuration des données ou essayez une autre recherche
                    </p>
                </div>
            )}

            {!loading && memoizedData.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr className="text-gray-700 text-sm">
                                    <th className="px-4 py-3 border-b font-semibold text-left">Code Article</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Désignation</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Emplacements Historiques</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Emplacement Final</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Emplacement Convenable</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Storage Location</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Storage Location Validé</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">BIN SAP</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Quantité</th>
                                    <th className="px-4 py-3 border-b font-semibold text-left">Unité</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {memoizedData.map((row, index) => {
                                    const locationStatus = getLocationStatus(
                                        row.historical_locations,
                                        row.final_location,
                                        row.suitable_location
                                    );
                                    return (
                                        <tr key={`${row.article_code}-${index}`} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-4 py-3 text-gray-900 font-medium text-sm">{row.article_code}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[16rem]">
                                                <div className="truncate" title={row.description}>{row.description}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-xs max-w-[16rem] whitespace-pre-wrap">
                                                {row.historical_locations}
                                            </td>
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
                                            <td className="px-4 py-3 text-gray-800 text-xs whitespace-pre-wrap">
                                                {row.Storage_Location}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.Storage_location_Validé}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.BIN_SAP}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm font-medium">{row.quantity}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{row.unit}</td>
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
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                    >
                        <FaChevronLeft className="mr-2" /> Précédent
                    </button>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {getPageNumbers().map((pageNum, index) => (
                            <button
                                key={index}
                                onClick={() => typeof pageNum === 'number' && handlePageChange(pageNum)}
                                disabled={pageNum === '...' || pageNum === page}
                                className={`px-3 py-1 rounded-md text-sm transition duration-200 ${pageNum === page
                                        ? 'bg-blue-600 text-white'
                                        : pageNum === '...' ? 'text-gray-400 cursor-default' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                    >
                        Suivant <FaChevronRight className="ml-2" />
                    </button>
                </div>
            )}

            {!loading && memoizedData.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Affichage {((page - 1) * 25) + 1} à {Math.min(page * 25, totalRecords)} sur {totalRecords.toLocaleString()} articles
                </div>
            )}
        </div>
    );
};

export default RangementLE;