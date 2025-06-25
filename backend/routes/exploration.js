const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error(`[${new Date().toISOString()}] No token provided`);
        return res.set('X-Redirect-Login', '/login').status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.user = decoded;
        next();
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Token verification failed:`, err.message);
        return res.set('X-Redirect-Login', '/login').status(403).json({ message: 'Invalid or expired token' });
    }
};

router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fixed query with correct column names
        const query = `
            SELECT 
                s.article,
                s.designation_article,
                s.numero_magasin,
                s.division,
                s.magasin,
                s.emplacement,
                s.type_magasin,
                s.quantite,
                s.unite_qte_base,
                s.type_stock,
                s.designation_type_stock,
                s.groupe_valorisation,
                s.prix,
                s.valeur_stock,
                s.devise,
                s.date_em,
                s.derniere_sortie,
                s.uploaded_at,
                s.name_file,
                COALESCE(lt.Statut_tache_magasin, 'Not Available') AS Statut_tache_magasin,
                COALESCE(ls.statut_activite_magasin, 'Not Available') AS Statut_activite_magasin,
                lt.Produit AS debug_produit,
                lt.Document AS debug_document
            FROM stock_ewm s
            LEFT JOIN le_tache lt ON s.article = lt.Produit
            LEFT JOIN le_status ls ON lt.Document = ls.Document
            WHERE s.article IS NOT NULL;
        `;

        console.log(`[${new Date().toISOString()}] Executing corrected query...`);
        const [rows] = await pool.query(query);

        console.log(`[${new Date().toISOString()}] Query executed successfully`);
        console.log(`[${new Date().toISOString()}] Rows returned: ${rows.length}`);

        if (rows && rows.length > 0) {
            console.log(`[${new Date().toISOString()}] Available columns:`, Object.keys(rows[0]));
            console.log(`[${new Date().toISOString()}] First row sample:`, JSON.stringify(rows[0], null, 2));
        }

        if (!rows || rows.length === 0) {
            console.log(`[${new Date().toISOString()}] No articles found`);
            return res.status(200).json({
                data: [],
                message: 'No articles found'
            });
        }

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

// Test endpoint to verify the fix
router.get('/test-columns', authenticateToken, async (req, res) => {
    try {
        // Test the corrected column names
        const testQuery = `
            SELECT 
                s.article,
                s.quantite,
                s.type_stock,
                s.designation_type_stock,
                s.valeur_stock,
                lt.Statut_tache_magasin,
                ls.statut_activite_magasin,
                lt.Produit,
                lt.Document
            FROM stock_ewm s
            LEFT JOIN le_tache lt ON s.article = lt.Produit
            LEFT JOIN le_status ls ON lt.Document = ls.Document
            WHERE s.article IS NOT NULL
            LIMIT 5;
        `;

        const [rows] = await pool.query(testQuery);

        res.json({
            success: true,
            rowCount: rows.length,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
            sampleData: rows[0] || null,
            allData: rows
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;