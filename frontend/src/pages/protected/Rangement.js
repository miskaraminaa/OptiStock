import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { FaSearch, FaRedo, FaWarehouse, FaChevronLeft, FaChevronRight, FaBoxes } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { setPageTitle } from '../../features/common/headerSlice';

// Centralized data validation
const validateRangementData = (data) =>
    data.map((item) => ({
        article_code: item.article_code || 'N/A',
        description: item.description || 'N/A',
        numero_magasin: item.numero_magasin || 'N/A',
        division: item.division || 'N/A',
        warehouse: item.warehouse || 'N/A',
        bin_location: item.bin_location || 'N/A',
        type_magasin: item.type_magasin || 'N/A',
        quantity: item.quantity != null ? Number(item.quantity) : 'N/A',
        unit: item.unit || 'N/A',
        type_stock: item.type_stock || 'N/A',
        designation_type_stock: item.designation_type_stock || 'N/A',
        groupe_valorisation: item.groupe_valorisation || 'N/A',
        pmp: item.pmp != null ? Number(item.pmp) : 'N/A',
        valeur_stock: item.valeur_stock != null ? Number(item.valeur_stock) : 'N/A',
        devise: item.devise || 'N/A',
        date_em: item.date_em || 'N/A',
        derniere_sortie: item.derniere_sortie || 'N/A',
        Marque: item.Marque || 'N/A',
        Oracle_item_code: item.Oracle_item_code || 'N/A',
        migration_description: item.migration_description || 'N/A',
        Qté_validée_SAP: item.Qté_validée_SAP != null ? Number(item.Qté_validée_SAP) : 'N/A',
        SAP_Material: item.SAP_Material || 'N/A',
        PLANT: item.PLANT || 'N/A',
        Plant_Validé: item.Plant_Validé || 'N/A',
        Storage_Location: item.Storage_Location || 'N/A',
        Storage_location_Validé: item.Storage_location_Validé || 'N/A',
        local: item.local || 'N/A',
        BIN_SAP: item.BIN_SAP || 'N/A',
        bins_with_qte_nx: item.bins_with_qte_nx || 'N/A',
    }));

const Rangement = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const limit = 25;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        dispatch(setPageTitle({ title: 'Guide de Rangement' }));
    }, [dispatch]);

    const fetchData = async (page, search) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_URL}/rangement`, {
                params: { page, limit, search: search || undefined },
            });
            const responseData = Array.isArray(response.data.data) ? response.data.data : [];
            setData(validateRangementData(responseData));
            setTotalRecords(response.data.totalRecords || responseData.length);
            setTotalPages(response.data.totalPages || Math.ceil(response.data.totalRecords / limit));
        } catch (err) {
            setError(`Erreur lors du chargement des données : ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchData = useMemo(() => debounce(fetchData, 300), []);

    useEffect(() => {
        debouncedFetchData(currentPage, searchTerm);
        return () => debouncedFetchData.cancel();
    }, [currentPage, searchTerm, debouncedFetchData]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.trim());
        setCurrentPage(1);
    };

    const handleRetry = () => {
        setError(null);
        setCurrentPage(1);
        fetchData(currentPage, searchTerm);
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

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            const startPage = Math.max(1, currentPage - 2);
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
                    Guide de Rangement
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Gestion des emplacements et suivi des stocks
                </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative w-full sm:flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par code article, désignation ou marque"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                        aria-label="Rechercher par code article, désignation ou marque"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                        <FaBoxes className="mr-1" />
                        {totalRecords.toLocaleString()} articles
                    </span>
                    <span className="text-gray-400">Page {currentPage} / {totalPages}</span>
                </div>
            </div>

            {loading && (
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600">Chargement des données...</p>
                    <p className="mt-2 text-sm text-gray-500">
                        Page {currentPage} sur {totalPages} - {limit} articles par page
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
                                        { key: 'numero_magasin', label: 'Numéro Magasin' },
                                        { key: 'division', label: 'Division' },
                                        { key: 'warehouse', label: 'Magasin' },
                                        { key: 'bin_location', label: 'Emplacement' },
                                        { key: 'type_magasin', label: 'Type Magasin' },
                                        { key: 'quantity', label: 'Quantité' },
                                        { key: 'unit', label: 'Unité' },
                                        { key: 'type_stock', label: 'Type Stock' },
                                        { key: 'designation_type_stock', label: 'Désignation Type Stock' },
                                        { key: 'groupe_valorisation', label: 'Groupe Valorisation' },
                                        { key: 'pmp', label: 'PMP' },
                                        { key: 'valeur_stock', label: 'Valeur Stock' },
                                        { key: 'devise', label: 'Devise' },
                                        { key: 'date_em', label: 'Date EM' },
                                        { key: 'derniere_sortie', label: 'Dernière Sortie' },
                                        { key: 'Marque', label: 'Marque' },
                                        { key: 'Oracle_item_code', label: 'Oracle Item Code' },
                                        { key: 'migration_description', label: 'Description Migration' },
                                        { key: 'Qté_validée_SAP', label: 'Qté Validée SAP' },
                                        { key: 'SAP_Material', label: 'SAP Material' },
                                        { key: 'PLANT', label: 'Plant' },
                                        { key: 'Plant_Validé', label: 'Plant Validé' },
                                        { key: 'Storage_Location', label: 'Storage Location' },
                                        { key: 'Storage_location_Validé', label: 'Storage Location Validé' },
                                        { key: 'local', label: 'Local' },
                                        { key: 'BIN_SAP', label: 'BIN SAP' },
                                        { key: 'bins_with_qte_nx', label: 'Bins with QTE NX' },
                                    ].map(({ key, label }) => (
                                        <th
                                            key={key}
                                            className="px-4 py-3 border-b font-semibold text-left cursor-pointer"
                                            onClick={() => handleSort(key)}
                                            role="button"
                                            aria-sort={sortConfig.key === key ? sortConfig.direction : 'none'}
                                            scope="col"
                                            style={{
                                                width: key === 'BIN_SAP' ? '150px' : key === 'bins_with_qte_nx' ? '200px' : 'auto',
                                            }}
                                        >
                                            {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedData.map((item, index) => (
                                    <tr key={`${item.article_code}-${index}`} className="hover:bg-gray-50 transition duration-150">
                                        <td className="px-4 py-3 text-gray-900 font-medium text-sm">{item.article_code}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm whitespace-normal break-words min-w-[150px]">{item.description}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.numero_magasin}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.division}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.warehouse}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm  min-w-[150px]">{item.bin_location}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.type_magasin}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm font-medium " >
                                            {item.quantity !== 'N/A' ? (
                                                <>
                                                    {item.quantity.toFixed(3)}
                                                    {item.quantity < 0 && <span className="text-red-500"> (Sortie)</span>}
                                                </>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.unit}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.type_stock}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm whitespace-normal break-words min-w-[150px]">{item.designation_type_stock}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.groupe_valorisation}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.pmp === 'N/A' ? 'N/A' : item.pmp.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.valeur_stock === 'N/A' ? 'N/A' : item.valeur_stock.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.devise}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm min-w-[150px]">{item.date_em}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm min-w-[150px]">{item.derniere_sortie}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.Marque}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.Oracle_item_code}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm whitespace-normal break-words min-w-[150px]">{item.migration_description}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.Qté_validée_SAP === 'N/A' ? 'N/A' : item.Qté_validée_SAP.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.SAP_Material}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.PLANT}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.Plant_Validé}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.Storage_Location}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm whitespace-normal break-words">{item.Storage_location_Validé}</td>
                                        <td className="px-4 py-3 text-gray-800 text-sm">{item.local}</td>
                                        <td className="px-6 py-4 text-gray-800 text-sm min-w-[150px]">{item.BIN_SAP}</td> {/* Ajusté pour plus d'espace */}
                                        <td className="px-6 py-4 text-gray-800 text-sm whitespace-normal break-words min-w-[250px]">{item.bins_with_qte_nx}</td> {/* Ajusté pour plus d'espace */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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

            {!loading && sortedData.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Affichage {(currentPage - 1) * limit + 1} à {Math.min(currentPage * limit, totalRecords)} sur {totalRecords.toLocaleString()} articles
                </div>
            )}
        </div>
    );
};

export default Rangement;