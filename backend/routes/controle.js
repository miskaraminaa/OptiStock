const express = require('express');
const pool = require('../config/db');
const moment = require('moment');

const router = express.Router();

// Log to confirm router is loaded
console.log('controleRouter loaded');

// Endpoint for /controle/data
router.post('/data', async (req, res) => {
    console.log('Handling POST /data');
    const { nOt, bs, typeSortie } = req.body;
    try {
        const query = `
            SELECT n_ot, bs, le, commande_achat, nature_sortie, type_sortie, n_reservation, magasin, local, demandeur, preparateur, responsable_local, COALESCE(articles, '[]') as articles
            FROM controle_livraisons
            WHERE (? IS NULL OR n_ot LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR bs LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR type_sortie = ?)
        `;
        const params = [nOt || null, nOt || null, bs || null, bs || null, typeSortie || null, typeSortie || null];
        const [rows] = await pool.execute(query, params);
        const sanitizedRows = rows.map(row => ({
            ...row,
            articles: typeof row.articles === 'string' ? JSON.parse(row.articles || '[]') : (row.articles || [])
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
                stock_initial,
                sorties,
                entrees,
                quantite_iam,
                (stock_initial + entrees - sorties) AS stock_quantite_controle,
                CASE 
                    WHEN ROUND(stock_initial + entrees - sorties, 3) = ROUND(quantite_iam, 3) THEN 'Validé'
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
                        SELECT SUM(le2.Qte_reelle_pren_UQA)
                        FROM le_tache le2
                        WHERE le2.Produit = le.Produit
                        AND le2.Qte_reelle_pren_UQA IS NOT NULL
                    ), 0) AS sorties,
                    COALESCE((
                        SELECT SUM(le3.Qte_theo_ced_UQA) + COALESCE((
                            SELECT SUM(ls2.Qte_reelle_pren_UQA)
                            FROM ls_tache ls2
                            WHERE ls2.Produit = le.Produit
                            AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                        ), 0)
                        FROM le_tache le3
                        WHERE le3.Produit = le.Produit
                        AND le3.Qte_theo_ced_UQA IS NOT NULL
                    ), 0) AS entrees,
                    COALESCE((
                        SELECT SUM(stock_utilisation_libre)
                        FROM stock_iam si2
                        WHERE si2.numero_article = le.Produit
                        AND si2.magasin = si.magasin
                        AND si2.stock_utilisation_libre IS NOT NULL
                    ), 0) AS quantite_iam
                FROM le_tache le
                LEFT JOIN stock_iam si ON le.Produit = si.numero_article
                GROUP BY le.Produit, le.Designation_produit, si.magasin
            ) AS subquery
            WHERE (stock_initial + entrees - sorties) > 0
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
                n_reservation, magasin, local, demandeur, preparateur, responsable_local, articles
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

            // Fetch available stock data
            const [stockRows] = await pool.execute(
                `SELECT 
                    article,
                    magasin,
                    (stock_initial + entrees - sorties) AS stock_quantite_controle
                FROM (
                    SELECT 
                        le.Produit AS article,
                        si.magasin,
                        COALESCE((
                            SELECT SUM(mig.Qté_validée_SAP)
                            FROM migration mig
                            WHERE mig.SAP_Material = le.Produit
                            AND mig.Qté_validée_SAP IS NOT NULL
                        ), 0) AS stock_initial,
                        COALESCE((
                            SELECT SUM(le2.Qte_reelle_pren_UQA)
                            FROM le_tache le2
                            WHERE le2.Produit = le.Produit
                            AND le2.Qte_reelle_pren_UQA IS NOT NULL
                        ), 0) AS sorties,
                        COALESCE((
                            SELECT SUM(le3.Qte_theo_ced_UQA) + COALESCE((
                                SELECT SUM(ls2.Qte_reelle_pren_UQA)
                                FROM ls_tache ls2
                                WHERE ls2.Produit = le.Produit
                                AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                            ), 0)
                            FROM le_tache le3
                            WHERE le3.Produit = le.Produit
                            AND le3.Qte_theo_ced_UQA IS NOT NULL
                        ), 0) AS entrees
                    FROM le_tache le
                    LEFT JOIN stock_iam si ON le.Produit = si.numero_article
                    GROUP BY le.Produit, si.magasin
                ) AS stock_data
                WHERE (stock_initial + entrees - sorties) > 0`
            );

            const stockMap = new Map(stockRows.map(row => [`${row.article}_${row.magasin}`, row.stock_quantite_controle]));

            // Validate articles
            if (!articles || !Array.isArray(articles) || articles.length === 0) {
                return res.status(400).json({ error: "Au moins un article doit être fourni." });
            }
            const validationErrors = [];
            const updatedArticles = articles.map(article => {
                const key = `${article.article}_${magasin || 'Magasin'}`;
                const availableQuantity = stockMap.get(key) || 0;
                if (availableQuantity <= 0) {
                    validationErrors.push(`L'article ${article.article} n'a pas de quantité positive disponible dans le magasin ${magasin || 'Magasin'}.`);
                }
                if (article.quantity > availableQuantity) {
                    validationErrors.push(`La quantité saisie (${article.quantity}) pour l'article ${article.article} dans le magasin ${magasin || 'Magasin'} dépasse la quantité disponible (${availableQuantity}).`);
                }
                return {
                    ...article,
                    quantite_mise_a_jour: availableQuantity - article.quantity
                };
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({ error: validationErrors.join("; ") });
            }

            const query = `
                INSERT INTO controle_livraisons (
                    n_ot, bs, le, commande_achat, nature_sortie, type_sortie,
                    n_reservation, magasin, local, demandeur, preparateur, responsable_local, articles
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                JSON.stringify(updatedArticles || [])
            ];
            await pool.execute(query, params);
            res.json({ success: true, message: 'Livraison ajoutée avec succès', articles: updatedArticles });
        } else if (action === 'remove') {
            const nOts = data;
            if (!Array.isArray(nOts) || nOts.length === 0) {
                return res.status(400).json({ error: 'Liste de N° OT vide ou invalide' });
            }
            const placeholders = nOts.map(() => '?').join(',');
            const query = `DELETE FROM controle_livraisons WHERE n_ot IN (${placeholders})`;
            await pool.execute(query, nOts);
            res.json({ success: true, message: 'Livraisons supprimées avec succès' });
        } else {
            res.status(400).json({ error: 'Action non reconnue' });
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour:', err.stack);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour', details: err.message });
    }
});

module.exports = router;