const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

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
                s.name_file
            FROM stock_ewm s
            LEFT JOIN le_tache lt ON s.article = lt.Produit
            LEFT JOIN le_status ls ON lt.Document = ls.Document
            WHERE s.article IS NOT NULL
            LIMIT ? OFFSET ?;
        `;

        console.log(`[${new Date().toISOString()}] Executing query with limit ${limit}, offset ${offset}`);
        const start = Date.now();
        const [rows] = await pool.query(query, [limit, offset]);
        console.log(`[${new Date().toISOString()}] Query took ${Date.now() - start}ms, Rows returned: ${rows.length}`);

        if (rows.length === 0) {
            return res.status(200).json({
                data: [],
                message: 'No articles found',
                page,
                limit
            });
        }

        res.status(200).json({
            data: rows,
            message: 'Articles fetched successfully',
            page,
            limit
        });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Database error:`, err.message, err.stack);
        if (err.code === 'ETIMEDOUT') {
            res.status(504).json({ message: 'Database query timed out', error: err.message });
        } else {
            res.status(500).json({ message: 'Failed to fetch articles', error: err.message });
        }
    }
});

// Test endpoint to verify the fix
router.get('/test-columns', async (req, res) => {
    try {
        // Test the corrected column names
        const testQuery = `
            SELECT 
                s.article,
                s.quantite,
                s.type_stock,
                s.designation_type_stock,
                s.valeur_stock,
                lt.Produit,
                lt.Document
            FROM stock_ewm s
            LEFT JOIN le_tache lt ON s.article = lt.Produit
            LEFT JOIN le_status ls ON lt.Document = ls.Document
            WHERE s.article IS NOT NULL;
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