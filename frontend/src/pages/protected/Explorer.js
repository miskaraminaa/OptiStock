import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No session found. Please log in.');
                setLoading(false);
                return;
            }

            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const response = await axios.get(`${API_URL}/explorer`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 30000, // Increased timeout to 30 seconds
                    });
                    if (!response.data || !response.data.data) {
                        throw new Error('Invalid response data');
                    }
                    setArticles(response.data.data);
                    setFilteredArticles(response.data.data);
                    setLoading(false);
                    return;
                } catch (err) {
                    if (attempt === retryCount) {
                        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch articles';
                        setError(errorMessage.includes('404') ? 'Resource not found' : errorMessage);
                        console.error(`[${new Date().toISOString()}] API Error (Attempt ${attempt}):`, err.response?.data || err.message);
                        setLoading(false);
                    } else {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, delay));
                        console.log(`Retrying... Attempt ${attempt + 1}/${retryCount}`);
                    }
                }
            }
        };

        fetchArticles();
    }, []);

    useEffect(() => {
        const filtered = articles.filter(article =>
            (article.article?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.type_stock?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.designation_type_stock?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterType === '' || article.type_stock === filterType)
        );
        setFilteredArticles(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterType, articles]);

    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

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

    const uniqueStockTypes = [...new Set(articles.map(article => article.type_stock).filter(Boolean))];

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-medium text-gray-600">Loading Articles... Please wait.</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <p className="text-xl font-semibold text-red-600 mb-4">{error}</p>
                <button
                    className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition duration-300"
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        window.location.reload();
                    }}
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">
                    Article Exploration
                </h1>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search by article, stock type, or designation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-1/2"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-1/4"
                    >
                        <option value="">All Stock Types</option>
                        {uniqueStockTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {filteredArticles.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">No articles to display.</p>
                ) : (
                    <>
                        <div className="hidden md:block bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-900">
                                            {[
                                                'Article',
                                                'Quantité',
                                                'Type de Stock',
                                                'Désignation Type Stock',
                                                'Valeur Stock',
                                                'LE Produit',
                                                'LE Document',
                                                'LE Statut Tâche',
                                                'LE Statut Activité',
                                                'LE Statut Prélèvement',
                                                'LS Produit',
                                                'LS Document',
                                                'LS Statut Tache',
                                                'LS Statut Activité',
                                                'LS Statut Prélèvement'
                                            ].map((header) => (
                                                <th key={header} className="px-4 py-3 text-left text-sm font-semibold tracking-wide">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentArticles.map((article, index) => (
                                            <tr
                                                key={index}
                                                className={`transition duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.article || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.quantite || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.type_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.designation_type_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.valeur_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.Produit || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.Document || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.Statut_tache_magasin || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.le_statut_activite || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.le_statut_prelevement || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.ls_produit || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.ls_document || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.ls_statut_tache || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.ls_statut_activite || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.ls_statut_prelevement || 'N/A'}</td>
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
                                    className="bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-lg p-6 transition duration-300 hover:bg-opacity-100"
                                >
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-700">Article:</span>
                                            <p className="text-gray-900">{article.article || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Quantité:</span>
                                            <p className="text-gray-900">{article.quantite || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Type de Stock:</span>
                                            <p className="text-gray-900">{article.type_stock || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Désignation:</span>
                                            <p className="text-gray-900">{article.designation_type_stock || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">Valeur Stock:</span>
                                            <p className="text-gray-900">{article.valeur_stock || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LE Produit:</span>
                                            <p className="text-gray-900">{article.Produit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LE Document:</span>
                                            <p className="text-gray-900">{article.Document || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LE Statut Tâche:</span>
                                            <p className="text-gray-900">{article.Statut_tache_magasin || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LE Statut Activité:</span>
                                            <p className="text-gray-900">{article.le_statut_activite || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LE Statut Prélèvement:</span>
                                            <p className="text-gray-900">{article.le_statut_prelevement || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LS Produit:</span>
                                            <p className="text-gray-900">{article.ls_produit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LS Document:</span>
                                            <p className="text-gray-900">{article.ls_document || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LS Statut Tache:</span>
                                            <p className="text-gray-900">{article.ls_statut_tache || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LS Statut Activité:</span>
                                            <p className="text-gray-900">{article.ls_statut_activite || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-700">LS Statut Prélèvement:</span>
                                            <p className="text-gray-900">{article.ls_statut_prelevement || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray- XD2-300 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'} transition duration-300`}
                            >
                                ← Previous
                            </button>
                            <span className="text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'} transition duration-300`}
                            >
                                Next →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Explorer;