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
    const [newItem, setNewItem] = useState({
        type_sortie: "OT",
        nature_sortie: "normal",
        magasin: "Magasin",
        articles: [], // Array of { article, designation_article, quantity }
    });
    const [mb51Articles, setMb51Articles] = useState([]); // Store articles from mb51

    const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const COLUMNS = [
        { header: "N° OT", key: "n_ot" },
        { header: "N° BS", key: "bs" },
        { header: "N° LE", key: "le" },
        { header: "N° STO", key: "commande_achat" },
        { header: "Nature de sortie", key: "nature_sortie" },
        { header: "Type de sortie", key: "type_sortie" },
        { header: "N° Réservation", key: "n_reservation" },
        { header: "Magasin", key: "magasin" },
        { header: "Local", key: "local" },
        { header: "Demandeur", key: "demandeur" },
        { header: "Préparateur", key: "preparateur" },
        { header: "Responsable local", key: "responsable_local" },
        { header: "Articles", key: "articles" },
    ];

    const TYPE_SORTIE_OPTIONS = [
        { value: "OT", label: "OT" },
        { value: "BS", label: "BS" },
        { value: "LE", label: "LE" },
        { value: "STO", label: "STO" },
    ];

    const NATURE_SORTIE_OPTIONS = [
        { value: "urgent", label: "Urgent" },
        { value: "normal", label: "Normal" },
        { value: "session", label: "Session" },
    ];

    const MAGASIN_OPTIONS = [
        { value: "Magasin", label: "Magasin" },
        { value: "Magasin EPI", label: "Magasin EPI" },
        { value: "Parc Exterieur", label: "Parc Exterieur" },
    ];

    const LOCAL_OPTIONS = {
        "Magasin": [
            { value: "MSLE", label: "MSLE/MSLT - BOUZIT LAHSSAN", responsable: "BOUZIT LAHSSAN" },
            { value: "MSLV", label: "MSLV/MSRL/MSGP/MSLL/MSPC/DSED - BENDADA MOHAMMED", responsable: "BENDADA MOHAMMED" },
        ],
        "Magasin EPI": [
            { value: "MSFE", label: "MSFE - BOUALLAK NOURDINE", responsable: "BOUALLAK NOURDINE" },
        ],
        "Parc Exterieur": [
            { value: "PEXT", label: "PEXT/el kouhail abdelmajid", responsable: "el kouhail abdelmajid" },
        ],
    };

    const RESPONSABLE_MAGASIN = {
        "Magasin": "JAMAL RHENNAOUI",
        "Magasin EPI": "ELBAHI AMINE",
        "Parc Exterieur": "SARGALI YOUSSEF",
    };

    const fetchMb51Articles = async () => {
        try {
            const res = await fetch(`${BASE_URL}/controle/mb51/articles`);
            console.log('Fetch response:', res.status, res.statusText);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const articles = await res.json();
            console.log('Fetched articles:', articles);
            setMb51Articles(articles);
        } catch (err) {
            setError(`Échec du chargement des articles : ${err.message}`);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMb51Articles();
    }, [filters]);

    const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        const url = `${BASE_URL}/controle/data`;
        const payload = {
            nOt: filters.nOt || "",
            bs: filters.bs || "",
            typeSortie: filters.typeSortie || "",
        };
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`Erreur HTTP ! statut : ${res.status}`);
            const data = await res.json();
            const normalizedData = data.map(item => ({
                ...item,
                n_ot: item.n_ot ? item.n_ot.trim().toLowerCase() : "",
                bs: item.bs ? item.bs.trim().toLowerCase() : "",
                le: item.le ? item.le.trim().toLowerCase() : "",
                commande_achat: item.commande_achat ? item.commande_achat.trim() : "",
                nature_sortie: item.nature_sortie ? item.nature_sortie.trim() : "",
                type_sortie: item.type_sortie ? item.type_sortie.trim().toLowerCase() : "",
                n_reservation: item.n_reservation ? item.n_reservation.trim() : "",
                magasin: item.magasin ? item.magasin.trim() : "",
                local: item.local ? item.local.trim() : "",
                demandeur: item.demandeur ? item.demandeur.trim() : "",
                preparateur: item.preparateur ? item.preparateur.trim() : "",
                responsable_local: item.responsable_local ? item.responsable_local.trim() : "",
                articles: typeof item.articles === 'string' ? JSON.parse(item.articles || '[]') : item.articles || [],
            }));
            setData(normalizedData);
            applyFilters(normalizedData);
        } catch (err) {
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
        setFilteredData(filtered);
    };

    const toggleItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const addArticle = (article, designation_article) => {
        if (!newItem.articles.some(a => a.article === article)) {
            setNewItem(prev => ({
                ...prev,
                articles: [...prev.articles, { article, designation_article, quantity: 0 }],
            }));
        }
    };

    const updateQuantity = (index, value) => {
        const updatedArticles = [...newItem.articles];
        updatedArticles[index].quantity = value || 0;
        setNewItem(prev => ({
            ...prev,
            articles: updatedArticles,
        }));
    };

    const removeArticle = (index) => {
        const updatedArticles = [...newItem.articles];
        updatedArticles.splice(index, 1);
        setNewItem(prev => ({
            ...prev,
            articles: updatedArticles,
        }));
    };

    const updateItems = async (action) => {
        try {
            if (action === "add" && newItem) {
                const selectedLocal = LOCAL_OPTIONS[newItem.magasin]?.find(loc => loc.value === newItem.local);
                console.log('New Item before validation:', newItem); // Debug log
                // Validate and set default values
                let n_ot = newItem.n_ot || '';
                let bs = newItem.bs || '';
                let le = newItem.le || '';
                let commande_achat = newItem.commande_achat || '';

                if (newItem.type_sortie === "OT" && (!n_ot || n_ot.trim() === '')) {
                    n_ot = `OT${moment().format("YYYYMMDDHHmmss")}`;
                    console.log('Generated n_ot:', n_ot); // Debug log
                }
                if (newItem.type_sortie === "BS" && (!bs || bs.trim() === '')) {
                    bs = `BS${moment().format("YYYYMMDDHHmmss")}`;
                }
                if (newItem.type_sortie === "LE" && (!le || le.trim() === '')) {
                    le = `LE${moment().format("YYYYMMDDHHmmss")}`;
                }
                if (newItem.type_sortie === "STO" && (!commande_achat || commande_achat.trim() === '')) {
                    commande_achat = `STO${moment().format("YYYYMMDDHHmmss")}`;
                }

                if (newItem.type_sortie === "OT" && !n_ot) {
                    throw new Error("Le N° OT est requis pour un type de sortie OT.");
                }
                if (newItem.type_sortie === "BS" && !bs) {
                    throw new Error("Le BS est requis pour un type de sortie BS.");
                }
                if (newItem.type_sortie === "LE" && !le) {
                    throw new Error("Le LE est requis pour un type de sortie LE.");
                }
                if (newItem.type_sortie === "STO" && !commande_achat) {
                    throw new Error("La commande d'achat est requise pour un type de sortie STO.");
                }

                const itemToAdd = {
                    ...newItem,
                    n_ot,
                    bs,
                    le,
                    commande_achat,
                    responsable_local: selectedLocal?.responsable || newItem.responsable_local || "",
                    magasin: newItem.magasin || "Magasin",
                    articles: newItem.articles.map(a => ({
                        article: a.article,
                        designation_article: a.designation_article,
                        quantity: a.quantity || 0,
                    })),
                };
                console.log('Item to send:', itemToAdd); // Debug log
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "add", data: itemToAdd }),
                });
                if (!res.ok) throw new Error((await res.json()).error || "Erreur lors de l'ajout");
                setShowAddForm(false);
                setNewItem({ type_sortie: "OT", nature_sortie: "normal", magasin: "Magasin", articles: [] });
                await fetchData();
            } else if (action === "remove" && selectedItems.size > 0) {
                const nOtsToRemove = Array.from(selectedItems).map(index => filteredData[index].n_ot);
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "remove", data: nOtsToRemove }),
                });
                if (!res.ok) throw new Error((await res.json()).error || "Erreur lors de la suppression");
                setSelectedItems(new Set());
                await fetchData();
            }
        } catch (err) {
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
            if (!res.ok) throw new Error((await res.json()).error || "Erreur lors de la suppression");
            setSelectedItems(new Set());
            await fetchData();
        } catch (err) {
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
                        body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
                        h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
                        p { text-align: center; font-size: 14px; color: #555; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                        th { background-color: #f0f0f0; font-weight: bold; text-transform: uppercase; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .no-data { text-align: center; padding: 20px; font-style: italic; }
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
                                                <td>${col.key === 'articles' && row[col.key] ? (Array.isArray(row[col.key]) ? row[col.key].map(a => `${a.article} (${a.quantity})`).join(', ') : row[col.key]) : (row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '')}</td>
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
                        <option value="">Tous les types</option>
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
                            <select
                                value={newItem.type_sortie}
                                onChange={(e) => setNewItem({ ...newItem, type_sortie: e.target.value, n_ot: "", bs: "", le: "", commande_achat: "" })}
                                className="p-2 border rounded"
                            >
                                {TYPE_SORTIE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {newItem.type_sortie === "OT" && (
                                <input
                                    type="text"
                                    placeholder="N° OT"
                                    value={newItem.n_ot || ""}
                                    onChange={(e) => setNewItem({ ...newItem, n_ot: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                            )}
                            {newItem.type_sortie === "BS" && (
                                <input
                                    type="text"
                                    placeholder="BS"
                                    value={newItem.bs || ""}
                                    onChange={(e) => setNewItem({ ...newItem, bs: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                            )}
                            {newItem.type_sortie === "LE" && (
                                <input
                                    type="text"
                                    placeholder="LE"
                                    value={newItem.le || ""}
                                    onChange={(e) => setNewItem({ ...newItem, le: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                            )}
                            {newItem.type_sortie === "STO" && (
                                <input
                                    type="text"
                                    placeholder="STO"
                                    value={newItem.commande_achat || ""}
                                    onChange={(e) => setNewItem({ ...newItem, commande_achat: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                            )}
                            <select
                                value={newItem.nature_sortie}
                                onChange={(e) => setNewItem({ ...newItem, nature_sortie: e.target.value })}
                                className="p-2 border rounded"
                            >
                                {NATURE_SORTIE_OPTIONS.map((option) => (
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
                            <select
                                value={newItem.magasin}
                                onChange={(e) => setNewItem({ ...newItem, magasin: e.target.value, local: "", responsable_local: "" })}
                                className="p-2 border rounded"
                            >
                                {MAGASIN_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} - {RESPONSABLE_MAGASIN[option.value]}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={newItem.local}
                                onChange={(e) => {
                                    const selectedLocal = LOCAL_OPTIONS[newItem.magasin].find(loc => loc.value === e.target.value);
                                    setNewItem({
                                        ...newItem,
                                        local: e.target.value,
                                        responsable_local: selectedLocal?.responsable || ""
                                    });
                                }}
                                className="p-2 border rounded"
                            >
                                <option value="">Sélectionner un local</option>
                                {newItem.magasin && LOCAL_OPTIONS[newItem.magasin].map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
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
                                readOnly
                                className="p-2 border rounded bg-gray-100"
                            />
                            <div className="col-span-2">
                                <h4 className="text-md font-semibold mb-2">Ajouter des articles</h4>
                                <select
                                    onChange={(e) => {
                                        const [article, designation_article] = e.target.value.split(" - ");
                                        if (article && designation_article && !newItem.articles.some(a => a.article === article)) {
                                            addArticle(article, designation_article);
                                        }
                                        e.target.value = ""; // Reset dropdown
                                    }}
                                    className="p-2 border rounded w-full mb-2"
                                >
                                    <option value="">Sélectionner un article</option>
                                    {mb51Articles && mb51Articles.length > 0 ? (
                                        [...new Set(mb51Articles.map(a => a.article))].map(article => {
                                            const designation = mb51Articles.find(a => a.article === article)?.designation_article;
                                            return (
                                                <option key={article} value={`${article} - ${designation}`}>
                                                    {article} - {designation}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <option disabled>Aucun article disponible</option>
                                    )}
                                </select>
                                {newItem.articles.length > 0 && (
                                    <div className="mt-2 overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border p-2 text-left">Code</th>
                                                    <th className="border p-2 text-left">Désignation</th>
                                                    <th className="border p-2 text-left">Quantité</th>
                                                    <th className="border p-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {newItem.articles.map((article, index) => (
                                                    <tr key={article.article} className="hover:bg-gray-50">
                                                        <td className="border p-2">{article.article}</td>
                                                        <td className="border p-2">{article.designation_article}</td>
                                                        <td className="border p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={article.quantity}
                                                                onChange={(e) => updateQuantity(index, e.target.value)}
                                                                className="p-1 border rounded w-20"
                                                                placeholder="Quantité"
                                                            />
                                                        </td>
                                                        <td className="border p-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeArticle(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {newItem.articles.length === 0 && <p className="text-gray-500 italic">Aucun article sélectionné.</p>}
                            </div>
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
                                                {col.key === 'articles' && row[col.key] ? (Array.isArray(row[col.key]) ? row[col.key].map(a => `${a.article} (${a.quantity})`).join(', ') : JSON.parse(row[col.key]).map(a => `${a.article} (${a.quantity})`).join(', ')) : (row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '')}
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