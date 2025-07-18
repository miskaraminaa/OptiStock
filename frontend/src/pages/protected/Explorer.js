import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaChevronLeft, FaChevronRight, FaWarehouse } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const Explorer = () => {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const articlesPerPage = 25;
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchArticles = async (retryCount = 3, delay = 1000) => {
            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const response = await axios.get(`${API_URL}/explorer`, {
                        timeout: 30000,
                    });
                    console.log('API Response:', response.data.data);
                    if (!response.data || !response.data.data) {
                        throw new Error('Invalid response data');
                    }
                    setArticles(response.data.data);
                    setFilteredArticles(response.data.data);
                    setLoading(false);
                    return;
                } catch (err) {
                    const errorMessage = err.response?.data?.message || err.message || 'Échec de la récupération des articles';
                    console.error(`[${new Date().toISOString()}] API Error (Attempt ${attempt}):`, err.response?.data || err.message);

                    if (attempt === retryCount) {
                        setError(errorMessage.includes('404') ? 'Ressource non trouvée' : errorMessage);
                        setLoading(false);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        console.log(`Retrying... Attempt ${attempt + 1}/${retryCount}`);
                    }
                }
            }
        };

        fetchArticles();
    }, []);

    useEffect(() => {
        console.log('Articles before filtering:', articles);
        const filtered = articles.filter(article => {
            const articleStr = article.article ? article.article.toString() : '';
            const typeStockStr = article.type_stock?.toLowerCase() || '';
            const designationStr = article.designation_type_stock?.toLowerCase() || '';
            const searchLower = searchTerm.toLowerCase();

            const matchesSearch =
                articleStr.includes(searchLower) ||
                typeStockStr.includes(searchLower) ||
                designationStr.includes(searchLower);

            const matchesFilter = filterType === '' || article.type_stock === filterType;

            return matchesSearch && matchesFilter;
        });
        console.log('Filtered Articles:', filtered);
        setFilteredArticles(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterType, articles]);

    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

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

    if (error) {
        return (
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-3">⚠️</div>
                            <span className="text-red-800 text-sm sm:text-base">{error}</span>
                        </div>
                        <button
                            onClick={() => {
                                setLoading(true);
                                setError(null);
                                window.location.reload();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200 flex items-center text-sm"
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
                    <FaWarehouse className="mr-3 text-blue-600" />
                    Exploration des Articles
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Gestion et exploration des données d'articles
                </p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative w-full sm:flex-1 max-w-md">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par article, type de stock ou désignation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                        aria-label="Rechercher par article, type de stock ou désignation"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full sm:w-48 border border-gray-300 rounded-lg p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                    aria-label="Filtrer par type de stock"
                >
                    <option value="">Tous les types de stock</option>
                    {[...new Set(articles.map(article => article.type_stock).filter(Boolean))].map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="text-gray-400">
                        Page {currentPage} / {totalPages}
                    </span>
                </div>
            </div>

            {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                    <FaWarehouse className="mx-auto text-gray-300 text-5xl mb-4" />
                    <p className="text-gray-500 text-lg">Aucun article à afficher</p>
                    <p className="text-gray-400 text-sm mt-2">
                        Essayez une autre recherche ou vérifiez les filtres
                    </p>
                </div>
            ) : (
                <>
                    <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr className="text-gray-700 text-sm">
                                        <th className="px-4 py-3 border-b font-semibold text-left">Code SAP</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Désignation Article</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Numéro Magasin</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Division</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Magasin</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Emplacement</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Type Magasin</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Quantité</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Unité Qté Base</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Type de Stock</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Désignation Type Stock</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Groupe Valorisation</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Prix</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Valeur Stock</th>
                                        <th className="px-4 py-3 border-b font-semibold text-left">Devise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentArticles.map((article, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.article || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[16rem]">
                                                <div className="truncate" title={article.designation_article}>{article.designation_article || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.numero_magasin || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.division || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.magasin || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.emplacement || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.type_magasin || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.quantite || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[150px]">{article.unite_qte_base || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.type_stock || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm max-w-[12rem]">
                                                <div className="truncate" title={article.designation_type_stock}>{article.designation_type_stock || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.groupe_valorisation || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.prix || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.valeur_stock || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-800 text-sm">{article.devise || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="md:hidden space-y-4">
                        {currentArticles.map((article, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-lg p-6 transition duration-300 hover:bg-gray-50"
                            >
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-semibold text-gray-700">Code SAP :</span><p className="text-gray-800">{article.article || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Désignation Article :</span><p className="text-gray-800 truncate">{article.designation_article || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Numéro Magasin :</span><p className="text-gray-800">{article.numero_magasin || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Division :</span><p className="text-gray-800">{article.division || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Magasin :</span><p className="text-gray-800">{article.magasin || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Emplacement :</span><p className="text-gray-800">{article.emplacement || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Type Magasin :</span><p className="text-gray-800">{article.type_magasin || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Quantité :</span><p className="text-gray-800">{article.quantite || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Unité Qté Base :</span><p className="text-gray-800">{article.unite_qte_base || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Type de Stock :</span><p className="text-gray-800">{article.type_stock || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Désignation Type Stock :</span><p className="text-gray-800 truncate">{article.designation_type_stock || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Groupe Valorisation :</span><p className="text-gray-800">{article.groupe_valorisation || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Prix :</span><p className="text-gray-800">{article.prix || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Valeur Stock :</span><p className="text-gray-800">{article.valeur_stock || 'N/A'}</p></div>
                                    <div><span className="font-semibold text-gray-700">Devise :</span><p className="text-gray-800">{article.devise || 'N/A'}</p></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
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
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200 flex items-center text-sm sm:text-base"
                            >
                                Suivant <FaChevronRight className="ml-2" />
                            </button>
                        </div>
                    )}
                    {filteredArticles.length > 0 && (
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Affichage {indexOfFirstArticle + 1} à {Math.min(indexOfLastArticle, filteredArticles.length)} sur {filteredArticles.length.toLocaleString()} articles
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Explorer;