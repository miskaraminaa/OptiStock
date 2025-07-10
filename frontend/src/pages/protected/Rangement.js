import React, { useState, useEffect, Component, useMemo } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

// Error Boundary Component
class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-center text-red-500 p-4">
                    <h2>Une erreur est survenue.</h2>
                    <p>Veuillez réessayer plus tard ou contactez le support.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

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
            const response = await axios.get('http://localhost:5000/rangement', {
                params: { search, page }
            });
            // Ensure data is an array
            const responseData = Array.isArray(response.data.data) ? response.data.data : [];
            setData(responseData);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            setError(`Échec du chargement des données : ${err.message}`);
            console.error('Fetch error:', err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, 300);

    // Trigger fetch on searchTerm or currentPage change
    useEffect(() => {
        fetchData(searchTerm, currentPage);
        return () => fetchData.cancel();
    }, [searchTerm, currentPage]);

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

    // Memoize table rows to prevent unnecessary re-renders
    const tableRows = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return (
                <tr>
                    <td colSpan={30} className="py-1 px-2 border text-center text-gray-500 text-sm">
                        Aucune donnée disponible
                    </td>
                </tr>
            );
        }

        return data.map((item, index) => (
            <tr key={item.article_code || `item-${index}`} className="hover:bg-gray-100">
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.article_code || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[200px] whitespace-normal break-words">{item.description || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.numero_magasin || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.division || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.warehouse || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[120px]">{item.bin_location || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.type_magasin || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">
                    {item.quantity != null ? (
                        <>
                            {Number(item.quantity).toFixed(3)}
                            {item.quantity < 0 && <span className="text-red-500"> (Sortie)</span>}
                        </>
                    ) : 'N/A'}
                </td>
                <td className="py-1 px-2 border text-sm min-w-[60px]">{item.unit || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.type_stock || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[150px] whitespace-normal break-words">{item.designation_type_stock || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[120px]">{item.groupe_valorisation || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.pmp != null ? Number(item.pmp).toFixed(2) : 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.valeur_stock != null ? Number(item.valeur_stock).toFixed(2) : 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[60px]">{item.devise || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.date_em || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.derniere_sortie || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[150px] whitespace-normal break-words">{item.name_file || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.Marque || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[120px]">{item.Oracle_item_code || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[200px] whitespace-normal break-words">{item.migration_description || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.Qté_validée_SAP != null ? Number(item.Qté_validée_SAP).toFixed(3) : 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.SAP_Material || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.PLANT || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.Plant_Validé || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[120px]">{item.Storage_Location || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[150px] whitespace-normal break-words">{item.Storage_location_Validé || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[80px]">{item.local || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[100px]">{item.BIN_SAP || 'N/A'}</td>
                <td className="py-1 px-2 border text-sm min-w-[250px] whitespace-normal break-words">{item.bins_with_qte_nx || 'N/A'}</td>
            </tr>
        ));
    }, [data]);

    return (
        <ErrorBoundary>
            <div className="container mx-auto p-4">
                <h1 className="text-xl font-bold mb-4">Guide de Rangement</h1>

                {/* Search Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Rechercher par code article, désignation ou marque"
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between mb-4">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
                    >
                        Précédent
                    </button>
                    <span className="text-sm">Page {currentPage} sur {totalPages}</span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
                    >
                        Suivant
                    </button>
                </div>

                {/* Loading and Error States */}
                {loading && <p className="text-center text-sm">Chargement...</p>}
                {error && <p className="text-center text-red-500 text-sm">{error}</p>}

                {/* Table */}
                {!loading && !error && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-1 px-2 border min-w-[100px]">Code Article</th>
                                    <th className="py-1 px-2 border min-w-[200px]">Désignation</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Numéro Magasin</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Division</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Magasin</th>
                                    <th className="py-1 px-2 border min-w-[120px]">Emplacement</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Type Magasin</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Quantité</th>
                                    <th className="py-1 px-2 border min-w-[60px]">Unité</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Type Stock</th>
                                    <th className="py-1 px-2 border min-w-[150px]">Désignation Type Stock</th>
                                    <th className="py-1 px-2 border min-w-[120px]">Groupe Valorisation</th>
                                    <th className="py-1 px-2 border min-w-[80px]">PMP</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Valeur Stock</th>
                                    <th className="py-1 px-2 border min-w-[60px]">Devise</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Date EM</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Dernière Sortie</th>
                                    <th className="py-1 px-2 border min-w-[150px]">Fichier</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Marque</th>
                                    <th className="py-1 px-2 border min-w-[120px]">Oracle Item Code</th>
                                    <th className="py-1 px-2 border min-w-[200px]">Description Migration</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Qté Validée SAP</th>
                                    <th className="py-1 px-2 border min-w-[100px]">SAP Material</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Plant</th>
                                    <th className="py-1 px-2 border min-w-[100px]">Plant Validé</th>
                                    <th className="py-1 px-2 border min-w-[120px]">Storage Location</th>
                                    <th className="py-1 px-2 border min-w-[150px]">Storage Location Validé</th>
                                    <th className="py-1 px-2 border min-w-[80px]">Local</th>
                                    <th className="py-1 px-2 border min-w-[100px]">BIN SAP</th>
                                    <th className="py-1 px-2 border min-w-[250px]">Bins with QTE NX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default Rangement;