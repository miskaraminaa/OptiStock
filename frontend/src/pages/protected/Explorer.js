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
            console.log('Token:', token);
            if (!token) {
                setError('Aucune session trouvée. Redirection vers la connexion...');
                setLoading(false);
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return;
            }

            for (let attempt = 1; attempt <= retryCount; attempt++) {
                try {
                    const response = await axios.get(`${API_URL}/explorer`, {
                        headers: { Authorization: `Bearer ${token}` },
                        timeout: 30000,
                    });
                    console.log('API Response:', response.data.data); // Log full API response
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

                    if (err.response?.status === 401 || errorMessage.toLowerCase().includes('token')) {
                        setError('Session expirée. Redirection vers la connexion...');
                        localStorage.removeItem('token');
                        setLoading(false);
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 2000);
                        return;
                    }

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
        console.log('Articles before filtering:', articles); // Log articles state
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
        console.log('Filtered Articles:', filtered); // Log filtered results
        setFilteredArticles(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterType, articles]);

    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
    const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const uniqueStockTypes = [...new Set(articles.map(article => article.type_stock).filter(Boolean))];

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-medium text-gray-600">Chargement des articles... Veuillez patienter.</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                <p className="text-xl font-semibold text-red-600 mb-4">{error}</p>
                {error.includes('Redirection') ? null : (
                    <button
                        className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition duration-300"
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            window.location.reload();
                        }}
                    >
                        Réessayer
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">
                    Exploration des Articles
                </h1>
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Rechercher par article, type de stock ou désignation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-1/2"
                        aria-label="Rechercher par article, type de stock ou désignation"
                    />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-1/4"
                        aria-label="Filtrer par type de stock"
                    >
                        <option value="">Tous les types de stock</option>
                        {uniqueStockTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                {filteredArticles.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">Aucun article à afficher.</p>
                ) : (
                    <>
                        <div className="hidden md:block bg-white bg-opacity-80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-200 text-gray-900">
                                            {[
                                                'Code SAP',
                                                'Désignation Article',
                                                'Numéro Magasin',
                                                'Division',
                                                'Magasin',
                                                'Emplacement',
                                                'Type Magasin',
                                                'Quantité',
                                                'Unité Qté Base',
                                                'Type de Stock',
                                                'Désignation Type Stock',
                                                'Groupe Valorisation',
                                                'Prix',
                                                'Valeur Stock',
                                                'Devise',
                                                
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
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.designation_article || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.numero_magasin || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.division || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.magasin || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.emplacement || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.type_magasin || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.quantite || 'N/A'}</td>
                                                <td style={{ maxWidth: '150px' }} className="px-4 py-3 text-sm text-gray-600">{article.unite_qte_base || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.type_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.designation_type_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.groupe_valorisation || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.prix || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.valeur_stock || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{article.devise || 'N/A'}</td>
                                               
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
                                        <div><span className="font-semibold text-gray-700">Code SAP :</span><p className="text-gray-900">{article.article || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Désignation Article :</span><p className="text-gray-900">{article.designation_article || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Numéro Magasin :</span><p className="text-gray-900">{article.numero_magasin || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Division :</span><p className="text-gray-900">{article.division || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Magasin :</span><p className="text-gray-900">{article.magasin || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Emplacement :</span><p className="text-gray-900">{article.emplacement || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Type Magasin :</span><p className="text-gray-900">{article.type_magasin || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Quantité :</span><p className="text-gray-900">{article.quantite || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Unité Qté Base :</span><p className="text-gray-900">{article.unite_qte_base || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Type de Stock :</span><p className="text-gray-900">{article.type_stock || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Désignation Type Stock :</span><p className="text-gray-900">{article.designation_type_stock || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Groupe Valorisation :</span><p className="text-gray-900">{article.groupe_valorisation || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Prix :</span><p className="text-gray-900">{article.prix || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Valeur Stock :</span><p className="text-gray-900">{article.valeur_stock || 'N/A'}</p></div>
                                        <div><span className="font-semibold text-gray-700">Devise :</span><p className="text-gray-900">{article.devise || 'N/A'}</p></div>
                                        </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'} transition duration-300`}
                            >
                                Précédent
                            </button>
                            <span className="text-gray-600">Page {currentPage} sur {totalPages}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'} transition duration-300`}
                            >
                                Suivant
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Explorer;