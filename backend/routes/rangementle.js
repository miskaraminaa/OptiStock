const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Cache for total count
let cachedTotalRecords = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Check if cache is valid
const isCacheValid = () => {
    return cachedTotalRecords !== null && cacheExpiry && Date.now() < cacheExpiry;
};

// Set cache
const setCache = (totalRecords) => {
    cachedTotalRecords = totalRecords;
    cacheExpiry = Date.now() + CACHE_DURATION;
};

router.get('/', (req, res) => {
    let connection;
    const startTime = Date.now();
    const { search, page = 1 } = req.query;
    const limit = 25;
    const offset = Math.max(0, (parseInt(page) - 1) * limit);

    console.log(`[${new Date().toISOString()}] Starting query for page ${page}, search: ${search || 'none'}, limit: ${limit}, offset: ${offset}`);

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Get connection
    pool.getConnection((err, conn) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Connection Error:`, err.message, err.stack);
            res.write(`data: ${JSON.stringify({ error: 'Failed to connect to database', details: err.message })}\n\n`);
            res.end();
            return;
        }
        connection = conn;
        console.log(`[${new Date().toISOString()}] Database connection acquired`);

        // Set query timeout (30 seconds)
        connection.query('SET SESSION wait_timeout = 30', (err) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Timeout Setup Error:`, err.message);
                res.write(`data: ${JSON.stringify({ error: 'Failed to set query timeout', details: err.message })}\n\n`);
                connection.release();
                res.end();
                return;
            }

            // Create temporary table to pre-aggregate stock_ewm
            connection.query(`
                CREATE TEMPORARY TABLE IF NOT EXISTS temp_stock_aggregation AS
                SELECT 
                    CAST(s.article AS CHAR) COLLATE utf8mb4_unicode_ci AS article_code,
                    MAX(s.designation_article) AS description,
                    MAX(s.emplacement) AS final_location,
                    SUM(s.quantite) AS quantity,
                    MAX(s.unite_qte_base) AS unit
                FROM stock_ewm s
                WHERE s.article IS NOT NULL
                GROUP BY s.article
            `, (err, result) => {
                if (err) {
                    console.error(`[${new Date().toISOString()}] Temporary Table Error:`, err.message, err.stack);
                    res.write(`data: ${JSON.stringify({ error: 'Failed to create temporary table', details: err.message })}\n\n`);
                    connection.release();
                    res.end();
                    return;
                }
                console.log(`[${new Date().toISOString()}] Temporary table created, rows affected: ${result.affectedRows}`);

                // Main query
                let stockQuery = `
                    SELECT 
                        t.article_code,
                        t.description,
                        t.final_location,
                        t.quantity,
                        t.unit,
                        GROUP_CONCAT(DISTINCT m.Storage_Location SEPARATOR '\n') AS Storage_Location,
                        MAX(m.Storage_location_Validé) AS Storage_location_Validé,
                        MAX(m.BIN_SAP) AS BIN_SAP,
                        MAX(m.bin) AS suitable_location,
                        GROUP_CONCAT(DISTINCT 
                            CONCAT(
                                COALESCE(lt.Emplacement_cedant, 'N/A'), ' -> ',
                                COALESCE(lt.Emplacement_prenant, 'N/A')
                            ) SEPARATOR '\n'
                        ) AS historical_locations
                    FROM temp_stock_aggregation t
                    INNER JOIN le_tache lt ON t.article_code = lt.Produit COLLATE utf8mb4_unicode_ci
                    LEFT JOIN le_status ls ON lt.Document = ls.Document
                    LEFT JOIN migration m ON t.article_code = CAST(m.SAP_Material AS CHAR) COLLATE utf8mb4_unicode_ci
                `;
                let stockCountQuery = `
                    SELECT COUNT(DISTINCT t.article_code) AS total 
                    FROM temp_stock_aggregation t
                    INNER JOIN le_tache lt ON t.article_code = lt.Produit COLLATE utf8mb4_unicode_ci
                    LEFT JOIN le_status ls ON lt.Document = ls.Document
                `;
                const stockParams = [];

                if (search) {
                    stockQuery += ` WHERE (t.article_code = ? OR t.description LIKE ?)`;
                    stockCountQuery += ` WHERE (t.article_code = ? OR t.description LIKE ?)`;
                    stockParams.push(search.trim(), `%${search.trim()}%`);
                }
                stockQuery += ` GROUP BY t.article_code ORDER BY t.article_code LIMIT ? OFFSET ?`;
                stockParams.push(limit, offset);

                console.log(`[${new Date().toISOString()}] Count query: ${stockCountQuery}, params: ${stockParams.slice(0, search ? 2 : 0)}`);

                // Get total count
                connection.query(stockCountQuery, stockParams.slice(0, search ? 2 : 0), (err, countResult) => {
                    if (err) {
                        console.error(`[${new Date().toISOString()}] Count Query Error:`, err.message, err.stack);
                        res.write(`data: ${JSON.stringify({ error: 'Failed to fetch count', details: err.message })}\n\n`);
                        connection.release();
                        res.end();
                        return;
                    }

                    let totalRecords = countResult[0].total;
                    if (!search && isCacheValid()) {
                        totalRecords = cachedTotalRecords;
                        console.log(`[${new Date().toISOString()}] Using cached total: ${totalRecords}`);
                    } else if (!search) {
                        setCache(totalRecords);
                    }
                    console.log(`[${new Date().toISOString()}] Total records: ${totalRecords}`);

                    if (totalRecords === 0) {
                        console.log(`[${new Date().toISOString()}] No records found, sending empty response`);
                        res.write(`data: ${JSON.stringify({
                            data: [],
                            totalRecords: 0,
                            currentPage: parseInt(page),
                            totalPages: 0,
                            batch: true,
                            complete: true
                        })}\n\n`);
                        connection.release();
                        res.end();
                        return;
                    }

                    console.log(`[${new Date().toISOString()}] Main query: ${stockQuery}, params: ${stockParams}`);

                    // Stream query results
                    const stream = connection.query(stockQuery, stockParams).stream();

                    let results = [];
                    let rowCount = 0;

                    stream.on('data', (row) => {
                        rowCount++;
                        const formattedRow = {
                            article_code: row.article_code || 'N/A',
                            description: row.description || 'N/A',
                            final_location: row.final_location || 'N/A',
                            Storage_Location: row.Storage_Location || 'N/A',
                            Storage_location_Validé: row.Storage_location_Validé || 'N/A',
                            BIN_SAP: row.BIN_SAP || 'N/A',
                            suitable_location: row.suitable_location || 'N/A',
                            quantity: row.quantity != null ? Number(row.quantity).toFixed(3) : 'N/A',
                            unit: row.unit || 'N/A',
                            historical_locations: row.historical_locations || 'N/A'
                        };
                        results.push(formattedRow);
                        console.log(`[${new Date().toISOString()}] Received row ${rowCount}:`, formattedRow);

                        if (results.length >= limit || rowCount === totalRecords) {
                            console.log(`[${new Date().toISOString()}] Sending batch of ${results.length} rows`);
                            res.write(`data: ${JSON.stringify({
                                data: results,
                                totalRecords,
                                currentPage: parseInt(page),
                                totalPages: Math.ceil(totalRecords / limit) || 1,
                                batch: true
                            })}\n\n`);
                            res.flush();
                            results = [];
                        }
                    });

                    stream.on('end', () => {
                        console.log(`[${new Date().toISOString()}] Stream ended, total rows: ${rowCount}`);
                        res.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
                        connection.release();
                        res.end();
                        console.log(`[${new Date().toISOString()}] Query Execution Time: ${Date.now() - startTime}ms`);
                    });

                    stream.on('error', (err) => {
                        console.error(`[${new Date().toISOString()}] Stream Error:`, err.message, err.stack);
                        res.write(`data: ${JSON.stringify({ error: 'Failed to stream data', details: err.message })}\n\n`);
                        connection.release();
                        res.end();
                    });
                });
            });
        });
    });
});

router.post('/reset-cache', (req, res) => {
    pool.query('DROP TEMPORARY TABLE IF EXISTS temp_stock_aggregation', (err) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Reset Cache Error:`, err.message, err.stack);
            res.status(500).json({ error: 'Failed to reset cache', details: err.message });
            return;
        }
        cachedTotalRecords = null;
        cacheExpiry = null;
        res.json({ message: 'Cache and temporary table reset' });
        console.log(`[${new Date().toISOString()}] Cache and temporary table reset`);
    });
});

module.exports = router;