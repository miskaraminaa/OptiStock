import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import TitleCard from "../../components/Cards/TitleCard";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import moment from "moment";
import * as XLSX from "xlsx";

const Livraison = () => {
    const dispatch = useDispatch();

    const [fileNames, setFileNames] = useState([]);
    const [selectedFile, setSelectedFile] = useState("");
    const [selectedType, setSelectedType] = useState("LE");
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        status: "",
        deliveryCode: "",
        articleCode: "",
    });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({});

    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    // Définitions des colonnes
    const LE_COLUMNS = [
        { header: "N° LE", key: "Document" },
        { header: "Statut Tâche Magasin", key: "Statut_tache_magasin" },
        { header: "Produit", key: "Produit" },
        { header: "Désignation Article", key: "designation_article" },
        { header: "Longueur", key: "longueur" },
        { header: "Largeur", key: "largeur" },
        { header: "Hauteur", key: "hauteur" },
        { header: "Volume", key: "volume" },
        { header: "Poids", key: "poids" },
        { header: "Quantité", key: "Quantite" },
        { header: "Poids Global", key: "poids_global" }, // Adjusted to match backend alias
        { header: "Volume/Quantité", key: "volume_quantite" }, // Adjusted to match backend alias
        { header: "Manutention", key: "manutention" },
        { header: "Type Rayon", key: "Type_Rayon" },
        { header: "Emplacement Cédant", key: "emplacement_cedant" },
        { header: "Emplacement Prenant", key: "Emplacement_prenant" },
        { header: "Emplacement Final EWM/Qte", key: "Emplacement_EWM_Qte", style: { width: '200px' } },
        { header: "Qte Théo Céd UQA", key: "Qte_theo_ced_UQA" },
        { header: "Qté Écart", key: "quantite_ecart" },
        { header: "Statut Activité Magasin", key: "statut_entree_stock" },
    ];

    const LS_COLUMNS = [
        { header: "N° LS", key: "Document" },
        { header: "Statut", key: "Statut_tache_magasin" },
        { header: "Produit", key: "Produit" },
        { header: "Désignation", key: "designation_article" },
        { header: "Emplacement Cédant", key: "Emplacement_cedant" },
        { header: "Emplacement Prenant", key: "Emplacement_prenant" },
        { header: "Emplacement EWM/Qte", key: "Emplacement_EWM_Qte" },
        { header: "Qte Théo Céd UQA", key: "Qte_theo_ced_UQA" },
        { header: "Quantité", key: "quantit" },
        { header: "Qté Écart", key: "quantite_ecart" },
        { header: "Statut Activité Magasin", key: "statut_entree_stock" },
    ];

    // Récupérer les noms de fichiers disponibles
    useEffect(() => {
        const fetchFiles = async () => {
            setIsLoadingFiles(true);
            setError(null);
            setFileNames([]);
            setSelectedFile("");
            const url = `${BASE_URL}/livraison/files`;
            console.log(`Récupération des fichiers depuis : ${url} avec le type : ${selectedType}`);
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: selectedType }),
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Erreur HTTP ! statut : ${res.status}, message : ${errorText}`);
                }
                const data = await res.json();
                setFileNames(data.files || []);
                if (data.files.length === 0) {
                    setError(`Aucun fichier disponible pour le type ${selectedType}.`);
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des fichiers :", err);
                setError(`Échec du chargement des noms de fichiers : ${err.message}`);
            } finally {
                setIsLoadingFiles(false);
            }
        };
        if (selectedType) fetchFiles();
    }, [BASE_URL, selectedType]);

    // Récupérer et filtrer les données
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            setError(null);
            const url = `${BASE_URL}/livraison/process`;
            const payload = {
                type: selectedType,
                fileName: selectedFile,
                value: filters.articleCode || "",
                stock: filters.status || "Tous les statuts",
            };
            console.log(`Récupération des données depuis : ${url} avec les données :`, payload);
            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Erreur HTTP ! statut : ${res.status}, message : ${errorText}`);
                }
                const data = await res.json();
                setData(data);
                applyFilters(data); // Apply filters immediately after fetching
            } catch (err) {
                console.error("Erreur lors de la récupération des données :", err);
                setError(`Échec du chargement des données : ${err.message}`);
            } finally {
                setIsLoadingData(false);
            }
        };

        const applyFilters = (data) => {
            let filtered = [...data];
            if (filters.articleCode) {
                filtered = filtered.filter((item) =>
                    item.Produit?.toString().toLowerCase().includes(filters.articleCode.toLowerCase())
                );
            }
            if (filters.status && filters.status !== "Tous les statuts") {
                filtered = filtered.filter((item) =>
                    item.statut_entree_stock?.toLowerCase() === filters.status.toLowerCase()
                );
            }
            setFilteredData(filtered);
        };

        if (selectedFile && selectedType) {
            fetchData();
        } else {
            setData([]);
            setFilteredData([]);
            if (!selectedFile && selectedType) {
                setError("Veuillez sélectionner un fichier pour charger les données.");
            }
        }
    }, [selectedFile, filters, BASE_URL, selectedType]);

    // Basculer la sélection d'un élément
    const toggleItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    // Ajouter ou supprimer des éléments
    const updateItems = (action) => {
        if (action === "add" && newItem) {
            const itemToAdd = {
                ...newItem,
                Document: newItem.Document || `LIV${moment().format("YYYYMMDDHHmmss")}`,
                Statut_tache_magasin: newItem.Statut_tache_magasin || "Non terminée",
                statut_entree_stock: newItem.statut_entree_stock || "Non terminée",
            };
            if (selectedType === 'LE') {
                itemToAdd.longueur = newItem.longueur || "100";
                itemToAdd.largeur = newItem.largeur || "50";
                itemToAdd.hauteur = newItem.hauteur || "20";
                itemToAdd.volume = newItem.volume || "100000";
                itemToAdd.poids = newItem.poids || "10";
                itemToAdd.Quantite = newItem.Quantite || "100";
                itemToAdd["Poids global"] = newItem.poids_global || "1000"; // Match backend alias
                itemToAdd["Volume quantite"] = newItem.volume_quantite || "1000"; // Match backend alias
                itemToAdd.manutention = newItem.manutention || "Manuel";
                itemToAdd.Type_Rayon = newItem.Type_Rayon || "Standard";
            }
            if (newItem.Qte_theo_ced_UQA && newItem.quantit) {
                itemToAdd.quantite_ecart = (parseFloat(newItem.Qte_theo_ced_UQA) - parseFloat(newItem.quantit)).toString();
            }
            const newData = [...filteredData, itemToAdd];
            setFilteredData(newData);
            setShowAddForm(false);
            setNewItem({});
        } else if (action === "remove" && selectedItems.size > 0) {
            const newData = [...filteredData];
            const indicesToRemove = Array.from(selectedItems).sort((a, b) => b - a);
            indicesToRemove.forEach((index) => newData.splice(index, 1));
            setSelectedItems(new Set());
            setFilteredData(newData);
        }
    };

    // Gérer la suppression
    const handleDelete = (index) => {
        const newData = [...filteredData];
        newData.splice(index, 1);
        setFilteredData(newData);
        setSelectedItems(new Set());
    };

    // Exporter vers Excel
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Livraisons");
        XLSX.writeFile(wb, `livraison_${moment().format("YYYYMMDD_HHmmss")}.xlsx`);
    };

    // Imprimer les données
    const handlePrint = () => {
        const printContent = document.getElementById("livraison-table").outerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head><title>Imprimer Livraison</title></head>
                <body>${printContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const columns = selectedType === 'LE' ? LE_COLUMNS : LS_COLUMNS;

    return (
        <TitleCard title="Livraison">
            <div className="grid grid-cols-1 gap-4">
                <div className="flex space-x-2 mb-4">
                    <select
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                            setSelectedFile("");
                            setFileNames([]);
                            setError(null);
                            setShowAddForm(false);
                            setNewItem({});
                        }}
                        className="p-2 border rounded"
                    >
                        <option value="LE">Livraison Entrante (LE)</option>
                        <option value="LS">Livraison Sortante (LS)</option>
                    </select>
                    <select
                        value={selectedFile}
                        onChange={(e) => {
                            setSelectedFile(e.target.value);
                            setError(null);
                            setShowAddForm(false);
                            setNewItem({});
                        }}
                        className="p-2 border rounded"
                        disabled={isLoadingFiles}
                    >
                        <option value="">{isLoadingFiles ? "Chargement des fichiers..." : "Sélectionner un fichier"}</option>
                        {fileNames.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="p-2 border rounded"
                    >
                        <option value="Tous les statuts">Tous les statuts</option>
                        <option value="Terminée">Terminée</option>
                        <option value="Non terminée">Non terminée</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Code article"
                        value={filters.articleCode}
                        onChange={(e) => setFilters({ ...filters, articleCode: e.target.value })}
                        className="p-2 border rounded"
                    />
                </div>
                {(error || isLoadingFiles || isLoadingData) && (
                    <div className="mb-4">
                        {isLoadingFiles && <div className="text-blue-500">Chargement des fichiers...</div>}
                        {isLoadingData && <div className="text-blue-500">Chargement des données...</div>}
                        {error && <div className="text-red-500">{error}</div>}
                    </div>
                )}
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        disabled={!selectedFile || isLoadingData}
                    >
                        {showAddForm ? "Annuler" : "Ajouter"}
                    </button>
                    <button
                        onClick={() => updateItems("remove")}
                        className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        disabled={selectedItems.size === 0 || isLoadingData}
                    >
                        Retirer
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                        disabled={isLoadingData}
                    >
                        Exporter Excel
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                        disabled={isLoadingData}
                    >
                        Imprimer
                    </button>
                </div>
                {showAddForm && (
                    <div className="mb-4 p-4 border rounded bg-gray-50">
                        <h3 className="text-lg font-semibold mb-2">Ajouter un nouvel article</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateItems("add");
                            }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <input
                                type="text"
                                placeholder="Document"
                                value={newItem.Document || ""}
                                onChange={(e) => setNewItem({ ...newItem, Document: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Produit"
                                value={newItem.Produit || ""}
                                onChange={(e) => setNewItem({ ...newItem, Produit: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Désignation Article"
                                value={newItem.designation_article || ""}
                                onChange={(e) => setNewItem({ ...newItem, designation_article: e.target.value })}
                                className="p-2 border rounded"
                            />
                           
                            
                            {selectedType === 'LE' && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Longueur"
                                        value={newItem.longueur || ""}
                                        onChange={(e) => setNewItem({ ...newItem, longueur: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Largeur"
                                        value={newItem.largeur || ""}
                                        onChange={(e) => setNewItem({ ...newItem, largeur: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Hauteur"
                                        value={newItem.hauteur || ""}
                                        onChange={(e) => setNewItem({ ...newItem, hauteur: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Volume"
                                        value={newItem.volume || ""}
                                        onChange={(e) => setNewItem({ ...newItem, volume: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Poids"
                                        value={newItem.poids || ""}
                                        onChange={(e) => setNewItem({ ...newItem, poids: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Quantité"
                                        value={newItem.Quantite || ""}
                                        onChange={(e) => setNewItem({ ...newItem, Quantite: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Poids Global"
                                        value={newItem["Poids global"] || ""}
                                        onChange={(e) => setNewItem({ ...newItem, "Poids global": e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Volume/Quantité"
                                        value={newItem["Volume quantite"] || ""}
                                        onChange={(e) => setNewItem({ ...newItem, "Volume quantite": e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Manutention"
                                        value={newItem.manutention || ""}
                                        onChange={(e) => setNewItem({ ...newItem, manutention: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Type Rayon"
                                        value={newItem.Type_Rayon || ""}
                                        onChange={(e) => setNewItem({ ...newItem, Type_Rayon: e.target.value })}
                                        className="p-2 border rounded"
                                    />
                                </>
                            )}
                        
                            <input
                                type="text"
                                placeholder={selectedType === 'LE' ? "Emplacement Cédant" : "Emplacement Cédant"}
                                value={newItem.emplacement_cedant || newItem.Emplacement_cedant || ""}
                                onChange={(e) => setNewItem({ ...newItem, [selectedType === 'LE' ? "emplacement_cedant" : "Emplacement_cedant"]: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Emplacement Prenant"
                                value={newItem.Emplacement_prenant || ""}
                                onChange={(e) => setNewItem({ ...newItem, Emplacement_prenant: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Emplacement EWM/Qte"
                                value={newItem.Emplacement_EWM_Qte || ""}
                                onChange={(e) => setNewItem({ ...newItem, Emplacement_EWM_Qte: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="number"
                                placeholder="Qte Théo Céd UQA"
                                value={newItem.Qte_theo_ced_UQA || ""}
                                onChange={(e) => setNewItem({ ...newItem, Qte_theo_ced_UQA: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Quantité"
                                value={newItem.quantit || ""}
                                onChange={(e) => setNewItem({ ...newItem, quantit: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Qté Écart"
                                value={newItem.quantite_ecart || ""}
                                readOnly
                                className="p-2 border rounded bg-gray-100"
                            />
                            <select
                                value={newItem.Statut_tache_magasin || "Non terminée"}
                                onChange={(e) => setNewItem({ ...newItem, Statut_tache_magasin: e.target.value })}
                                className="p-2 border rounded"
                            >
                                <option value="Non terminée">Non terminée</option>
                                <option value="Terminée">Terminée</option>
                            </select>
                            <select
                                value={newItem.statut_entree_stock || "Non terminée"}
                                onChange={(e) => setNewItem({ ...newItem, statut_entree_stock: e.target.value })}
                                className="p-2 border rounded"
                            >
                                <option value="Non terminée">Non terminée</option>
                                <option value="Terminée">Terminée</option>
                            </select>
                            <button
                                type="submit"
                                className="col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                disabled={isLoadingData}
                            >
                                Ajouter l'article
                            </button>
                        </form>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table id="livraison-table" className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">
                                    <input
                                        type="checkbox"
                                        onChange={(e) =>
                                            setSelectedItems(
                                                e.target.checked
                                                    ? new Set(filteredData.map((_, i) => i))
                                                    : new Set()
                                            )
                                        }
                                        disabled={isLoadingData}
                                    />
                                </th>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-4 py-2" style={col.style || {}}>
                                        {col.header}
                                    </th>
                                ))}
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row, index) => (
                                <tr
                                    key={index}
                                    className={`${selectedItems.has(index) ? "bg-gray-100" : ""} border-b hover:bg-gray-50`}
                                >
                                    <td className="px-4 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(index)}
                                            onChange={() => toggleItem(index)}
                                            disabled={isLoadingData}
                                        />
                                    </td>
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-2" style={col.style || {}}>
                                            {row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : ""}
                                        </td>
                                    ))}
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-red-500 hover:text-red-700"
                                            disabled={isLoadingData}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TitleCard>
    );
};

export default Livraison;