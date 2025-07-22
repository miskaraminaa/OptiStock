const express = require('express');
const router = express.Router();
const pool = require('../config/db');

let cachedTotalRecords = new Map();
let cacheExpiry = new Map();
const CACHE_DURATION = process.env.CACHE_DURATION_MS || 10 * 60 * 1000;

const getCacheKey = (search, leSearch) => (leSearch ? `le_${leSearch}` : search ? `search_${search}` : 'all');
const isCacheValid = (key) => cachedTotalRecords.has(key) && cacheExpiry.has(key) && Date.now() < cacheExpiry.get(key);
const setCache = (key, totalRecords) => {
    cachedTotalRecords.set(key, totalRecords);
    cacheExpiry.set(key, Date.now() + CACHE_DURATION);
};

const validateQuery = (search, leSearch, page, limit) => {
    if (search && typeof search !== 'string') throw new Error('Search parameter must be a string');
    if (leSearch && typeof leSearch !== 'string') throw new Error('LE search parameter must be a string');
    if (isNaN(page) || parseInt(page) < 1) throw new Error('Page must be a positive integer');
    if (isNaN(limit) || parseInt(limit) < 1) throw new Error('Limit must be a positive integer');
};

router.get('/', async (req, res) => {
    let connection;
    const startTime = Date.now();
    try {
        const { search, leSearch, page = 1, limit = 10 } = req.query;
        validateQuery(search, leSearch, page, limit);
        const pageLimit = Math.min(parseInt(limit), 50);
        const offset = Math.max(0, (parseInt(page) - 1) * pageLimit);
        const cacheKey = getCacheKey(search, leSearch);

        console.log(`[${new Date().toISOString()}] Starting query for page ${page}, search: ${search || 'none'}, leSearch: ${leSearch || 'none'}, limit: ${pageLimit}`);

        connection = await pool.getConnection();
        await connection.query('SET SESSION wait_timeout = 300');
        await connection.query('SET SESSION interactive_timeout = 300');

        // Count query
        let totalRecords;
        if (isCacheValid(cacheKey)) {
            totalRecords = cachedTotalRecords.get(cacheKey);
            console.log(`[${new Date().toISOString()}] Using cached total: ${totalRecords}`);
        } else {
            let countQuery = `
                SELECT COUNT(DISTINCT lt.Produit) as total 
                FROM le_tache lt 
                LEFT JOIN ls_tache ls_t ON TRIM(lt.Produit) = TRIM(ls_t.Produit)
                WHERE lt.Produit IS NOT NULL AND lt.Produit != ''
                ${search ? 'AND (TRIM(lt.Produit) = ? OR lt.Designation_produit LIKE ?)' : ''}
                ${leSearch ? 'AND lt.Document = ?' : ''}`;
            const countParams = [];
            if (search) {
                countParams.push(search.trim(), `%${search.trim()}%`);
            }
            if (leSearch) {
                countParams.push(leSearch.trim());
            }
            const [countResult] = await connection.query(countQuery, countParams);
            totalRecords = countResult[0]?.total || 0;
            setCache(cacheKey, totalRecords);
            console.log(`[${new Date().toISOString()}] Fresh count: ${totalRecords}`);
        }

        if (totalRecords === 0) {
            res.json({
                data: [],
                totalRecords: 0,
                currentPage: parseInt(page),
                totalPages: 0,
                responseTimeMs: Date.now() - startTime
            });
            return;
        }

        // Main query
        let mainQuery = `
            SELECT 
                lt.Produit AS article_code,
                lt.Designation_produit AS description,
                GROUP_CONCAT(DISTINCT 
                    CASE 
                        WHEN lt.Emplacement_cedant IS NOT NULL AND lt.Emplacement_cedant != '' 
                        THEN CONCAT('LE: ', COALESCE(TRIM(lt.Emplacement_cedant), 'N/A'))
                        WHEN ls_t.Emplacement_cedant IS NOT NULL AND ls_t.Emplacement_cedant != '' 
                        THEN CONCAT('LS: ', COALESCE(TRIM(ls_t.Emplacement_cedant), 'N/A'))
                    END SEPARATOR '\n') AS emplacement_cedant,
                GROUP_CONCAT(DISTINCT 
                    CASE 
                        WHEN lt.Emplacement_prenant IS NOT NULL AND lt.Emplacement_prenant != '' 
                        THEN CONCAT('LE: ', COALESCE(TRIM(lt.Emplacement_prenant), 'N/A'))
                        WHEN ls_t.Emplacement_prenant IS NOT NULL AND ls_t.Emplacement_prenant != '' 
                        THEN CONCAT('LS: ', COALESCE(TRIM(ls_t.Emplacement_prenant), 'N/A'))
                    END SEPARATOR '\n') AS emplacement_prenant,
                s.emplacement AS final_location,
                m.bin AS suitable_location,
                m.Storage_Location,
                m.Storage_location_Validé,
                m.BIN_SAP,
                COALESCE((
                    SELECT SUM(DISTINCT s2.quantite)
                    FROM stock_ewm s2
                    WHERE s2.article = lt.Produit
                    AND s2.quantite IS NOT NULL
                ), 0) AS quantity_ewm,
                COALESCE((
                    SELECT SUM(mig.Qté_validée_SAP)
                    FROM migration mig
                    WHERE mig.SAP_Material = lt.Produit
                    AND mig.Qté_validée_SAP IS NOT NULL
                ), 0) + 
                COALESCE((
                    SELECT SUM(le2.Qte_theo_ced_UQA)
                    FROM le_tache le2
                    WHERE le2.Produit = lt.Produit
                    AND le2.Qte_theo_ced_UQA IS NOT NULL
                ), 0) - 
                COALESCE((
                    SELECT SUM(ls2.Qte_reelle_pren_UQA)
                    FROM ls_tache ls2
                    WHERE ls2.Produit = lt.Produit
                    AND ls2.Qte_reelle_pren_UQA IS NOT NULL
                ), 0) AS quantity_controlled,
                si.stock_utilisation_libre AS quantity_iam,
                s.unite_qte_base AS unit,
                MAX(lt.Document) AS LE,
                COALESCE(MAX(ls_t.Document), 'N/A') AS LS,
                (
                    CASE 
                        WHEN lt.Produit IS NOT NULL AND lt.Produit != ''
                        AND lt.Designation_produit IS NOT NULL AND lt.Designation_produit != ''
                        AND s.emplacement IS NOT NULL AND s.emplacement != ''
                        AND m.Storage_Location IS NOT NULL AND m.Storage_Location != ''
                        THEN 1
                        ELSE 0
                    END
                ) AS is_complete
            FROM le_tache lt
            LEFT JOIN ls_tache ls_t ON TRIM(lt.Produit) = TRIM(ls_t.Produit)
            LEFT JOIN stock_ewm s ON lt.Produit = s.article
            LEFT JOIN migration m ON lt.Produit = m.SAP_Material
            LEFT JOIN stock_iam si ON lt.Produit = si.numero_article
            WHERE lt.Produit IS NOT NULL AND lt.Produit != ''
            ${search ? 'AND (TRIM(lt.Produit) = ? OR lt.Designation_produit LIKE ?)' : ''}
            ${leSearch ? 'AND lt.Document = ?' : ''}
            GROUP BY lt.Produit
            ORDER BY is_complete DESC, lt.Produit
            LIMIT ? OFFSET ?`;

        const params = [];
        if (search) {
            params.push(search.trim(), `%${search.trim()}%`);
        }
        if (leSearch) {
            params.push(leSearch.trim());
        }
        params.push(pageLimit, offset);

        console.log(`[${new Date().toISOString()}] Executing main query with ${params.length} parameters: ${params}`);
        const [results] = await connection.query(mainQuery, params);
        console.log(`[${new Date().toISOString()}] Query completed, processing ${results.length} rows`);

        const formattedData = results.map(row => ({
            article_code: row.article_code || 'N/A',
            description: row.description || 'N/A',
            emplacement_cedant: row.emplacement_cedant || 'N/A',
            emplacement_prenant: row.emplacement_prenant || 'N/A',
            final_location: row.final_location || 'N/A',
            suitable_location: row.suitable_location || 'N/A',
            Storage_Location: row.Storage_Location || 'N/A',
            Storage_location_Validé: row.Storage_location_Validé || 'N/A',
            BIN_SAP: row.BIN_SAP || 'N/A',
            quantity_ewm: row.quantity_ewm != null ? Number(row.quantity_ewm).toFixed(3) : 'N/A',
            quantity_controlled: row.quantity_controlled != null ? Number(row.quantity_controlled).toFixed(3) : 'N/A',
            quantity_iam: row.quantity_iam != null ? Number(row.quantity_iam).toFixed(3) : 'N/A',
            unit: row.unit || 'N/A',
            LE: row.LE || 'N/A',
            LS: row.LS || 'N/A'
        }));

        res.json({
            data: formattedData,
            totalRecords,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / pageLimit) || 1,
            responseTimeMs: Date.now() - startTime
        });

    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
        res.status(500).json({ error: 'Server error', details: err.message });
    } finally {
        if (connection) connection.release();
        console.log(`[${new Date().toISOString()}] Total execution time: ${Date.now() - startTime}ms`);
    }
});

module.exports = router;