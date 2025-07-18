import React, { useState, useEffect, useRef } from "react";
import { FaWarehouse, FaFileExport, FaPrint, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import * as XLSX from "xlsx";
import { useDispatch } from "react-redux"; // Importation ajoutée
import { setPageTitle } from '../../features/common/headerSlice';
import TitleCard from '../../components/Cards/TitleCard';
const Dimensions = () => {
    const [ids, setIds] = useState([]);
    const [dimensions, setDimensions] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [longueur, setLongueur] = useState("");
    const [largeur, setLargeur] = useState("");
    const [hauteur, setHauteur] = useState("");
    const [poids, setPoids] = useState("");
    const [qte, setQte] = useState("");
    const [message, setMessage] = useState("");
    const [data, setData] = useState(null);
    const [isLoadingIds, setIsLoadingIds] = useState(false);
    const [isLoadingDimensions, setIsLoadingDimensions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const dispatch = useDispatch(); // Initialisation de useDispatch
    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const tableRef = useRef(null);

    // Définir le titre de la page au montage
    useEffect(() => {
        dispatch(setPageTitle({ title: "Gestion des Dimensions" }));
    }, [dispatch]);

    // Fetch article IDs
    useEffect(() => {
        const fetchIds = async () => {
            setIsLoadingIds(true);
            setMessage("");
            try {
                const res = await fetch(`${BASE_URL}/dimensions/ids`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const result = await res.json();
                const sortedIds = result.ids?.map(String).sort((a, b) => a.localeCompare(b)) || [];
                setIds(sortedIds);
            } catch (err) {
                console.error("Error fetching IDs:", err);
                setMessage(`Erreur lors du chargement des IDs: ${err.message}`);
            } finally {
                setIsLoadingIds(false);
            }
        };
        fetchIds();
    }, [BASE_URL]);

    // Fetch all dimensions
    useEffect(() => {
        const fetchDimensions = async () => {
            setIsLoadingDimensions(true);
            setMessage("");
            try {
                const res = await fetch(`${BASE_URL}/dimensions/`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const result = await res.json();
                setDimensions(result.data || []);
            } catch (err) {
                console.error("Error fetching dimensions:", err);
                setMessage(`Erreur lors du chargement des dimensions: ${err.message}`);
            } finally {
                setIsLoadingDimensions(false);
            }
        };
        fetchDimensions();
    }, [BASE_URL]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedId || !longueur || !largeur || !hauteur || !poids || !qte) {
            setMessage("Tous les champs sont requis.");
            return;
        }

        const longueurNum = parseFloat(longueur);
        const largeurNum = parseFloat(largeur);
        const hauteurNum = parseFloat(hauteur);
        const poidsNum = parseFloat(poids);
        const qteNum = parseInt(qte, 10);

        if (isNaN(longueurNum) || isNaN(largeurNum) || isNaN(hauteurNum) ||
            isNaN(poidsNum) || isNaN(qteNum) || qteNum < 1) {
            setMessage("Veuillez entrer des valeurs numériques valides (quantité ≥ 1).");
            return;
        }

        try {
            const toNum = x => Number(x);
            const body = {
                id_article: selectedId,
                longueur: toNum(longueur),
                largeur: toNum(largeur),
                hauteur: toNum(hauteur),
                poids: toNum(poids),
                qte: toNum(qte)
            };
            const res = await fetch(`${BASE_URL}/dimensions/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const result = await res.json();
            if (res.ok) {
                setMessage("Dimensions enregistrées avec succès.");
                setData(result.data[0]);
                const dimensionsRes = await fetch(`${BASE_URL}/dimensions/`);
                const dimensionsResult = await dimensionsRes.json();
                setDimensions(dimensionsResult.data || []);
                setSelectedId("");
                setLongueur("");
                setLargeur("");
                setHauteur("");
                setPoids("");
                setQte("");
            } else {
                setMessage(result.message || "Erreur lors de l'enregistrement.");
            }
        } catch (err) {
            console.error("Error submitting dimensions:", err);
            setMessage("Erreur serveur: " + err.message);
        }
    };

    // Handle Excel export
    const handleExportExcel = () => {
        if (dimensions.length === 0) {
            setMessage("Aucune donnée à exporter.");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dimensions);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dimensions");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `dimensions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle print
    const handlePrint = () => {
        const printContent = tableRef.current;
        if (!printContent) {
            console.error("Table reference is null. Ensure the table is rendered before printing.");
            return;
        }

        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Imprimer Dimensions</title>');
            printWindow.document.write('<style>body { margin: 20px; font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; font-size: 14px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; font-weight: bold; } tr:nth-child(even) { background-color: #f9f9f9; } @media print { body { margin: 0; } }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.outerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } else {
            console.error("Failed to open print window. Check browser popup settings.");
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = dimensions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(dimensions.length / itemsPerPage);

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

    if (isLoadingIds || isLoadingDimensions) {
        return (
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="flex flex-col justify-center items-center my-8">
                    <ClipLoader color="#3b82f6" size={40} />
                    <p className="mt-4 text-gray-600">
                        {isLoadingIds ? "Chargement des IDs..." : "Chargement des dimensions..."}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        Page {currentPage} sur {totalPages}
                    </p>
                </div>
            </div>
        );
    }

    if (message && message.includes("Erreur")) {
        return (
            <div className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-3">⚠️</div>
                            <span className="text-red-800 text-sm sm:text-base">{message}</span>
                        </div>
                        <button
                            onClick={() => {
                                setMessage("");
                                setIsLoadingIds(true);
                                setIsLoadingDimensions(true);
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
                    Gestion des Dimensions
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                    Ajouter ou explorer les dimensions des articles
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 no-print">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Ajouter/Modifier Dimensions</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Article</label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            required
                        >
                            <option value="">Sélectionner un ID</option>
                            {ids.map((id) => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longueur (m)</label>
                        <input
                            type="number"
                            value={longueur}
                            onChange={(e) => setLongueur(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Largeur (m)</label>
                        <input
                            type="number"
                            value={largeur}
                            onChange={(e) => setLargeur(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur (m)</label>
                        <input
                            type="number"
                            value={hauteur}
                            onChange={(e) => setHauteur(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                        <input
                            type="number"
                            value={poids}
                            onChange={(e) => setPoids(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                        <input
                            type="number"
                            value={qte}
                            onChange={(e) => setQte(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                            step="1"
                            min="1"
                            required
                        />
                    </div>
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 flex items-center text-sm"
                        >
                            <FaPlus className="mr-2" />
                            Enregistrer
                        </button>
                    </div>
                </form>
                {message && (
                    <div className={`mt-4 text-sm text-center ${message.includes("Erreur") ? "text-red-600" : "text-green-600"}`}>
                        {message}
                    </div>
                )}
            </div>

            {data && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 no-print">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Données enregistrées</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <p><span className="font-semibold text-gray-700">ID Article:</span> {data.id_article}</p>
                        <p><span className="font-semibold text-gray-700">Longueur:</span> {data.longueur} m</p>
                        <p><span className="font-semibold text-gray-700">Largeur:</span> {data.largeur} m</p>
                        <p><span className="font-semibold text-gray-700">Hauteur:</span> {data.hauteur} m</p>
                        <p><span className="font-semibold text-gray-700">Poids:</span> {data.poids} kg</p>
                        <p><span className="font-semibold text-gray-700">Quantité:</span> {data.quantite}</p>
                        <p><span className="font-semibold text-gray-700">Volume:</span> {data.volume} m³</p>
                        <p><span className="font-semibold text-gray-700">Volume/Quantité:</span> {data.volume_quantite} m³</p>
                        <p><span className="font-semibold text-gray-700">Poids Global:</span> {data.poids_global} kg</p>
                        <p><span className="font-semibold text-gray-700">Type Rayon:</span> {data.Type_Rayon}</p>
                        <p><span className="font-semibold text-gray-700">Manutention:</span> {data.manutention}</p>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaWarehouse className="mr-2 text-blue-600" />
                    Explorer les Dimensions
                </h2>
                <div className="flex flex-wrap gap-4 mb-4">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition duration-200 flex items-center text-sm"
                    >
                        <FaFileExport className="mr-2" />
                        Exporter en Excel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 flex items-center text-sm"
                    >
                        <FaPrint className="mr-2" />
                        Imprimer
                    </button>
                </div>
                {dimensions.length > 0 ? (
                    <>
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden print-table">
                            <div className="overflow-x-auto">
                                <table ref={tableRef} className="min-w-full border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr className="text-gray-700 text-sm">
                                            <th className="px-4 py-3 border-b font-semibold text-left">ID Article</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Longueur (m)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Largeur (m)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Hauteur (m)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Poids (kg)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Quantité</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Volume (m³)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Volume/Quantité (m³)</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Type Rayon</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Manutention</th>
                                            <th className="px-4 py-3 border-b font-semibold text-left">Poids Global (kg)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentItems.map((dim) => (
                                            <tr key={dim.id_article} className="hover:bg-gray-50 transition duration-150">
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.id_article}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.longueur}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.largeur}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.hauteur}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.poids}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.quantite}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.volume}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.volume_quantite}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.Type_Rayon}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.manutention}</td>
                                                <td className="px-4 py-3 text-gray-800 text-sm">{dim.poids_global}</td>
                                            </tr>
                                        ))}
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
                        {dimensions.length > 0 && (
                            <div className="mt-4 text-center text-sm text-gray-500">
                                Affichage {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, dimensions.length)} sur {dimensions.length.toLocaleString()} dimensions
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <FaWarehouse className="mx-auto text-gray-300 text-5xl mb-4" />
                        <p className="text-gray-500 text-lg">Aucune dimension enregistrée</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Ajoutez des dimensions pour commencer
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dimensions;