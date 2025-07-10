const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Endpoint pour récupérer les données avec filtres
router.post('/data', async (req, res) => {
    const { nOt, bs, typeSortie } = req.body;
    try {
        const query = `
            SELECT n_ot, bs, le, commande_achat, nature_sortie, type_sortie, n_reservation, magasin, local, demandeur, preparateur, responsable_local
            FROM controle_livraisons
            WHERE (? IS NULL OR n_ot LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR bs LIKE CONCAT('%', ?, '%'))
            AND (? IS NULL OR type_sortie = ?)
        `;
        const params = [nOt || null, nOt || null, bs || null, bs || null, typeSortie || null, typeSortie || null];
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des données', details: err.message });
    }
});

// Endpoint pour ajouter ou supprimer des données
router.post('/update', async (req, res) => {
    const { action, data } = req.body;
    try {
        if (action === 'add') {
            const {
                n_ot, bs, le, commande_achat, nature_sortie, type_sortie,
                n_reservation, magasin, local, demandeur, preparateur, responsable_local
            } = data;
            const query = `
                INSERT INTO controle_livraisons (
                    n_ot, bs, le, commande_achat, nature_sortie, type_sortie,
                    n_reservation, magasin, local, demandeur, preparateur, responsable_local
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                n_ot || null,
                bs || null,
                le || null,
                commande_achat || null,
                nature_sortie || 'normal',
                type_sortie || 'OT',
                n_reservation || null,
                magasin || 'Magasin',
                local || null,
                demandeur || null,
                preparateur || null,
                responsable_local || null
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
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour', details: err.message });
    }
});

module.exports = router;