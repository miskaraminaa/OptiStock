import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { FaTrash } from 'react-icons/fa';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { setPageTitle } from '../../features/common/headerSlice';
import TitleCard from '../../components/Cards/TitleCard';

const Controle = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        nOt: '',
        bs: '',
        typeSortie: '',
        dateLivraison: '',
    });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        type_sortie: 'OT',
        nature_sortie: 'normal',
        magasin: 'Magasin',
        articles: [],
        date_livraison: moment().format('YYYY-MM-DD'),
    });
    const [mb51Articles, setMb51Articles] = useState([]);
    const [articleFilter, setArticleFilter] = useState('');
    const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const COLUMNS = [
        { header: 'Date Livraison', key: 'date_livraison' },
        { header: 'N° OT', key: 'n_ot' },
        { header: 'N° BS', key: 'bs' },
        { header: 'N° LE', key: 'le' },
        { header: 'N° STO', key: 'commande_achat' },
        { header: 'Nature de sortie', key: 'nature_sortie' },
        { header: 'Type de sortie', key: 'type_sortie' },
        { header: 'N° Réservation', key: 'n_reservation' },
        { header: 'Magasin', key: 'magasin' },
        { header: 'Local', key: 'local' },
        { header: 'Demandeur', key: 'demandeur' },
        { header: 'Préparateur', key: 'preparateur' },
        { header: 'Responsable local', key: 'responsable_local' },
        { header: 'Articles', key: 'articles' },
    ];

    const STOCK_COLUMNS = [
        { header: 'Article', key: 'article' },
        { header: 'Désignation', key: 'designation_article' },
        { header: 'Stock Initial', key: 'stock_initial' },
        { header: 'Sorties', key: 'sorties' },
        { header: 'Entrées', key: 'entrees' },
        { header: 'Quantité Contrôle', key: 'stock_quantite_controle' },
        { header: 'Quantité IAM', key: 'quantite_iam' },
        { header: 'Validation', key: 'validation' },
    ];

    const TYPE_SORTIE_OPTIONS = [
        { value: 'OT', label: 'OT' },
        { value: 'BS', label: 'BS' },
        { value: 'LE', label: 'LE' },
        { value: 'STO', label: 'STO' },
    ];

    const NATURE_SORTIE_OPTIONS = [
        { value: 'urgent', label: 'Urgent' },
        { value: 'normal', label: 'Normal' },
        { value: 'session', label: 'Session' },
    ];

    const MAGASIN_OPTIONS = [
        { value: 'Magasin', label: 'Magasin' },
        { value: 'Magasin EPI', label: 'Magasin EPI' },
        { value: 'Parc Exterieur', label: 'Parc Exterieur' },
    ];

    const LOCAL_OPTIONS = {
        Magasin: [
            { value: 'MSLE', label: 'MSLE/MSLT - BOUZIT LAHSSAN', responsable: 'BOUZIT LAHSSAN' },
            { value: 'MSLV', label: 'MSLV/MSRL/MSGP/MSLL/MSPC/DSED - BENDADA MOHAMMED', responsable: 'BENDADA MOHAMMED' },
        ],
        'Magasin EPI': [{ value: 'MSFE', label: 'MSFE - BOUALLAK NOURDINE', responsable: 'BOUALLAK NOURDINE' }],
        'Parc Exterieur': [{ value: 'PEXT', label: 'PEXT/el kouhail abdelmajid', responsable: 'el kouhail abdelmajid' }],
    };

    const RESPONSABLE_MAGASIN = {
        Magasin: 'JAMAL RHENNAOUI',
        'Magasin EPI': 'ELBAHI AMINE',
        'Parc Exterieur': 'SARGALI YOUSSEF',
    };

    useEffect(() => {
        dispatch(setPageTitle({ title: 'Contrôle Livraison' }));
    }, [dispatch]);

    const fetchMb51Articles = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/controle/mb51/articles`);
            if (!res.ok) {
                throw new Error(`Erreur HTTP ! Statut : ${res.status}`);
            }
            const articles = await res.json();
            setMb51Articles(articles.map(article => ({
                ...article,
                stock_quantite_controle: parseFloat(article.stock_quantite_controle) || 0,
            })));
            if (articles.length === 0) {
                setError('Aucun article trouvé dans la réponse de l\'API.');
            }
        } catch (err) {
            setError(`Échec du chargement des articles : ${err.message}`);
            console.error('[Controle] Erreur articles:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/controle/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters),
            });
            if (!res.ok) throw new Error(`Erreur HTTP ! Statut : ${res.status}`);
            const data = await res.json();
            const normalizedData = data.map((item) => ({
                ...item,
                n_ot: item.n_ot ? item.n_ot.trim().toLowerCase() : '',
                bs: item.bs ? item.bs.trim().toLowerCase() : '',
                le: item.le ? item.le.trim().toLowerCase() : '',
                commande_achat: item.commande_achat ? item.commande_achat.trim() : '',
                nature_sortie: item.nature_sortie ? item.nature_sortie.trim() : '',
                type_sortie: item.type_sortie ? item.type_sortie.trim() : '',
                n_reservation: item.n_reservation ? item.n_reservation.trim() : '',
                magasin: item.magasin ? item.magasin.trim() : '',
                local: item.local ? item.local.trim() : '',
                demandeur: item.demandeur ? item.demandeur.trim() : '',
                preparateur: item.preparateur ? item.preparateur.trim() : '',
                responsable_local: item.responsable_local ? item.responsable_local.trim() : '',
                articles: Array.isArray(item.articles) ? item.articles : (typeof item.articles === 'string' ? JSON.parse(item.articles || '[]') : []),
                date_livraison: item.date_livraison || 'N/V',
            }));
            setData(normalizedData);
            applyFilters(normalizedData);
        } catch (err) {
            setError(`Échec du chargement des données : ${err.message}`);
            console.error('[Controle] Erreur data:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchMb51Articles();
    }, [filters]);

    const applyFilters = (data) => {
        let filtered = [...data];
        if (filters.nOt) {
            filtered = filtered.filter((item) => item.n_ot?.toLowerCase().includes(filters.nOt.toLowerCase()));
        }
        if (filters.bs) {
            filtered = filtered.filter((item) => item.bs?.toLowerCase().includes(filters.bs.toLowerCase()));
        }
        if (filters.typeSortie) {
            filtered = filtered.filter((item) => item.type_sortie === filters.typeSortie);
        }
        if (filters.dateLivraison) {
            filtered = filtered.filter((item) => item.date_livraison === filters.dateLivraison);
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
        if (!mb51Articles.length) {
            setError('Les articles ne sont pas encore chargés. Veuillez réessayer.');
            return;
        }
        if (!newItem.articles.some((a) => a.article === article)) {
            setNewItem((prev) => ({
                ...prev,
                articles: [...prev.articles, { article, designation_article, quantity: 0, quantite_mise_a_jour: 0 }],
            }));
            setError(null);
        }
    };

    const updateQuantity = (index, value) => {
        const updatedArticles = [...newItem.articles];
        const quantity = parseFloat(value) || 0;
        if (quantity < 0) {
            setError('La quantité ne peut pas être négative.');
            return;
        }
        const mb51Article = mb51Articles.find((a) => a.article === updatedArticles[index].article);
        if (mb51Article && quantity > mb51Article.stock_quantite_controle) {
            setError(`Quantité pour ${updatedArticles[index].article} dépasse la quantité contrôle (${mb51Article.stock_quantite_controle})`);
            return;
        }
        updatedArticles[index].quantity = quantity;
        updatedArticles[index].quantite_mise_a_jour = (mb51Article?.stock_quantite_controle || 0) - quantity;
        setNewItem((prev) => ({ ...prev, articles: updatedArticles }));
        setError(null);
    };

    const removeArticle = (index) => {
        const updatedArticles = [...newItem.articles];
        updatedArticles.splice(index, 1);
        setNewItem((prev) => ({ ...prev, articles: updatedArticles }));
        setError(null);
    };

    const updateItems = async (action) => {
        try {
            if (action === 'add' && newItem) {
                if (!newItem.articles || newItem.articles.length === 0) {
                    throw new Error('Au moins un article doit être fourni.');
                }
                if (!newItem.date_livraison) {
                    throw new Error('La date de livraison est requise.');
                }
                for (const article of newItem.articles) {
                    if (!article.article || article.quantity <= 0) {
                        throw new Error(`L'article ${article.article || 'inconnu'} doit avoir une quantité positive.`);
                    }
                    const mb51Article = mb51Articles.find((a) => a.article === article.article);
                    if (!mb51Article) {
                        throw new Error(`L'article ${article.article} n'est pas disponible dans le stock.`);
                    }
                    if (article.quantity > mb51Article.stock_quantite_controle) {
                        throw new Error(`Quantité pour ${article.article} dépasse la quantité contrôle (${mb51Article.stock_quantite_controle}).`);
                    }
                }

                const selectedLocal = LOCAL_OPTIONS[newItem.magasin]?.find((loc) => loc.value === newItem.local);
                let { n_ot = '', bs = '', le = '', commande_achat = '' } = newItem;

                if (newItem.type_sortie === 'OT' && (!n_ot || n_ot.trim() === '')) {
                    n_ot = `OT${moment().format('YYYYMMDDHHmmss')}`;
                }
                if (newItem.type_sortie === 'BS' && (!bs || bs.trim() === '')) {
                    bs = `BS${moment().format('YYYYMMDDHHmmss')}`;
                }
                if (newItem.type_sortie === 'LE' && (!le || le.trim() === '')) {
                    le = `LE${moment().format('YYYYMMDDHHmmss')}`;
                }
                if (newItem.type_sortie === 'STO' && (!commande_achat || commande_achat.trim() === '')) {
                    commande_achat = `STO${moment().format('YYYYMMDDHHmmss')}`;
                }

                if (newItem.type_sortie === 'OT' && !n_ot) throw new Error('Le N° OT est requis pour un type de sortie OT.');
                if (newItem.type_sortie === 'BS' && !bs) throw new Error('Le BS est requis pour un type de sortie BS.');
                if (newItem.type_sortie === 'LE' && !le) throw new Error('Le LE est requis pour un type de sortie LE.');
                if (newItem.type_sortie === 'STO' && !commande_achat) throw new Error("La commande d'achat est requise pour un type de sortie STO.");

                const itemToAdd = {
                    ...newItem,
                    n_ot,
                    bs,
                    le,
                    commande_achat,
                    responsable_local: selectedLocal?.responsable || newItem.responsable_local || '',
                    magasin: newItem.magasin || 'Magasin',
                    date_livraison: newItem.date_livraison,
                    articles: newItem.articles.map((a) => ({
                        article: a.article,
                        designation_article: a.designation_article,
                        quantity: parseFloat(a.quantity) || 0,
                        quantite_mise_a_jour: a.quantite_mise_a_jour || 0,
                    })),
                };
                setIsLoadingData(true);
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'add', data: itemToAdd }),
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Erreur lors de l'ajout");
                }
                setShowAddForm(false);
                setNewItem({ type_sortie: 'OT', nature_sortie: 'normal', magasin: 'Magasin', articles: [], date_livraison: moment().format('YYYY-MM-DD') });
                setArticleFilter('');
                setError(null);
                await fetchData();
            } else if (action === 'remove' && selectedItems.size > 0) {
                const recordsToRemove = Array.from(selectedItems)
                    .map((index) => {
                        const row = filteredData[index];
                        if (!row) return null;

                        let identifier;
                        switch (row.type_sortie) {
                            case 'OT':
                                identifier = row.n_ot;
                                break;
                            case 'BS':
                                identifier = row.bs;
                                break;
                            case 'LE':
                                identifier = row.le;
                                break;
                            case 'STO':
                                identifier = row.commande_achat;
                                break;
                            default:
                                return null;
                        }

                        if (!identifier || identifier.trim() === '') return null;
                        return { type_sortie: row.type_sortie, identifier };
                    })
                    .filter((record) => record !== null);

                if (recordsToRemove.length === 0) {
                    throw new Error('Aucun identifiant valide sélectionné pour la suppression.');
                }

                setIsDeleting(true);
                const res = await fetch(`${BASE_URL}/controle/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'remove', data: recordsToRemove }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Erreur lors de la suppression');
                }

                setSelectedItems(new Set());
                setError(null);
                await fetchData();
            } else {
                throw new Error('Aucune action valide ou aucun élément sélectionné.');
            }
        } catch (err) {
            setError(`Échec de la mise à jour : ${err.message}`);
            console.error('[Controle] Erreur update:', err);
        } finally {
            setIsDeleting(false);
            setIsLoadingData(false);
        }
    };

    const handleDelete = async (index) => {
        try {
            const row = filteredData[index];
            if (!row) {
                throw new Error('Enregistrement invalide pour la suppression.');
            }

            let identifier;
            let identifierField;
            switch (row.type_sortie) {
                case 'OT':
                    identifier = row.n_ot;
                    identifierField = 'n_ot';
                    break;
                case 'BS':
                    identifier = row.bs;
                    identifierField = 'bs';
                    break;
                case 'LE':
                    identifier = row.le;
                    identifierField = 'le';
                    break;
                case 'STO':
                    identifier = row.commande_achat;
                    identifierField = 'commande_achat';
                    break;
                default:
                    throw new Error(`Type de sortie non reconnu: ${row.type_sortie}`);
            }

            if (!identifier || identifier.trim() === '') {
                throw new Error(`Identifiant ${identifierField} invalide pour la suppression.`);
            }

            setIsDeleting(true);
            const res = await fetch(`${BASE_URL}/controle/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'remove',
                    data: [{ type_sortie: row.type_sortie, identifier }],
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erreur lors de la suppression');
            }

            setError(null);
            await fetchData();
        } catch (err) {
            setError(`Échec de la suppression : ${err.message}`);
            console.error('[Controle] Erreur delete:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const exportLivraisonsToExcel = () => {
        const livraisonsSheet = XLSX.utils.json_to_sheet(
            filteredData.map((row) => ({
                ...row,
                articles: Array.isArray(row.articles) ? row.articles.map((a) => `${a.article} (${a.quantity})`).join(', ') : '',
                date_livraison: row.date_livraison && row.date_livraison !== 'N/V' ? moment(row.date_livraison).format('DD/MM/YYYY') : 'N/V',
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, livraisonsSheet, 'Controle Livraisons');
        XLSX.writeFile(wb, `controle_livraisons_${filters.dateLivraison || moment().format('YYYYMMDD')}.xlsx`);
    };

    const exportStockToExcel = () => {
        const stockSheet = XLSX.utils.json_to_sheet(mb51Articles);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, stockSheet, 'Stock Control');
        XLSX.writeFile(wb, `stock_control_${moment().format('YYYYMMDD')}.xlsx`);
    };

    const handlePrintLivraisons = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <html>
                <head>
                    <title>Contrôle Livraisons - ${filters.dateLivraison || moment().format('DD/MM/YYYY')}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { font-family: 'Inter', sans-serif; margin: 20px; color: #1f2937; }
                        h1 { text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
                        h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
                        p { text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 1.25rem; }
                        table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 1.25rem; }
                        th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
                        th { background-color: #f3f4f6; font-weight: 600; text-transform: uppercase; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        .no-data { text-align: center; padding: 1.25rem; font-style: italic; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <h1>Contrôle Livraisons</h1>
                    <p>Imprimé le ${moment().format('DD/MM/YYYY HH:mm')} pour la date ${filters.dateLivraison ? moment(filters.dateLivraison).format('DD/MM/YYYY') : 'Toutes'}</p>
                    <h2>Livraisons</h2>
                    <table>
                        <thead>
                            <tr>${COLUMNS.map((col) => `<th>${col.header}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${filteredData.length === 0
                ? `<tr><td colspan="${COLUMNS.length}" class="no-data">Aucune donnée disponible pour les filtres sélectionnés.</td></tr>`
                : filteredData.map(
                    (row) => `
                                        <tr>
                                            ${COLUMNS.map(
                        (col) => `
                                                <td>
                                                    ${col.key === 'articles' && row[col.key]
                                ? Array.isArray(row.articles)
                                    ? row.articles.map((a) => `${a.article} (${a.quantity})`).join(', ')
                                    : ''
                                : col.key === 'date_livraison' && row[col.key] !== 'N/V'
                                    ? moment(row[col.key]).format('DD/MM/YYYY')
                                    : row[col.key] || ''}
                                                </td>
                                            `
                    ).join('')}
                                        </tr>
                                    `
                ).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const handlePrintStock = () => {
        const printWindow = window.open('', '_blank');
        const printContent = `
            <html>
                <head>
                    <title>Stock Control - ${moment().format('DD/MM/YYYY')}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { font-family: 'Inter', sans-serif; margin: 20px; color: #1f2937; }
                        h1 { text-align: center; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
                        h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
                        p { text-align: center; font-size: 0.875rem; color: #6b7280; margin-bottom: 1.25rem; }
                        table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-bottom: 1.25rem; }
                        th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
                        th { background-color: #f3f4f6; font-weight: 600; text-transform: uppercase; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        .no-data { text-align: center; padding: 1.25rem; font-style: italic; color: #6b7280; }
                        .validation-non-valide { color: #dc2626; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <h1>Stock Control</h1>
                    <p>Imprimé le ${moment().format('DD/MM/YYYY HH:mm')}</p>
                    <h2>Stock Control</h2>
                    <table>
                        <thead>
                            <tr>${STOCK_COLUMNS.map((col) => `<th>${col.header}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${mb51Articles.length === 0
                ? `<tr><td colspan="${STOCK_COLUMNS.length}" class="no-data">Aucun article disponible.</td></tr>`
                : mb51Articles.map(
                    (row) => `
                                        <tr>
                                            ${STOCK_COLUMNS.map(
                        (col) => `
                                                <td class="${col.key === 'validation' && row[col.key] !== 'Validé' ? 'validation-non-valide' : ''}">
                                                    ${row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : ''}
                                                </td>
                                            `
                    ).join('')}
                                        </tr>
                                    `
                ).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const filteredArticles = mb51Articles.filter((article) =>
        article.article?.toLowerCase().includes(articleFilter.toLowerCase()) ||
        article.designation_article?.toLowerCase().includes(articleFilter.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6"
        >
            <TitleCard title="Contrôle Livraison">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                        <input
                            type="text"
                            placeholder="N° OT"
                            value={filters.nOt}
                            onChange={(e) => setFilters({ ...filters, nOt: e.target.value })}
                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-48"
                        />
                        <input
                            type="text"
                            placeholder="N° BS"
                            value={filters.bs}
                            onChange={(e) => setFilters({ ...filters, bs: e.target.value })}
                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-48"
                        />
                        <select
                            value={filters.typeSortie}
                            onChange={(e) => setFilters({ ...filters, typeSortie: e.target.value })}
                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-48"
                        >
                            <option value="">Tous les types</option>
                            {TYPE_SORTIE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={filters.dateLivraison}
                            onChange={(e) => setFilters({ ...filters, dateLivraison: e.target.value })}
                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-48"
                        />
                    </div>
                    {(isLoadingData || isDeleting || error) && (
                        <div className="flex items-center gap-2 text-sm">
                            {(isLoadingData || isDeleting) && <ClipLoader color="#3b82f6" size={20} />}
                            {(isLoadingData || isDeleting) && <span className="text-gray-600">{isDeleting ? 'Suppression en cours...' : 'Chargement des données...'}</span>}
                            {error && <span className="text-red-600">⚠️ {error}</span>}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                            disabled={isLoadingData || isDeleting}
                        >
                            {showAddForm ? 'Annuler' : 'Ajouter'}
                        </button>
                        <button
                            onClick={() => updateItems('remove')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                            disabled={selectedItems.size === 0 || isLoadingData || isDeleting}
                        >
                            Retirer
                        </button>
                        <button
                            onClick={exportLivraisonsToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                            disabled={isLoadingData || isDeleting}
                        >
                            Exporter Livraisons
                        </button>
                        <button
                            onClick={exportStockToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-all duration-200 text-sm font-medium"
                            disabled={isLoadingData || isDeleting}
                        >
                            Exporter Stock
                        </button>
                        <button
                            onClick={handlePrintLivraisons}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-700 transition-all duration-200 text-sm font-medium"
                            disabled={isLoadingData || isDeleting}
                        >
                            Imprimer Livraisons
                        </button>
                        <button
                            onClick={handlePrintStock}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-700 transition-all duration-200 text-sm font-medium"
                            disabled={isLoadingData || isDeleting}
                        >
                            Imprimer Stock
                        </button>
                    </div>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="p-6 bg-white shadow-lg rounded-lg"
                        >
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter une nouvelle livraison</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    updateItems('add');
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison</label>
                                    <input
                                        type="date"
                                        value={newItem.date_livraison}
                                        onChange={(e) => setNewItem({ ...newItem, date_livraison: e.target.value })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de sortie</label>
                                    <select
                                        value={newItem.type_sortie}
                                        onChange={(e) =>
                                            setNewItem({ ...newItem, type_sortie: e.target.value, n_ot: '', bs: '', le: '', commande_achat: '' })
                                        }
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    >
                                        {TYPE_SORTIE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {newItem.type_sortie === 'OT' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° OT</label>
                                        <input
                                            type="text"
                                            placeholder="N° OT"
                                            value={newItem.n_ot || ''}
                                            onChange={(e) => setNewItem({ ...newItem, n_ot: e.target.value })}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                            required
                                        />
                                    </div>
                                )}
                                {newItem.type_sortie === 'BS' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° BS</label>
                                        <input
                                            type="text"
                                            placeholder="N° BS"
                                            value={newItem.bs || ''}
                                            onChange={(e) => setNewItem({ ...newItem, bs: e.target.value })}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                            required
                                        />
                                    </div>
                                )}
                                {newItem.type_sortie === 'LE' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° LE</label>
                                        <input
                                            type="text"
                                            placeholder="N° LE"
                                            value={newItem.le || ''}
                                            onChange={(e) => setNewItem({ ...newItem, le: e.target.value })}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                            required
                                        />
                                    </div>
                                )}
                                {newItem.type_sortie === 'STO' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">N° STO</label>
                                        <input
                                            type="text"
                                            placeholder="N° STO"
                                            value={newItem.commande_achat || ''}
                                            onChange={(e) => setNewItem({ ...newItem, commande_achat: e.target.value })}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nature de sortie</label>
                                    <select
                                        value={newItem.nature_sortie}
                                        onChange={(e) => setNewItem({ ...newItem, nature_sortie: e.target.value })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    >
                                        {NATURE_SORTIE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Réservation</label>
                                    <input
                                        type="text"
                                        placeholder="N° Réservation"
                                        value={newItem.n_reservation || ''}
                                        onChange={(e) => setNewItem({ ...newItem, n_reservation: e.target.value })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Magasin</label>
                                    <select
                                        value={newItem.magasin}
                                        onChange={(e) => setNewItem({ ...newItem, magasin: e.target.value, local: '', responsable_local: '' })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    >
                                        {MAGASIN_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label} - {RESPONSABLE_MAGASIN[option.value]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                                    <select
                                        value={newItem.local}
                                        onChange={(e) => {
                                            const selectedLocal = LOCAL_OPTIONS[newItem.magasin]?.find((loc) => loc.value === e.target.value);
                                            setNewItem({
                                                ...newItem,
                                                local: e.target.value,
                                                responsable_local: selectedLocal?.responsable || '',
                                            });
                                        }}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                        disabled={!newItem.magasin}
                                    >
                                        <option value="">Sélectionner un local</option>
                                        {newItem.magasin &&
                                            LOCAL_OPTIONS[newItem.magasin]?.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Demandeur</label>
                                    <input
                                        type="text"
                                        placeholder="Demandeur"
                                        value={newItem.demandeur || ''}
                                        onChange={(e) => setNewItem({ ...newItem, demandeur: e.target.value })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Préparateur</label>
                                    <input
                                        type="text"
                                        placeholder="Préparateur"
                                        value={newItem.preparateur || ''}
                                        onChange={(e) => setNewItem({ ...newItem, preparateur: e.target.value })}
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsable local</label>
                                    <input
                                        type="text"
                                        placeholder="Responsable local"
                                        value={newItem.responsable_local || ''}
                                        readOnly
                                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-sm w-full"
                                    />
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <h4 className="text-md font-semibold text-gray-800 mb-2">Ajouter des articles</h4>
                                    <div className="flex flex-col gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Filtrer par code ou désignation"
                                            value={articleFilter}
                                            onChange={(e) => setArticleFilter(e.target.value)}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                        />
                                        <select
                                            onChange={(e) => {
                                                const [article, designation_article] = e.target.value.split(' - ');
                                                if (article && designation_article) {
                                                    addArticle(article, designation_article);
                                                }
                                                e.target.value = '';
                                            }}
                                            className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                                            disabled={mb51Articles.length === 0}
                                        >
                                            <option value="">Sélectionner un article</option>
                                            {filteredArticles.length > 0 ? (
                                                filteredArticles.map((mb51Article) => (
                                                    <option key={mb51Article.article} value={`${mb51Article.article} - ${mb51Article.designation_article}`}>
                                                        {mb51Article.article} - {mb51Article.designation_article} (Quantité Contrôle: {mb51Article.stock_quantite_controle || 0})
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled>Aucun article correspondant</option>
                                            )}
                                        </select>
                                    </div>
                                    {newItem.articles.length > 0 && (
                                        <div className="mt-2 overflow-x-auto">
                                            <table className="w-full text-sm border-collapse bg-white shadow-lg rounded-lg">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Code</th>
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Désignation</th>
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Quantité Contrôle</th>
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Quantité</th>
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Quantité Mise à Jour</th>
                                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {newItem.articles.map((article, index) => {
                                                        const mb51Article = mb51Articles.find((a) => a.article === article.article);
                                                        return (
                                                            <tr key={article.article} className="hover:bg-gray-50">
                                                                <td className="border border-gray-200 p-2">{article.article}</td>
                                                                <td className="border border-gray-200 p-2">{article.designation_article}</td>
                                                                <td className="border border-gray-200 p-2">{mb51Article?.stock_quantite_controle || 0}</td>
                                                                <td className="border border-gray-200 p-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={article.quantity}
                                                                        onChange={(e) => updateQuantity(index, e.target.value)}
                                                                        className="p-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-20"
                                                                        placeholder="Quantité"
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-200 p-2">{article.quantite_mise_a_jour !== undefined ? article.quantite_mise_a_jour : 0}</td>
                                                                <td className="border border-gray-200 p-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeArticle(index)}
                                                                        className="text-red-600 hover:text-red-700 transition-colors duration-200"
                                                                    >
                                                                        <FaTrash className="h-4 w-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {newItem.articles.length === 0 && <p className="text-gray-600 text-sm italic">Aucun article sélectionné.</p>}
                                </div>
                                <button
                                    type="submit"
                                    className="col-span-1 sm:col-span-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                                    disabled={isLoadingData || isDeleting || newItem.articles.length === 0}
                                >
                                    Ajouter la livraison
                                </button>
                            </form>
                        </motion.div>
                    )}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Livraisons</h3>
                        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-200 p-2">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => setSelectedItems(e.target.checked ? new Set(filteredData.map((_, i) => i)) : new Set())}
                                                disabled={isLoadingData || isDeleting}
                                            />
                                        </th>
                                        {COLUMNS.map((col) => (
                                            <th key={col.key} className="border border-gray-200 p-2 text-left text-gray-700">
                                                {col.header}
                                            </th>
                                        ))}
                                        <th className="border border-gray-200 p-2 text-left text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLUMNS.length + 2} className="border border-gray-200 p-2 text-center text-gray-600">
                                                Aucune donnée disponible pour les filtres sélectionnés.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((row, index) => (
                                            <tr key={index} className={`${selectedItems.has(index) ? 'bg-gray-50' : ''} hover:bg-gray-50`}>
                                                <td className="border border-gray-200 p-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(index)}
                                                        onChange={() => toggleItem(index)}
                                                        disabled={isLoadingData || isDeleting}
                                                    />
                                                </td>
                                                {COLUMNS.map((col) => (
                                                    <td key={col.key} className="border border-gray-200 p-2">
                                                        {col.key === 'articles' && row[col.key]
                                                            ? Array.isArray(row.articles)
                                                                ? row.articles.map((a) => `${a.article} (${a.quantity})`).join(', ')
                                                                : ''
                                                            : col.key === 'date_livraison' && row[col.key] !== 'N/V'
                                                                ? moment(row[col.key]).format('DD/MM/YYYY')
                                                                : row[col.key] || ''}
                                                    </td>
                                                ))}
                                                <td className="border border-gray-200 p-2">
                                                    <button
                                                        onClick={() => handleDelete(index)}
                                                        className="text-red-600 hover:text-red-700 transition-colors duration-200"
                                                        disabled={isLoadingData || isDeleting}
                                                    >
                                                        <FaTrash className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Stock Control</h3>
                        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        {STOCK_COLUMNS.map((col) => (
                                            <th key={col.key} className="border border-gray-200 p-2 text-left text-gray-700">
                                                {col.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {mb51Articles.length === 0 ? (
                                        <tr>
                                            <td colSpan={STOCK_COLUMNS.length} className="border border-gray-200 p-2 text-center text-gray-600">
                                                Aucun article disponible.
                                            </td>
                                        </tr>
                                    ) : (
                                        mb51Articles.map((row, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                {STOCK_COLUMNS.map((col) => (
                                                    <td
                                                        key={col.key}
                                                        className={`border border-gray-200 p-2 ${col.key === 'validation' && row[col.key] !== 'Validé' ? 'text-red-600 font-semibold' : ''}`}
                                                    >
                                                        {row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </TitleCard>
        </motion.div>
    );
};

export default Controle;