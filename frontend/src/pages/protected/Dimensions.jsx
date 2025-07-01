import React, { useState, useEffect, useRef } from "react";
import TitleCard from "../../components/Cards/TitleCard";
import * as XLSX from 'xlsx';

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

    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const tableRef = useRef(null);

    // Fetch article IDs
    useEffect(() => {
        const fetchIds = async () => {
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
            }
        };
        fetchIds();
    }, [BASE_URL]);

    // Fetch all dimensions
    useEffect(() => {
        const fetchDimensions = async () => {
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
                setData(result.data[0]); // Fixed: Correctly set the data state
                const dimensionsRes = await fetch(`${BASE_URL}/dimensions/`);
                const dimensionsResult = await dimensionsRes.json();
                setDimensions(dimensionsResult.data || []);
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
            printWindow.document.write('<html><head><title>Print</title>');
            printWindow.document.write('<style>body { margin: 0; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
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

    return (
        <TitleCard title="Gestion des Dimensions">
            <div className="p-6 bg-white rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 no-print">Ajouter/Modifier Dimensions</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Article</label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            step="1"
                            min="1"
                            required
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-4">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
                {message && <p className="mt-4 text-sm text-center text-red-600 no-print">{message}</p>}
                {data && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md shadow-inner no-print">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Données enregistrées</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <p><span className="font-medium">ID Article:</span> {data.id_article}</p>
                            <p><span className="font-medium">Longueur:</span> {data.longueur} m</p>
                            <p><span className="font-medium">Largeur:</span> {data.largeur} m</p>
                            <p><span className="font-medium">Hauteur:</span> {data.hauteur} m</p>
                            <p><span className="font-medium">Poids:</span> {data.poids} kg</p>
                            <p><span className="font-medium">Quantité:</span> {data.quantite}</p>
                            <p><span className="font-medium">Volume:</span> {data.volume} m³</p>
                            <p><span className="font-medium">Volume/Quantité:</span> {data.volume_quantite} m³</p>
                            <p><span className="font-medium">Poids Global:</span> {data.poids_global} kg</p>
                            <p><span className="font-medium">Type Rayon:</span> {data.Type_Rayon}</p>
                            <p><span className="font-medium">Manutention:</span> {data.manutention}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Explorer les Dimensions</h2>
                    <div className="mb-4 flex space-x-4">
                        <button
                            onClick={handleExportExcel}
                            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                        >
                            Exporter en Excel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Imprimer
                        </button>
                    </div>
                    {dimensions.length > 0 ? (
                        <div className="overflow-x-auto print-table">
                            <table ref={tableRef} className="min-w-full bg-white border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">ID Article</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Longueur (m)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Largeur (m)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Hauteur (m)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Poids (kg)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Quantité</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Volume (m³)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Volume/Quantité (m³)</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Type Rayon</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Manutention</th>
                                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Poids Global (kg)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dimensions.map((dim) => (
                                        <tr key={dim.id_article} className="hover:bg-gray-50">
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.id_article}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.longueur}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.largeur}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.hauteur}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.poids}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.quantite}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.volume}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.volume_quantite}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.Type_Rayon}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.manutention}</td>
                                            <td className="py-2 px-4 border-b text-sm text-gray-900">{dim.poids_global}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">Aucune dimension enregistrée.</p>
                    )}
                </div>
            </div>
        </TitleCard>
    );
};

export default Dimensions;