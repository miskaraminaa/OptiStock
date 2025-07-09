import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import TitleCard from "../../components/Cards/TitleCard";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import moment from "moment";
import * as XLSX from "xlsx";

const Controle = () => {
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        nOt: "",
        bs: "",
        typeSortie: "",
    });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({});

    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const COLUMNS = [
        { header: "N° OT", key: "n_ot" },
        { header: "BS", key: "bs" },
        { header: "Commande d'achat", key: "commande_achat" },
        { header: "Nature de sortie", key: "nature_sortie" },
        { header: "Type de sortie", key: "type_sortie" },
        { header: "N° Réservation", key: "n_reservation" },
        { header: "Local", key: "local" },
        { header: "Demandeur", key: "demandeur" },
        { header: "Préparateur", key: "preparateur" },
        { header: "Responsable local", key: "responsable_local" },
    ];

    const TYPE_SORTIE_OPTIONS = [
        { value: "", label: "Tous les types" },
        { value: "BS", label: "BS" },
        { value: "OT", label: "OT" },
        { value: "cmd", label: "Commande" },
        { value: "MDR", label: "MDR" },
    ];

    const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        const url = `${BASE_URL}/controle/data`;
        const payload = {
            nOt: filters.nOt || "",
            bs: filters.bs || "",
            typeSortie: filters.typeSortie || "",
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
            console.log("Données brutes reçues du backend :", data);
            const normalizedData = data.map(item => ({
                ...item,
                n_ot: item.n_ot ? item.n_ot.trim().toLowerCase() : "",
                bs: item.bs ? item.bs.trim().toLowerCase() : "",
                type_sortie: item.type_sortie ? item.type_sortie.trim().toLowerCase() : "",
                commande_achat: item.commande_achat ? item.commande_achat.trim() : "",
                nature_sortie: item.nature_sortie ? item.nature_sortie.trim() : "",
                n_reservation: item.n_reservation ? item.n_reservation.trim() : "",
                local: item.local ? item.local.trim() : "",
                demandeur: item.demandeur ? item.demandeur.trim() : "",
                preparateur: item.preparateur ? item.preparateur.trim() : "",
                responsable_local: item.responsable_local ? item.responsable_local.trim() : "",
            }));
            setData(normalizedData);
            applyFilters(normalizedData);
        } catch (err) {
            console.error("Erreur lors de la récupération des données :", err);
            setError(`Échec du chargement des données : ${err.message}`);
        } finally {
            setIsLoadingData(false);
        }
    };

    const applyFilters = (data) => {
        let filtered = [...data];
        if (filters.nOt) {
            filtered = filtered.filter((item) =>
                item.n_ot?.toLowerCase().includes(filters.nOt.toLowerCase())
            );
        }
        if (filters.bs) {
            filtered = filtered.filter((item) =>
                item.bs?.toLowerCase().includes(filters.bs.toLowerCase())
            );
        }
        if (filters.typeSortie) {
            filtered = filtered.filter((item) =>
                item.type_sortie?.toLowerCase() === filters.typeSortie.toLowerCase()
            );
        }
        console.log("Données après filtrage :", filtered);
        setFilteredData(filtered);
    };

    useEffect(() => {
        fetchData();
    }, [filters, BASE_URL]);

    const toggleItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const updateItems = async (action) => {
        try {
            if (action === "add" && newItem) {
                if (!newItem.n_ot.match(/^OT\d+$/)) {
                    setError("N° OT doit commencer par 'OT' suivi de chiffres.");
                    return;
                }
                const itemToAdd = {
                    ...newItem,
                    n_ot: newItem.n_ot || `OT${moment().format("YYYYMMDDHHmmss")}`,
                    bs: newItem.bs || "",
                    commande_achat: newItem.commande_achat || "",
                    nature_sortie: newItem.nature_sortie || "",
                    type_sortie: newItem.type_sortie || "BS",
                    n_reservation: newItem.n_reservation || "",
                    local: newItem.local || "",
                    demandeur: newItem.demandeur || "",
                    preparateur: newItem.preparateur || "",
                    responsable_local: newItem.responsable_local || "",
                };
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "add", data: itemToAdd }),
                });
                if (!res.ok) {
                    const errorText = await res.json();
                    throw new Error(errorText.error || "Erreur lors de l'ajout");
                }
                setShowAddForm(false);
                setNewItem({});
                await fetchData(); // Refresh data
            } else if (action === "remove" && selectedItems.size > 0) {
                const nOtsToRemove = Array.from(selectedItems).map(index => filteredData[index].n_ot);
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "remove", data: nOtsToRemove }),
                });
                if (!res.ok) {
                    const errorText = await res.json();
                    throw new Error(errorText.error || "Erreur lors de la suppression");
                }
                setSelectedItems(new Set());
                await fetchData(); // Refresh data
            }
        } catch (err) {
            console.error("Erreur lors de la mise à jour :", err);
            setError(`Échec de la mise à jour : ${err.message}`);
        }
    };

    const handleDelete = async (index) => {
        try {
            const nOtToRemove = filteredData[index].n_ot;
            const res = await fetch(`${BASE_URL}/controle/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", data: [nOtToRemove] }),
            });
            if (!res.ok) {
                const errorText = await res.json();
                throw new Error(errorText.error || "Erreur lors de la suppression");
            }
            setSelectedItems(new Set());
            await fetchData(); // Refresh data
        } catch (err) {
            console.error("Erreur lors de la suppression :", err);
            setError(`Échec de la suppression : ${err.message}`);
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Controle Livraisons");
        XLSX.writeFile(wb, `controle_livraison_${moment().format("YYYYMMDD_HHmmss")}.xlsx`);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <html>
                <head>
                    <title>Contrôle Livraison - ${moment().format("DD/MM/YYYY HH:mm")}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                            color: #000;
                        }
                        h1 {
                            text-align: center;
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        p {
                            text-align: center;
                            font-size: 14px;
                            color: #555;
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 12px;
                        }
                        th, td {
                            border: 1px solid #000;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f0f0f0;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .no-data {
                            text-align: center;
                            padding: 20px;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <h1>Contrôle Livraison</h1>
                    <p>Imprimé le ${moment().format("DD/MM/YYYY HH:mm")}</p>
                    <table>
                        <thead>
                            <tr>
                                ${COLUMNS.map(col => `<th>${col.header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.length === 0
                ? '<tr><td colspan="' + COLUMNS.length + '" class="no-data">Aucune donnée disponible pour les filtres sélectionnés.</td></tr>'
                : filteredData.map(row => `
                                        <tr>
                                            ${COLUMNS.map(col => `
                                                <td>${row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : ''}</td>
                                            `).join('')}
                                        </tr>
                                    `).join('')
            }
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <TitleCard title="Contrôle Livraison">
            <div className="grid grid-cols-1 gap-4">
                <div className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        placeholder="N° OT"
                        value={filters.nOt}
                        onChange={(e) => setFilters({ ...filters, nOt: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="BS"
                        value={filters.bs}
                        onChange={(e) => setFilters({ ...filters, bs: e.target.value })}
                        className="p-2 border rounded"
                    />
                    <select
                        value={filters.typeSortie}
                        onChange={(e) => setFilters({ ...filters, typeSortie: e.target.value })}
                        className="p-2 border rounded"
                    >
                        {TYPE_SORTIE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                {(error || isLoadingData) && (
                    <div className="mb-4">
                        {isLoadingData && <div className="text-blue-500">Chargement des données...</div>}
                        {error && <div className="text-red-500">{error}</div>}
                    </div>
                )}
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        disabled={isLoadingData}
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
                        <h3 className="text-lg font-semibold mb-2">Ajouter une nouvelle livraison</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateItems("add");
                            }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <input
                                type="text"
                                placeholder="N° OT"
                                value={newItem.n_ot || ""}
                                onChange={(e) => setNewItem({ ...newItem, n_ot: e.target.value })}
                                className="p-2 border rounded"
                                required
                            />
                            <input
                                type="text"
                                placeholder="BS"
                                value={newItem.bs || ""}
                                onChange={(e) => setNewItem({ ...newItem, bs: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Commande d'achat"
                                value={newItem.commande_achat || ""}
                                onChange={(e) => setNewItem({ ...newItem, commande_achat: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Nature de sortie"
                                value={newItem.nature_sortie || ""}
                                onChange={(e) => setNewItem({ ...newItem, nature_sortie: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <select
                                value={newItem.type_sortie || "BS"}
                                onChange={(e) => setNewItem({ ...newItem, type_sortie: e.target.value })}
                                className="p-2 border rounded"
                            >
                                {TYPE_SORTIE_OPTIONS.filter(option => option.value !== "").map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="N° Réservation"
                                value={newItem.n_reservation || ""}
                                onChange={(e) => setNewItem({ ...newItem, n_reservation: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Local"
                                value={newItem.local || ""}
                                onChange={(e) => setNewItem({ ...newItem, local: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Demandeur"
                                value={newItem.demandeur || ""}
                                onChange={(e) => setNewItem({ ...newItem, demandeur: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Préparateur"
                                value={newItem.preparateur || ""}
                                onChange={(e) => setNewItem({ ...newItem, preparateur: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Responsable local"
                                value={newItem.responsable_local || ""}
                                onChange={(e) => setNewItem({ ...newItem, responsable_local: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <button
                                type="submit"
                                className="col-span-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                                disabled={isLoadingData}
                            >
                                Ajouter la livraison
                            </button>
                        </form>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table id="controle-table" className="w-full text-sm text-left text-gray-500">
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
                                {COLUMNS.map((col) => (
                                    <th key={col.key} className="px-4 py-2">
                                        {col.header}
                                    </th>
                                ))}
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={COLUMNS.length + 2} className="px-4 py-2 text-center text-gray-500">
                                        Aucune donnée disponible pour les filtres sélectionnés.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, index) => (
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
                                        {COLUMNS.map((col) => (
                                            <td key={col.key} className="px-4 py-2">
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TitleCard>
    );
};

export default Controle;