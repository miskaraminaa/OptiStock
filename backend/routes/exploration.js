const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.error(`[${new Date().toISOString()}] No token provided`);
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.user = decoded;
        next();
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Token verification failed:`, err.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                s.article,
                s.quantite,
                s.type_stock,
                s.designation_type_stock,
                s.valeur_stock,
                lt.Produit,
                lt.Document,
                lt.Statut_tache_magasin,
                ls.Statut_activite_magasin AS le_statut_activite,
                NULL AS le_statut_prelevement,
                lts.Produit AS ls_produit,
                lts.Document AS ls_document,
                lts.Statut_tache_magasin AS ls_statut_tache,
                lss.Statut_activite_magasin AS ls_statut_activite,
                NULL AS ls_statut_prelevement
            FROM stock_ewm s
            LEFT JOIN le_tache lt ON s.article = lt.Produit
            LEFT JOIN le_status ls ON lt.Document = ls.Document
            LEFT JOIN ls_tache lts ON s.article = lts.Produit
            LEFT JOIN ls_status lss ON lts.Document = lss.Document
            WHERE s.article IS NOT NULL
            GROUP BY 
                s.article,
                s.quantite,
                s.type_stock,
                s.designation_type_stock,
                s.valeur_stock,
                lt.Produit,
                lt.Document,
                lt.Statut_tache_magasin,
                ls.Statut_activite_magasin,
                lts.Produit,
                lts.Document,
                lts.Statut_tache_magasin,
                lss.Statut_activite_magasin;
        `;

        const [rows] = await pool.query(query);

        if (!rows || rows.length === 0) {
            console.log(`[${new Date().toISOString()}] No articles found`);
            return res.status(200).json({
                data: [],
                message: 'No articles found'
            });
        }

        console.log(`[${new Date().toISOString()}] Fetched ${rows.length} articles`);
        res.status(200).json({
            data: rows,
            message: 'Articles fetched successfully'
        });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Database error:`, err.message, err.stack);
        res.status(500).json({
            message: 'Failed to fetch articles',
            error: err.message
        });
    }
});

module.exports = router;