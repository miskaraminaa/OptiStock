const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET / - Fetch storage data with pagination and precise search
router.get('/', async (req, res) => {
    try {
        const { search, page = 1 } = req.query;
        const limit = 25;
        const offset = Math.max(0, (parseInt(page) - 1) * limit); // Prevent negative offset

        // Initialize results
        let stockResults = [], lsTacheResults = [], leTacheResults = [], leStatusResults = [], lsStatusResults = [];

        // Query for current stock from stock_ewm
        try {
            let stockQuery = `
                SELECT 
                    CAST(article AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    designation_article AS description,
                    quantite AS quantity,
                    unite_qte_base AS unit,
                    prix AS pmp,
                    emplacement AS bin_location,
                    CAST(magasin AS CHAR) COLLATE utf8mb4_unicode_ci AS warehouse,
                    'current' AS source,
                    NULL AS document
                FROM stock_ewm
                WHERE article IS NOT NULL
            `;
            let stockCountQuery = `SELECT COUNT(*) AS total FROM stock_ewm WHERE article IS NOT NULL`;
            const stockParams = [];
            if (search) {
                stockQuery += ` AND (article = ? OR designation_article LIKE ?)`;
                stockCountQuery += ` AND (article = ? OR designation_article LIKE ?)`;
                stockParams.push(search, `%${search}%`);
            }
            stockQuery += ` ORDER BY article_code LIMIT ? OFFSET ?`;
            stockParams.push(limit, offset);
            console.log('stock_ewm query:', stockQuery, stockParams);
            [stockResults] = await pool.query(stockQuery, stockParams);
            const [stockCountResult] = await pool.query(stockCountQuery, stockParams.slice(0, -2));
            console.log('stock_ewm count:', stockCountResult[0].total);
        } catch (stockError) {
            console.error('stock_ewm query error:', stockError.message, stockError.stack);
        }

        // Query for tasks from ls_tache
        try {
            let lsTacheQuery = `
                SELECT 
                    CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    Designation_produit AS description,
                    Qte_reelle_pren_UQB AS quantity,
                    Unite_qte_base AS unit,
                    NULL AS pmp,
                    Emplacement_prenant AS bin_location,
                    NULL AS warehouse,
                    'task_prenant' AS source,
                    Document AS document
                FROM ls_tache
                WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                UNION
                SELECT 
                    CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    Designation_produit AS description,
                    Qte_reelle_pren_UQB AS quantity,
                    Unite_qte_base AS unit,
                    NULL AS pmp,
                    Emplacement_cedant AS bin_location,
                    NULL AS warehouse,
                    'task_cedant' AS source,
                    Document AS document
                FROM ls_tache
                WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
            `;
            let lsTacheCountQuery = `
                SELECT COUNT(*) AS total FROM (
                    SELECT Produit FROM ls_tache WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                    UNION
                    SELECT Produit FROM ls_tache WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
                ) AS t
            `;
            const lsTacheParams = [];
            if (search) {
                lsTacheQuery += ` AND (Produit = ? OR Designation_produit LIKE ?)`;
                lsTacheCountQuery += ` WHERE Produit = ? OR Designation_produit LIKE ?`;
                lsTacheParams.push(search, `%${search}%`);
            }
            lsTacheQuery += ` ORDER BY article_code LIMIT ? OFFSET ?`;
            lsTacheParams.push(limit, offset);
            console.log('ls_tache query:', lsTacheQuery, lsTacheParams);
            [lsTacheResults] = await pool.query(lsTacheQuery, lsTacheParams);
            const [lsTacheCountResult] = await pool.query(lsTacheCountQuery, lsTacheParams.slice(0, -2));
            console.log('ls_tache count:', lsTacheCountResult[0].total);
        } catch (lsTacheError) {
            console.error('ls_tache query error:', lsTacheError.message, lsTacheError.stack);
        }

        // Query for tasks from le_tache
        try {
            let leTacheQuery = `
                SELECT 
                    CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    Designation_produit AS description,
                    Qte_reelle_pren_UQB AS quantity,
                    Unite_qte_base AS unit,
                    NULL AS pmp,
                    Emplacement_prenant AS bin_location,
                    NULL AS warehouse,
                    'task_prenant' AS source,
                    Document AS document
                FROM le_tache
                WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                UNION
                SELECT 
                    CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    Designation_produit AS description,
                    Qte_reelle_pren_UQB AS quantity,
                    Unite_qte_base AS unit,
                    NULL AS pmp,
                    Emplacement_cedant AS bin_location,
                    NULL AS warehouse,
                    'task_cedant' AS source,
                    Document AS document
                FROM le_tache
                WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
            `;
            let leTacheCountQuery = `
                SELECT COUNT(*) AS total FROM (
                    SELECT Produit FROM le_tache WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                    UNION
                    SELECT Produit FROM le_tache WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
                ) AS t
            `;
            const leTacheParams = [];
            if (search) {
                leTacheQuery += ` AND (Produit = ? OR Designation_produit LIKE ?)`;
                leTacheCountQuery += ` WHERE Produit = ? OR Designation_produit LIKE ?`;
                leTacheParams.push(search, `%${search}%`);
            }
            leTacheQuery += ` ORDER BY article_code LIMIT ? OFFSET ?`;
            leTacheParams.push(limit, offset);
            console.log('le_tache query:', leTacheQuery, leTacheParams);
            [leTacheResults] = await pool.query(leTacheQuery, leTacheParams);
            const [leTacheCountResult] = await pool.query(leTacheCountQuery, leTacheParams.slice(0, -2));
            console.log('le_tache count:', leTacheCountResult[0].total);
        } catch (leTacheError) {
            console.error('le_tache query error:', leTacheError.message, leTacheError.stack);
        }

        // Query for status from le_status
        try {
            let leStatusQuery = `
                SELECT 
                    NULL AS article_code,
                    NULL AS description,
                    NULL AS quantity,
                    NULL AS unit,
                    NULL AS pmp,
                    NULL AS bin_location,
                    CAST(site_cedant AS CHAR) COLLATE utf8mb4_unicode_ci AS warehouse,
                    'status_cedant' AS source,
                    Document AS document
                FROM le_status
                WHERE site_cedant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
            `;
            let leStatusCountQuery = `
                SELECT COUNT(*) AS total 
                FROM le_status 
                WHERE site_cedant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
            `;
            const leStatusParams = [search || '', `%${search || ''}%`, search || '', `%${search || ''}%`];
            if (search) {
                leStatusQuery += ` AND site_cedant LIKE ?`;
                leStatusCountQuery += ` AND site_cedant LIKE ?`;
                leStatusParams.push(`%${search}%`);
            }
            leStatusQuery += ` ORDER BY warehouse LIMIT ? OFFSET ?`;
            leStatusParams.push(limit, offset);
            console.log('le_status query:', leStatusQuery, leStatusParams);
            [leStatusResults] = await pool.query(leStatusQuery, leStatusParams);
            const [leStatusCountResult] = await pool.query(leStatusCountQuery, leStatusParams.slice(0, search ? 5 : 4));
            console.log('le_status count:', leStatusCountResult[0].total);
        } catch (leStatusError) {
            console.error('le_status query error:', leStatusError.message, leStatusError.stack);
        }

        // Query for status from ls_status
        try {
            let lsStatusQuery = `
                SELECT 
                    NULL AS article_code,
                    NULL AS description,
                    NULL AS quantity,
                    NULL AS unit,
                    NULL AS pmp,
                    NULL AS bin_location,
                    CAST(site_prenant AS CHAR) COLLATE utf8mb4_unicode_ci AS warehouse,
                    'status_prenant' AS source,
                    Document AS document
                FROM ls_status
                WHERE site_prenant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
            `;
            let lsStatusCountQuery = `
                SELECT COUNT(*) AS total 
                FROM ls_status 
                WHERE site_prenant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
            `;
            const lsStatusParams = [search || '', `%${search || ''}%`, search || '', `%${search || ''}%`];
            if (search) {
                lsStatusQuery += ` AND site_prenant LIKE ?`;
                lsStatusCountQuery += ` AND site_prenant LIKE ?`;
                lsStatusParams.push(`%${search}%`);
            }
            lsStatusQuery += ` ORDER BY warehouse LIMIT ? OFFSET ?`;
            lsStatusParams.push(limit, offset);
            console.log('ls_status query:', lsStatusQuery, lsStatusParams);
            [lsStatusResults] = await pool.query(lsStatusQuery, lsStatusParams);
            const [lsStatusCountResult] = await pool.query(lsStatusCountQuery, lsStatusParams.slice(0, search ? 5 : 4));
            console.log('ls_status count:', lsStatusCountResult[0].total);
        } catch (lsStatusError) {
            console.error('ls_status query error:', lsStatusError.message, lsStatusError.stack);
        }

        // Combine results
        const combinedResults = [
            ...stockResults,
            ...lsTacheResults,
            ...leTacheResults,
            ...leStatusResults,
            ...lsStatusResults
        ].filter(row => row.article_code || row.warehouse);

        // Log combined results for debugging
        console.log('Combined results before sort:', combinedResults.map(row => ({
            article_code: { value: row.article_code, type: typeof row.article_code },
            warehouse: { value: row.warehouse, type: typeof row.warehouse }
        })));

        // Create a new array for sorting to avoid mutating combinedResults
        const sortedResults = [...combinedResults].sort((a, b) => {
            const aCode = a.article_code != null ? String(a.article_code) : '';
            const bCode = b.article_code != null ? String(b.article_code) : '';
            if (aCode && bCode) return aCode.localeCompare(bCode);
            if (aCode) return -1;
            if (bCode) return 1;
            const aWarehouse = a.warehouse != null ? String(a.warehouse) : '';
            const bWarehouse = b.warehouse != null ? String(b.warehouse) : '';
            return aWarehouse.localeCompare(bWarehouse) || 0;
        });

        // Calculate total unique records
        const totalRecordsQuery = `
            SELECT COUNT(DISTINCT COALESCE(article_code, warehouse)) AS total
            FROM (
                SELECT CAST(article AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code, 
                       CAST(magasin AS CHAR) COLLATE utf8mb4_unicode_ci AS warehouse 
                FROM stock_ewm 
                WHERE article IS NOT NULL
                UNION
                SELECT CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci, NULL 
                FROM ls_tache 
                WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                UNION
                SELECT CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci, NULL 
                FROM ls_tache 
                WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
                UNION
                SELECT CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci, NULL 
                FROM le_tache 
                WHERE Produit IS NOT NULL AND Emplacement_prenant IS NOT NULL
                UNION
                SELECT CAST(Produit AS CHAR) COLLATE utf8mb4_unicode_ci, NULL 
                FROM le_tache 
                WHERE Produit IS NOT NULL AND Emplacement_cedant IS NOT NULL
                UNION
                SELECT NULL, CAST(site_cedant AS CHAR) COLLATE utf8mb4_unicode_ci 
                FROM le_status 
                WHERE site_cedant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
                UNION
                SELECT NULL, CAST(site_prenant AS CHAR) COLLATE utf8mb4_unicode_ci 
                FROM ls_status 
                WHERE site_prenant IS NOT NULL
                AND Document IN (
                    SELECT Document FROM ls_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                    UNION
                    SELECT Document FROM le_tache WHERE Produit IS NOT NULL AND (Produit = ? OR Designation_produit LIKE ?)
                )
            ) AS combined
        `;
        const totalRecordsParams = search ? [search, `%${search}%`, search, `%${search}%`, search, `%${search}%`, search, `%${search}%`] : ['', '', '', '', '', '', '', ''];
        if (search) {
            totalRecordsQuery += `
                WHERE article_code = ? OR article_code LIKE ? OR warehouse LIKE ?
            `;
            totalRecordsParams.push(search, `%${search}%`, `%${search}%`);
        }
        console.log('totalRecords query:', totalRecordsQuery, totalRecordsParams);
        const [totalRecordsResult] = await pool.query(totalRecordsQuery, totalRecordsParams);
        const totalRecords = totalRecordsResult[0].total;

        // Apply pagination to combined results
        const start = Math.max(0, (parseInt(page) - 1) * limit);
        const paginatedResults = sortedResults.slice(start, start + limit);

        res.json({
            data: paginatedResults,
            totalRecords,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / limit) || 1
        });
    } catch (error) {
        console.error('General API error:', error.message, error.stack);
        res.status(500).json({
            error: 'Failed to fetch storage data',
            details: error.message
        });
    }
});

module.exports = router;