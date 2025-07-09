import React, { useState, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

const Rangement = () => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounced fetch function to limit API calls
    const fetchData = debounce(async (search, page) => {
        try {
            setLoading(true);
            console.log('Fetching with search:', search, 'page:', page); // Debug
            const response = await axios.get('http://localhost:5000/rangement', {
                params: { search, page }
            });
            console.log('Raw API data:', response.data); // Debug raw data
            setData(response.data.data || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            setError(`Failed to fetch data: ${err.message}`);
            console.error('Fetch error:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, 300);

    // Trigger fetch on searchTerm or currentPage change
    useEffect(() => {
        fetchData(searchTerm, currentPage);
        return () => fetchData.cancel(); // Cleanup debounce on unmount
    }, [searchTerm, currentPage]);

    // Group data by article_code or warehouse for historical locations
    const groupedData = data.reduce((acc, item) => {
        const key = item.article_code || item.warehouse;
        if (!acc[key]) {
            acc[key] = { ...item, locations: [] };
        }
        acc[key].locations.push({
            bin_location: item.bin_location,
            quantity: item.quantity,
            warehouse: item.warehouse || 'Unknown',
            unit: item.unit || 'N/A',
            pmp: item.pmp,
            source: item.source
        });
        return acc;
    }, {});

    // Handle page navigation
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Guide de Rangement</h1>

            {/* Search Input */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Rechercher par code article ou description"
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 on new search
                    }}
                />
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between mb-4">
                <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                    Précédent
                </button>
                <span>Page {currentPage} sur {totalPages}</span>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                    Suivant
                </button>
            </div>

            {/* Loading and Error States */}
            {loading && <p className="text-center">Chargement...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            {/* Table */}
            {!loading && !error && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="py-2 px-4 border">Code Article</th>
                                <th className="py-2 px-4 border">Désignation</th>
                                <th className="py-2 px-4 border">Emplacements Historiques</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(groupedData).map(item => (
                                <tr key={item.article_code || item.warehouse} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border">{item.article_code || 'N/A'}</td>
                                    <td className="py-2 px-4 border">{item.description || 'N/A'}</td>
                                    <td className="py-2 px-4 border">
                                        <ul className="list-disc pl-5">
                                            {item.locations.map((loc, index) => {
                                                const sourceLabel = {
                                                    current: 'Actuel',
                                                    task_prenant: 'Tâche (Prenant)',
                                                    task_cedant: 'Tâche (Cédant)',
                                                    status_cedant: 'Statut (Cédant)',
                                                    status_prenant: 'Statut (Prenant)'
                                                }[loc.source] || loc.source;
                                                return (
                                                    <li key={index}>
                                                        {loc.bin_location && <span><strong>Emplacement:</strong> {loc.bin_location}, </span>}
                                                        <strong>Magasin:</strong> {loc.warehouse},
                                                        {loc.quantity && (
                                                            <span>
                                                                <strong>Quantité:</strong> {Number(loc.quantity).toFixed(3)} {loc.unit}
                                                                {loc.quantity < 0 && <span className="text-red-500"> (Sortie)</span>},
                                                            </span>
                                                        )}
                                                        {loc.pmp && <span><strong>PMP:</strong> {Number(loc.pmp).toFixed(2)}, </span>}
                                                        <span className="text-gray-500">({sourceLabel})</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Rangement;