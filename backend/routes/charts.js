const express = require('express');
const pool = require('../config/db');
const router = express.Router();

const validateDateRange = (startDate, endDate) => {
    console.log(`[DEBUG] Validating dates - startDate: ${startDate}, endDate: ${endDate}`);
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log(`[DEBUG] Parsed start: ${start}, end: ${end}`);
    return start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end) && start <= end;
};

// Existing routes...
router.get('/input-vs-output', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log(`[DEBUG] /input-vs-output - Query: startDate=${startDate}, endDate=${endDate}, article=${article}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Invalid date range' });
    try {
        const [rows] = await pool.query(`
            SELECT STR_TO_DATE(date_comptable, '%Y-%m-%d') AS date,
                   SUM(CASE WHEN code_mouvement IN ('101', '531') THEN CAST(quantite AS DECIMAL) ELSE 0 END) AS input_quantity,
                   SUM(CASE WHEN code_mouvement IN ('201', '261') THEN ABS(CAST(quantite AS DECIMAL)) ELSE 0 END) AS output_quantity
            FROM stockmagasin.mb51
            WHERE STR_TO_DATE(date_comptable, '%Y-%m-%d') BETWEEN ? AND ?
            ${article ? 'AND article = ?' : ''}
            GROUP BY STR_TO_DATE(date_comptable, '%Y-%m-%d')
            ORDER BY date
        `, article ? [startDate, endDate, article] : [startDate, endDate]);
        console.log(`[DEBUG] /input-vs-output - Rows returned: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERROR] /input-vs-output - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/stock-over-time', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log(`[DEBUG] /stock-over-time - Query: startDate=${startDate}, endDate=${endDate}, article=${article}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Invalid date range' });
    try {
        const [rows] = await pool.query(`
            SELECT STR_TO_DATE(date_em, '%d.%m.%Y %H:%i:%s') AS date, SUM(quantite) AS total_quantity
            FROM stockmagasin.stock_ewm
            WHERE STR_TO_DATE(date_em, '%d.%m.%Y %H:%i:%s') BETWEEN ? AND ?
            ${article ? 'AND article = ?' : ''}
            GROUP BY STR_TO_DATE(date_em, '%d.%m.%Y %H:%i:%s')
            ORDER BY date
        `, article ? [startDate, endDate, article] : [startDate, endDate]);
        console.log(`[DEBUG] /stock-over-time - Rows returned: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERROR] /stock-over-time - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/division-distribution', async (req, res) => {
    console.log(`[DEBUG] /division-distribution - Query received`);
    try {
        const [rows] = await pool.query(`
            SELECT division, COUNT(DISTINCT article) AS article_count
            FROM stockmagasin.stock_ewm
            GROUP BY division
        `);
        console.log(`[DEBUG] /division-distribution - Rows returned: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERROR] /division-distribution - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/type-stock-distribution', async (req, res) => {
    console.log(`[DEBUG] /type-stock-distribution - Query received`);
    try {
        const [rows] = await pool.query(`
            SELECT type_stock, COUNT(DISTINCT article) AS article_count
            FROM stockmagasin.stock_ewm
            GROUP BY type_stock
        `);
        console.log(`[DEBUG] /type-stock-distribution - Rows returned: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERROR] /type-stock-distribution - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/movement-by-code', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log('[DEBUG] /movement-by-code - Query received with:', { startDate, endDate, article });
    try {
        let query = `
      SELECT code_mouvement, SUM(CAST(quantite AS DECIMAL)) AS total_quantity
      FROM stockmagasin.mb51
      WHERE 1=1
    `;
        const params = [];

        if (startDate && endDate) {
            query += ` AND STR_TO_DATE(date_comptable, '%Y-%m-%d') BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }
        if (article) {
            query += ` AND article = ?`;
            params.push(article);
        }
        query += ` GROUP BY code_mouvement`;

        const [rows] = await pool.query(query, params);
        console.log('[DEBUG] /movement-by-code - Raw rows:', rows);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('[ERROR] /movement-by-code -', error.message, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/stock-vs-price', async (req, res) => {
    console.log(`[DEBUG] /stock-vs-price - Query received`);
    try {
        const [rows] = await pool.query(`
            SELECT article, quantite, prix
            FROM stockmagasin.stock_ewm
            WHERE quantite IS NOT NULL AND prix IS NOT NULL
        `);
        console.log(`[DEBUG] /stock-vs-price - Rows returned: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERROR] /stock-vs-price - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/articles', async (req, res) => {
    console.log(`[DEBUG] /articles - Query received`);
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT article FROM stockmagasin.stock_ewm
            UNION
            SELECT DISTINCT Produit FROM stockmagasin.le_tache
            UNION
            SELECT DISTINCT Produit FROM stockmagasin.ls_tache
            UNION
            SELECT DISTINCT article FROM stockmagasin.mb51
        `);
        const articles = rows.map(row => row.article || row.Produit).filter(id => id).map(String);
        console.log(`[DEBUG] /articles - Articles count: ${articles.length}`);
        return res.status(200).json({ data: articles.sort((a, b) => a.localeCompare(b)) });
    } catch (error) {
        console.error(`[ERROR] /articles - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/total-stock', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log('[DEBUG] /total-stock - Query received with:', { startDate, endDate });
    try {
        let query = `
        SELECT SUM(quantite) AS total_stock
        FROM stockmagasin.stock_ewm
      `;
        const params = [];

        if (startDate && endDate) {
            query += ` WHERE STR_TO_DATE(date_em, '%d.%m.%Y %H:%i:%s') BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        const [rows] = await pool.query(query, params);
        console.log('[DEBUG] /total-stock - Raw rows:', JSON.stringify(rows, null, 2));
        return res.status(200).json({ data: rows[0]?.total_stock || 0 });
    } catch (error) {
        console.error('[ERROR] /total-stock -', error.message, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/total-input', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log('[DEBUG] /total-input - Query:', { startDate, endDate });
    if (!startDate || !endDate) return res.status(400).json({ message: 'Invalid date range' });
    try {
        const [rows] = await pool.query(`
      SELECT SUM(CASE WHEN code_mouvement IN ('101', '531') THEN CAST(quantite AS DECIMAL) ELSE 0 END) AS total_input
      FROM stockmagasin.mb51
      WHERE STR_TO_DATE(date_comptable, '%Y-%m-%d') BETWEEN ? AND ?
    `, [startDate, endDate]);
        console.log('[DEBUG] /total-input - Raw rows:', rows);
        return res.status(200).json({ data: rows[0]?.total_input || 0 });
    } catch (error) {
        console.error('[ERROR] /total-input -', error.message, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/total-output', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log('[DEBUG] /total-output - Query:', { startDate, endDate });
    if (!startDate || !endDate) return res.status(400).json({ message: 'Invalid date range' });
    try {
        const [rows] = await pool.query(`
      SELECT SUM(CASE WHEN code_mouvement IN ('201', '261') THEN ABS(CAST(quantite AS DECIMAL)) ELSE 0 END) AS total_output
      FROM stockmagasin.mb51
      WHERE STR_TO_DATE(date_comptable, '%Y-%m-%d') BETWEEN ? AND ?
    `, [startDate, endDate]);
        console.log('[DEBUG] /total-output - Raw rows:', rows);
        return res.status(200).json({ data: rows[0]?.total_output || 0 });
    } catch (error) {
        console.error('[ERROR] /total-output -', error.message, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.get('/unique-articles', async (req, res) => {
    console.log('[DEBUG] /unique-articles - Query received');
    try {
        const [rows] = await pool.query(`
      SELECT COUNT(DISTINCT article) AS unique_articles
      FROM stockmagasin.stock_ewm
    `);
        console.log('[DEBUG] /unique-articles - Raw rows:', rows);
        return res.status(200).json({ data: rows[0]?.unique_articles || 0 });
    } catch (error) {
        console.error('[ERROR] /unique-articles -', error.message, error.stack);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;