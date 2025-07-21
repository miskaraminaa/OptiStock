const express = require('express');
const pool = require('../config/db');
const moment = require('moment');

const router = express.Router();

// Log to confirm router is loaded
console.log('controleRouter loaded');

// Endpoint for /controle/data
router.post('/data', async (req, res) => {
    console.log('Handling POST /data');
    const { nOt, bs, typeSortie, dateLivraison } = req.body;
    try {
        const query = `
            SELECT n_ot, bs, le, commande_achat, nature_sortie, type_sortie, n_reservation, magasin, local, 
                   demandeur, preparateur, responsable_local, COALESCE(articles, '[]') as articles, date_livraison
            FROM controle_livraisons
            WHERE (? IS NULL OR n_ot LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR bs LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR type_sortie = ?)
            AND (? IS NULL OR DATE(date_livraison) = ? OR date_livraison IS NULL)
            ORDER BY date_livraison DESC, n_ot ASC
        `;
        const params = [nOt || null, nOt || null, bs || null, bs || null, typeSortie || null, typeSortie || null, dateLivraison || null, dateLivraison || null];
        const [rows] = await pool.execute(query, params);
        const sanitizedRows = rows.map(row => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles || '[]') : (row.articles || []),
            date_livraison: row.date_livraison ? moment(row.date_livraison).format('YYYY-MM-DD') : null
        }));
        res.json(sanitizedRows);
    } catch (err) {
        console.error('Erreur lors de la récupération des données:', err.stack);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des données', details: err.message });
    }
});

// Endpoint for /mb51/articles
router.get('/mb51/articles', async (req, res) => {
    console.log('Handling GET /mb51/articles');
    try {
        const [rows] = await pool.execute(
            `SELECT
                article,
                designation_article,
                magasin,
                CASE WHEN stock_initial = 0 THEN 'N/V' ELSE stock_initial END AS stock_initial,
                CASE WHEN sorties = 0 THEN 'N/V' ELSE sorties END AS sorties,
                CASE WHEN entrees = 0 THEN 'N/V' ELSE entrees END AS entrees,
                CASE WHEN quantite_iam = 0 THEN 'N/V' ELSE quantite_iam END AS quantite_iam,
                (stock_initial_calc + entrees_calc - sorties_calc) AS stock_quantite_controle,
                CASE
                    WHEN ROUND(stock_initial_calc + entrees_calc - sorties_calc, 2) = ROUND(quantite_iam_calc, 2) THEN 'Validé'
                    ELSE '-'
                END AS validation
            FROM (
                SELECT
                    le.Produit AS article,
                    le.Designation_produit AS designation_article,
                    si.magasin,
                    COALESCE((
                        SELECT SUM(mig.Qté_validée_SAP)
                        FROM migration mig
                        WHERE mig.SAP_Material = le.Produit
                        AND mig.Qté_validée_SAP IS NOT NULL
                    ), 0) AS stock_initial,
                    COALESCE((
                        SELECT SUM(mig.Qté_validée_SAP)
                        FROM migration mig
                        WHERE mig.SAP_Material = le.Produit
                        AND mig.Qté_validée_SAP IS NOT NULL
                    ), 0) AS stock_initial_calc,
                    COALESCE((
                        SELECT SUM(ls.Qte_reelle_pren_UQA)
                        FROM ls_tache ls
                        WHERE ls.Produit = CAST(le.Produit AS SIGNED)
                        AND ls.Qte_reelle_pren_UQA IS NOT NULL
                    ), 0) AS sorties,
                    COALESCE((
                        SELECT SUM(ls.Qte_reelle_pren_UQA)
                        FROM ls_tache ls
                        WHERE ls.Produit = CAST(le.Produit AS SIGNED)
                        AND ls.Qte_reelle_pren_UQA IS NOT NULL
                    ), 0) AS sorties_calc,
                    COALESCE((
                        SELECT SUM(le2.Qte_theo_ced_UQA)
                        FROM le_tache le2
                        WHERE le2.Produit = le.Produit
                        AND le2.Qte_theo_ced_UQA IS NOT NULL
                    ), 0) AS entrees,
                    COALESCE((
                        SELECT SUM(le2.Qte_theo_ced_UQA)
                        FROM le_tache le2
                        WHERE le2.Produit = le.Produit
                        AND le2.Qte_theo_ced_UQA IS NOT NULL
                    ), 0) AS entrees_calc,
                    COALESCE((
                        SELECT SUM(stock_utilisation_libre)
                        FROM stock_iam si2
                        WHERE si2.numero_article = le.Produit
                        AND si2.magasin = si.magasin
                        AND si2.stock_utilisation_libre IS NOT NULL
                    ), 0) AS quantite_iam,
                    COALESCE((
                        SELECT SUM(stock_utilisation_libre)
                        FROM stock_iam si2
                        WHERE si2.numero_article = le.Produit
                        AND si2.magasin = si.magasin
                        AND si2.stock_utilisation_libre IS NOT NULL
                    ), 0) AS quantite_iam_calc
                FROM le_tache le
                LEFT JOIN ls_tache ls ON CAST(le.Produit AS SIGNED) = ls.Produit
                LEFT JOIN stock_iam si ON le.Produit = si.numero_article
                GROUP BY le.Produit, le.Designation_produit, si.magasin
                UNION
                SELECT
                    CAST(ls.Produit AS CHAR) AS article,
                    ls.Designation_produit AS designation_article,
                    si.magasin,
                    COALESCE((
                        SELECT SUM(mig.Qté_validée_SAP)
                        FROM migration mig
                        WHERE mig.SAP_Material = CAST(ls.Produit AS CHAR)
                        AND mig.Qté_validée_SAP IS NOT NULL
                    ), 0) AS stock_initial,
                    COALESCE((
                        SELECT SUM(mig.Qté_validée_SAP)
                        FROM migration mig
                        WHERE mig.SAP_Material = CAST(ls.Produit AS CHAR)
                        AND mig.Qté_validée_SAP IS NOT NULL
                    ), 0) AS stock_initial_calc,
                    COALESCE((
                        SELECT SUM(ls2.Qte_reelle_pren_UQA)
                        FROM ls_tache ls2
                        WHERE ls2.Produit = ls.Produit
                        AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                    ), 0) AS sorties,
                    COALESCE((
                        SELECT SUM(ls2.Qte_reelle_pren_UQA)
                        FROM ls_tache ls2
                        WHERE ls2.Produit = ls.Produit
                        AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                    ), 0) AS sorties_calc,
                    COALESCE((
                        SELECT SUM(le2.Qte_theo_ced_UQA)
                        FROM le_tache le2
                        WHERE le2.Produit = CAST(ls.Produit AS CHAR)
                        AND le2.Qte_theo_ced_UQA IS NOT NULL
                    ), 0) AS entrees,
                    COALESCE((
                        SELECT SUM(le2.Qte_theo_ced_UQA)
                        FROM le_tache le2
                        WHERE le2.Produit = CAST(ls.Produit AS CHAR)
                        AND le2.Qte_theo_ced_UQA IS NOT NULL
                    ), 0) AS entrees_calc,
                    COALESCE((
                        SELECT SUM(stock_utilisation_libre)
                        FROM stock_iam si2
                        WHERE si2.numero_article = CAST(ls.Produit AS CHAR)
                        AND si2.magasin = si.magasin
                        AND si2.stock_utilisation_libre IS NOT NULL
                    ), 0) AS quantite_iam,
                    COALESCE((
                        SELECT SUM(stock_utilisation_libre)
                        FROM stock_iam si2
                        WHERE si2.numero_article = CAST(ls.Produit AS CHAR)
                        AND si2.magasin = si.magasin
                        AND si2.stock_utilisation_libre IS NOT NULL
                    ), 0) AS quantite_iam_calc
                FROM ls_tache ls
                LEFT JOIN le_tache le ON ls.Produit = CAST(le.Produit AS SIGNED)
                LEFT JOIN stock_iam si ON CAST(ls.Produit AS CHAR) = si.numero_article
                WHERE le.Produit IS NULL
                GROUP BY ls.Produit, ls.Designation_produit, si.magasin
            ) AS subquery
            ORDER BY article ASC, magasin ASC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for /controle/update
router.post('/update', async (req, res) => {
    console.log('Handling POST /update');
    const { action, data } = req.body;
    console.log('Received data:', data);
    try {
        if (action === 'add') {
            const {
                n_ot, bs, le, commande_achat, nature_sortie, type_sortie,
                n_reservation, magasin, local, demandeur, preparateur, responsable_local, articles, date_livraison
            } = data;

            // Generate default values based on type_sortie
            const defaultN_ot = type_sortie === 'OT' && (!n_ot || n_ot.trim() === '') ? `OT${moment().format('YYYYMMDDHHmmss')}` : n_ot || null;
            const defaultBs = type_sortie === 'BS' && (!bs || bs.trim() === '') ? `BS${moment().format('YYYYMMDDHHmmss')}` : bs || null;
            const defaultLe = type_sortie === 'LE' && (!le || le.trim() === '') ? `LE${moment().format('YYYYMMDDHHmmss')}` : le || null;
            const defaultCommande_achat = type_sortie === 'STO' && (!commande_achat || commande_achat.trim() === '') ? `STO${moment().format('YYYYMMDDHHmmss')}` : commande_achat || null;

            // Validation
            if (type_sortie === 'OT' && !defaultN_ot) {
                return res.status(400).json({ error: "Le N° OT est requis pour un type de sortie OT." });
            }
            if (type_sortie === 'BS' && !defaultBs) {
                return res.status(400).json({ error: "Le BS est requis pour un type de sortie BS." });
            }
            if (type_sortie === 'LE' && !defaultLe) {
                return res.status(400).json({ error: "Le LE est requis pour un type de sortie LE." });
            }
            if (type_sortie === 'STO' && !defaultCommande_achat) {
                return res.status(400).json({ error: "La commande d'achat est requise pour un type de sortie STO." });
            }
            if (!date_livraison) {
                return res.status(400).json({ error: "La date de livraison est requise." });
            }

            // Fetch available stock data
            const [stockRows] = await pool.execute(
                `SELECT 
                    article,
                    COALESCE(SUM(stock_initial + entrees - sorties), 0) AS stock_quantite_controle
                FROM (
                    SELECT 
                        le.Produit AS article,
                        COALESCE((
                            SELECT SUM(mig.Qté_validée_SAP)
                            FROM migration mig
                            WHERE mig.SAP_Material = le.Produit
                            AND mig.Qté_validée_SAP IS NOT NULL
                        ), 0) AS stock_initial,
                        COALESCE((
                            SELECT SUM(ls.Qte_reelle_pren_UQA)
                            FROM ls_tache ls
                            WHERE ls.Produit = le.Produit
                            AND ls.Qte_reelle_pren_UQA IS NOT NULL
                        ), 0) AS sorties,
                        COALESCE((
                            SELECT SUM(le2.Qte_theo_ced_UQA)
                            FROM le_tache le2
                            WHERE le2.Produit = le.Produit
                            AND le2.Qte_theo_ced_UQA IS NOT NULL
                        ), 0) AS entrees
                    FROM le_tache le
                    WHERE le.Produit IN (${articles.map(() => '?').join(',')})
                    GROUP BY le.Produit
                    UNION
                    SELECT 
                        CAST(ls.Produit AS CHAR) AS article,
                        COALESCE((
                            SELECT SUM(mig.Qté_validée_SAP)
                            FROM migration mig
                            WHERE mig.SAP_Material = CAST(ls.Produit AS CHAR)
                            AND mig.Qté_validée_SAP IS NOT NULL
                        ), 0) AS stock_initial,
                        COALESCE((
                            SELECT SUM(ls2.Qte_reelle_pren_UQA)
                            FROM ls_tache ls2
                            WHERE ls2.Produit = ls.Produit
                            AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                        ), 0) AS sorties,
                        COALESCE((
                            SELECT SUM(le2.Qte_theo_ced_UQA)
                            FROM le_tache le2
                            WHERE le2.Produit = CAST(ls.Produit AS CHAR)
                            AND le2.Qte_theo_ced_UQA IS NOT NULL
                        ), 0) AS entrees
                    FROM ls_tache ls
                    WHERE ls.Produit IN (${articles.map(() => '?').join(',')})
                    GROUP BY ls.Produit
                    UNION
                    SELECT 
                        mig.SAP_Material AS article,
                        COALESCE(SUM(mig.Qté_validée_SAP), 0) AS stock_initial,
                        COALESCE((
                            SELECT SUM(ls2.Qte_reelle_pren_UQA)
                            FROM ls_tache ls2
                            WHERE ls2.Produit = mig.SAP_Material
                            AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                        ), 0) AS sorties,
                        COALESCE((
                            SELECT SUM(le2.Qte_theo_ced_UQA)
                            FROM le_tache le2
                            WHERE le2.Produit = mig.SAP_Material
                            AND le2.Qte_theo_ced_UQA IS NOT NULL
                        ), 0) AS entrees
                    FROM migration mig
                    WHERE mig.SAP_Material IN (${articles.map(() => '?').join(',')})
                    AND mig.Qté_validée_SAP IS NOT NULL
                    GROUP BY mig.SAP_Material
                ) AS stock_data
                GROUP BY article`,
                [...articles.map(a => a.article), ...articles.map(a => a.article), ...articles.map(a => a.article)]
            );

            const stockMap = new Map(stockRows.map(row => [row.article, parseFloat(row.stock_quantite_controle) || 0]));

            // Validate articles
            if (!articles || !Array.isArray(articles) || articles.length === 0) {
                return res.status(400).json({ error: "Au moins un article doit être fourni." });
            }
            const validationErrors = [];
            const updatedArticles = articles.map(article => {
                const availableQuantity = stockMap.get(article.article) || 0;
                const requestedQuantity = parseFloat(article.quantity) || 0;
                if (availableQuantity <= 0) {
                    validationErrors.push(`L'article ${article.article} n'a pas de quantité positive disponible.`);
                }
                if (requestedQuantity > availableQuantity) {
                    validationErrors.push(`La quantité saisie (${requestedQuantity}) pour l'article ${article.article} dépasse la quantité disponible (${availableQuantity}).`);
                }
                return {
                    ...article,
                    quantite_mise_a_jour: availableQuantity - requestedQuantity
                };
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({ error: validationErrors.join("; ") });
            }

            const query = `
                INSERT INTO controle_livraisons (
                    n_ot, bs, le, commande_achat, nature_sortie, type_sortie,
                    n_reservation, magasin, local, demandeur, preparateur, responsable_local, articles, date_livraison
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                defaultN_ot,
                defaultBs,
                defaultLe,
                defaultCommande_achat,
                nature_sortie || 'normal',
                type_sortie || 'OT',
                n_reservation || null,
                magasin || 'Magasin',
                local || null,
                demandeur || null,
                preparateur || null,
                responsable_local || null,
                JSON.stringify(updatedArticles || []),
                date_livraison || null
            ];
            await pool.execute(query, params);
            res.json({ success: true, message: 'Livraison ajoutée avec succès', articles: updatedArticles });
        } else if (action === 'remove') {
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Liste des identifiants vide ou invalide');
            }

            await pool.query('START TRANSACTION');
            try {
                for (const record of data) {
                    const { type_sortie, identifier } = record;
                    if (!type_sortie || !identifier) {
                        throw new Error('Type de sortie ou identifiant manquant');
                    }

                    let query;
                    let param;
                    switch (type_sortie) {
                        case 'OT':
                            query = `DELETE FROM controle_livraisons WHERE type_sortie = 'OT' AND n_ot = ?`;
                            param = identifier;
                            break;
                        case 'BS':
                            query = `DELETE FROM controle_livraisons WHERE type_sortie = 'BS' AND bs = ?`;
                            param = identifier;
                            break;
                        case 'LE':
                            query = `DELETE FROM controle_livraisons WHERE type_sortie = 'LE' AND le = ?`;
                            param = identifier;
                            break;
                        case 'STO':
                            query = `DELETE FROM controle_livraisons WHERE type_sortie = 'STO' AND commande_achat = ?`;
                            param = identifier;
                            break;
                        default:
                            throw new Error(`Type de sortie non reconnu: ${type_sortie}`);
                    }

                    const [result] = await pool.execute(query, [param]);
                    if (result.affectedRows === 0) {
                        console.warn(`Aucun enregistrement trouvé pour type_sortie: ${type_sortie}, identifiant: ${param}`);
                    }
                }

                await pool.query('COMMIT');
                res.json({ success: true, message: 'Livraisons supprimées avec succès' });
            } catch (err) {
                await pool.query('ROLLBACK');
                throw err;
            }
        } else {
            throw new Error('Action non reconnue. Utilisez "add" ou "remove".');
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour:', err.stack);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour', details: err.message });
    }
});
module.exports = router;