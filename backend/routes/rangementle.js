const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Configuration améliorée du cache
let cachedTotalRecords = new Map();
let cacheExpiry = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Fonction pour créer une clé de cache
const getCacheKey = (search) => search ? `search_${search}` : 'all';

// Vérifier si le cache est valide
const isCacheValid = (key) => {
    return cachedTotalRecords.has(key) && cacheExpiry.has(key) && Date.now() < cacheExpiry.get(key);
};

// Définir le cache
const setCache = (key, totalRecords) => {
    cachedTotalRecords.set(key, totalRecords);
    cacheExpiry.set(key, Date.now() + CACHE_DURATION);
};

router.get('/', async (req, res) => {
    let connection;
    const startTime = Date.now();
    const { search, page = 1, limit = 10 } = req.query;
    const pageLimit = Math.min(parseInt(limit), 50); // Limiter à 50 max
    const offset = Math.max(0, (parseInt(page) - 1) * pageLimit);
    const cacheKey = getCacheKey(search);

    console.log(`[${new Date().toISOString()}] Starting optimized query for page ${page}, search: ${search || 'none'}, limit: ${pageLimit}`);

    try {
        // Configuration de timeout pour la base de données
        connection = await pool.getConnection();
        await connection.query('SET SESSION wait_timeout = 300'); // 5 minutes
        await connection.query('SET SESSION interactive_timeout = 300');

        // Optimisations de session
        await connection.query(`SET SESSION collation_connection = 'utf8mb4_unicode_ci'`);
        await connection.query(`SET SESSION character_set_connection = 'utf8mb4'`);
        await connection.query(`SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'`);

        // Vérifier si on peut utiliser le cache pour le total
        let totalRecords;
        if (isCacheValid(cacheKey)) {
            totalRecords = cachedTotalRecords.get(cacheKey);
            console.log(`[${new Date().toISOString()}] Using cached total: ${totalRecords}`);
        } else {
            // Requête de comptage optimisée
            let countQuery = `SELECT COUNT(DISTINCT article) as total FROM stock_ewm WHERE article IS NOT NULL AND article != ''`;
            const countParams = [];

            if (search) {
                countQuery += ` AND (article = ? OR designation_article LIKE ?)`;
                countParams.push(search.trim(), `%${search.trim()}%`);
            }

            const [countResult] = await connection.query(countQuery, countParams);
            totalRecords = countResult[0].total;
            setCache(cacheKey, totalRecords);
            console.log(`[${new Date().toISOString()}] Fresh count: ${totalRecords}`);
        }

        if (totalRecords === 0) {
            res.json({
                data: [],
                totalRecords: 0,
                currentPage: parseInt(page),
                totalPages: 0
            });
            connection.release();
            return;
        }

        // Requête principale optimisée avec calcul de quantity_controlled
        let mainQuery = `
            SELECT STRAIGHT_JOIN
                s.article AS article_code,
                s.designation_article AS description,
                s.emplacement AS final_location,
                SUM(s.quantite) AS quantity_ewm,
                s.unite_qte_base AS unit,
                m.Storage_Location,
                m.Storage_location_Validé,
                m.BIN_SAP,
                m.bin AS suitable_location,
                lt.Emplacement_cedant AS emplacement_cedant,
                lt.Emplacement_prenant AS emplacement_prenant,
                lt.Document AS LE,
                ls.Document AS LS,
                COALESCE(m.Qté_validée_SAP, 0) + 
                COALESCE((
                    SELECT SUM(lt2.Qte_reelle_pren_UQB)
                    FROM ls_tache lt2
                    WHERE lt2.Produit = s.article
                    AND lt2.Emplacement_prenant IS NOT NULL
                    AND lt2.Emplacement_prenant != ''
                ), 0) - 
                COALESCE((
                    SELECT SUM(lt2.Qte_reelle_pren_UQB)
                    FROM ls_tache lt2
                    WHERE lt2.Produit = s.article
                    AND lt2.Emplacement_cedant IS NOT NULL
                    AND lt2.Emplacement_cedant != ''
                ), 0) AS quantity_controlled,
                si.stock_utilisation_libre AS quantity_iam
            FROM stock_ewm s
            LEFT JOIN migration m ON s.article = m.SAP_Material
            LEFT JOIN ls_tache lt ON s.article = lt.Produit
            LEFT JOIN ls_status ls ON lt.Document = ls.Document
            LEFT JOIN stock_iam si ON s.article = si.numero_article
            WHERE s.article IS NOT NULL AND s.article != ''
        `;

        const params = [];

        if (search) {
            mainQuery += ` AND (s.article = ? OR s.designation_article LIKE ?)`;
            params.push(search.trim(), `%${search.trim()}%`);
        }

        mainQuery += ` GROUP BY s.article ORDER BY s.article LIMIT ? OFFSET ?`;
        params.push(pageLimit, offset);

        console.log(`[${new Date().toISOString()}] Executing main query with ${params.length} parameters`);
        const [results] = await connection.query(mainQuery, params);
        console.log(`[${new Date().toISOString()}] Query completed, processing ${results.length} rows`);

        // Formatage des résultats
        const formattedData = results.map(row => ({
            article_code: row.article_code || 'N/A',
            description: row.description || 'N/A',
            final_location: row.final_location || 'N/A',
            Storage_Location: row.Storage_Location || 'N/A',
            Storage_location_Validé: row.Storage_location_Validé || 'N/A',
            BIN_SAP: row.BIN_SAP || 'N/A',
            suitable_location: row.suitable_location || 'N/A',
            quantity_ewm: row.quantity_ewm != null ? Number(row.quantity_ewm).toFixed(3) : 'N/A',
            quantity_controlled: row.quantity_controlled != null ? Number(row.quantity_controlled).toFixed(3) : 'N/A',
            quantity_iam: row.quantity_iam != null ? Number(row.quantity_iam).toFixed(3) : 'N/A',
            unit: row.unit || 'N/A',
            emplacement_cedant: row.emplacement_cedant || 'N/A',
            emplacement_prenant: row.emplacement_prenant || 'N/A',
            LE: row.LE || 'N/A',
            LS: row.LS || 'N/A'
        }));

        res.json({
            data: formattedData,
            totalRecords,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / pageLimit) || 1
        });

        connection.release();
        console.log(`[${new Date().toISOString()}] Total execution time: ${Date.now() - startTime}ms`);

    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
        res.status(500).json({ error: 'Server error', details: err.message });
        if (connection) connection.release();
    }
});

module.exports = router;