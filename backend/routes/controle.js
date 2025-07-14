const express = require('express');
const pool = require('../config/db');
const moment = require('moment'); // Add moment for consistency

const router = express.Router();

// Endpoint for /controle/data
router.post('/data', async (req, res) => {
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
            articles: row.articles ? row.articles : '[]'
        }));
        res.json(sanitizedRows);
    } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des données', details: err.message });
    }
});

// Endpoint for /controle/mb51/articles
router.get('/mb51/articles', async (req, res) => {
    try {
        const query = `
              SELECT DISTINCT article, designation_article
              FROM mb51
              ORDER BY article ASC
          `;
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des articles:', err);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des articles', details: err.message });
    }
});

// Endpoint for /controle/update
router.post('/update', async (req, res) => {
    const { action, data } = req.body;
    console.log('Received data:', data); // Debug log
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

            console.log('Processed n_ot:', defaultN_ot); // Debug log
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
                JSON.stringify(articles || [])
            ];
            await pool.execute(query, params);
            res.json({ success: true, message: 'Livraison ajoutée avec succès' });
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
        console.error('Erreur lors de la mise à jour:', err);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour', details: err.message });
    }
});

module.exports = router;