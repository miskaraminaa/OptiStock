const express = require('express');
const pool = require('../config/db');
const router = express.Router();

const validateDateRange = (startDate, endDate) => {
    console.log(`[DEBUG] Validation des dates - startDate: ${ startDate }, endDate: ${ endDate } `);
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log(`[DEBUG] Dates analysées - start: ${ start }, end: ${ end } `);
    return start instanceof Date && !isNaN(start) && end instanceof Date && !isNaN(end) && start <= end;
};

// Input vs Output
router.get('/input-vs-output', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log(`[DEBUG] / input - vs - output - Requête: startDate = ${ startDate }, endDate = ${ endDate }, article = ${ article } `);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT DATE(date_comptable) AS date,
    SUM(CASE WHEN code_mouvement IN('101', '531') THEN CAST(quantite AS DECIMAL) ELSE 0 END) AS input_quantity,
        SUM(CASE WHEN code_mouvement IN('201', '261') THEN ABS(CAST(quantite AS DECIMAL)) ELSE 0 END) AS output_quantity
            FROM stockmagasin.mb51
            WHERE DATE(date_comptable) BETWEEN ? AND ?
    ${ article ? 'AND article = ?' : '' }
            GROUP BY DATE(date_comptable)
            ORDER BY date
    `, article ? [startDate, endDate, article] : [startDate, endDate]);
        console.log(`[DEBUG] / input - vs - output - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / input - vs - output - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Stock Over Time
router.get('/stock-over-time', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log(`[DEBUG] / stock - over - time - Requête: startDate = ${ startDate }, endDate = ${ endDate }, article = ${ article } `);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT DATE(date_em) AS date, SUM(quantite) AS total_quantity
            FROM stockmagasin.stock_ewm
1WHERE DATE(date_em) BETWEEN ? AND ?
    ${ article ? 'AND article = ?' : '' }
            GROUP BY DATE(date_em)
            ORDER BY date
    `, article ? [startDate, endDate, article] : [startDate, endDate]);
        console.log(`[DEBUG] / stock - over - time - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / stock - over - time - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Division Distribution
router.get('/division-distribution', async (req, res) => {
    console.log(`[DEBUG] / division - distribution - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT division, COUNT(DISTINCT article) AS article_count
            FROM stockmagasin.stock_ewm
            GROUP BY division
    `);
        console.log(`[DEBUG] / division - distribution - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / division - distribution - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Type Stock Distribution
router.get('/type-stock-distribution', async (req, res) => {
    console.log(`[DEBUG] / type - stock - distribution - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT type_stock, COUNT(DISTINCT article) AS article_count
            FROM stockmagasin.stock_ewm
            GROUP BY type_stock
    `);
        console.log(`[DEBUG] / type - stock - distribution - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / type - stock - distribution - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Movement by Code
router.get('/movement-by-code', async (req, res) => {
    const { startDate, endDate, article } = req.query;
    console.log(`[DEBUG] / movement - by - code - Requête: startDate = ${ startDate }, endDate = ${ endDate }, article = ${ article } `);
    try {
        let query = `
            SELECT code_mouvement, SUM(CAST(quantite AS DECIMAL)) AS total_quantity
            FROM stockmagasin.mb51
            WHERE 1 = 1
    `;
        const params = [];

        if (startDate && endDate) {
            if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
            query += ` AND DATE(date_comptable) BETWEEN ? AND ? `;
            params.push(startDate, endDate);
        }
        if (article) {
            query += ` AND article = ? `;
            params.push(article);
        }
        query += ` GROUP BY code_mouvement`;

        const [rows] = await pool.query(query, params);
        console.log(`[DEBUG] / movement - by - code - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / movement - by - code - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Stock vs Price
router.get('/stock-vs-price', async (req, res) => {
    console.log(`[DEBUG] / stock - vs - price - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT article, quantite, prix
            FROM stockmagasin.stock_ewm
            WHERE quantite IS NOT NULL AND prix IS NOT NULL
    `);
        console.log(`[DEBUG] / stock - vs - price - Lignes retournées: ${ rows.length } `);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] / stock - vs - price - ${ error.message } `, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Articles
router.get('/articles', async (req, res) => {
    console.log(`[DEBUG] / articles - Requête reçue`);
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
        console.log(`[DEBUG] / articles - Nombre d'articles: ${articles.length}`);
return res.status(200).json({ data: articles.sort((a, b) => a.localeCompare(b)) });
    } catch (error) {
    console.error(`[ERREUR] /articles - ${error.message}`, error.stack);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
}
});

// Total Stock
router.get('/total-stock', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /total-stock - Requête: startDate=${startDate}, endDate=${endDate}`);
    try {
        let query = `
            SELECT SUM(quantite) AS total_stock
            FROM stockmagasin.stock_ewm
        `;
        const params = [];

        if (startDate && endDate) {
            if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
            query += ` WHERE DATE(date_em) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        const [rows] = await pool.query(query, params);
        console.log(`[DEBUG] /total-stock - Lignes retournées: ${JSON.stringify(rows, null, 2)}`);
        return res.status(200).json({ data: rows[0]?.total_stock || 0 });
    } catch (error) {
        console.error(`[ERREUR] /total-stock - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Total Input (Updated to count tasks from le_tache and ls_tache)
router.get('/total-input', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /total-input - Requête: startDate=${startDate}, endDate=${endDate}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT (
                (SELECT COUNT(*) FROM stockmagasin.le_tache WHERE DATE(Date_creation) BETWEEN ? AND ?) +
                (SELECT COUNT(*) FROM stockmagasin.ls_tache WHERE DATE(Date_creation) BETWEEN ? AND ?)
            ) AS total_input
        `, [startDate, endDate, startDate, endDate]);
        console.log(`[DEBUG] /total-input - Lignes retournées: ${JSON.stringify(rows, null, 2)}`);
        return res.status(200).json({ data: rows[0]?.total_input || 0 });
    } catch (error) {
        console.error(`[ERREUR] /total-input - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Total Output
router.get('/total-output', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /total-output - Requête: startDate=${startDate}, endDate=${endDate}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT SUM(CASE WHEN code_mouvement IN ('201', '261') THEN ABS(CAST(quantite AS DECIMAL)) ELSE 0 END) AS total_output
            FROM stockmagasin.mb51
            WHERE DATE(date_comptable) BETWEEN ? AND ?
        `, [startDate, endDate]);
        console.log(`[DEBUG] /total-output - Lignes retournées: ${JSON.stringify(rows, null, 2)}`);
        return res.status(200).json({ data: rows[0]?.total_output || 0 });
    } catch (error) {
        console.error(`[ERREUR] /total-output - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Unique Articles
router.get('/unique-articles', async (req, res) => {
    console.log(`[DEBUG] /unique-articles - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT COUNT(DISTINCT article) AS unique_articles
            FROM stockmagasin.stock_ewm
        `);
        console.log(`[DEBUG] /unique-articles - Lignes retournées: ${JSON.stringify(rows, null, 2)}`);
        return res.status(200).json({ data: rows[0]?.unique_articles || 0 });
    } catch (error) {
        console.error(`[ERREUR] /unique-articles - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Delivery Status
router.get('/delivery-status', async (req, res) => {
    console.log(`[DEBUG] /delivery-status - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT statut_sortie_marchandises AS status, COUNT(*) AS count
            FROM stockmagasin.ls_status
            WHERE statut_sortie_marchandises IS NOT NULL
            GROUP BY statut_sortie_marchandises
        `);
        console.log(`[DEBUG] /delivery-status - Lignes retournées: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] /delivery-status - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Task Completion
router.get('/task-completion', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /task-completion - Requête: startDate=${startDate}, endDate=${endDate}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT Statut_tache_magasin AS status, COUNT(*) AS count
            FROM stockmagasin.le_tache
            WHERE DATE(Date_creation) BETWEEN ? AND ?
            GROUP BY Statut_tache_magasin
        `, [startDate, endDate]);
        console.log(`[DEBUG] /task-completion - Lignes retournées: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] /task-completion - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Stock Discrepancies
router.get('/stock-discrepancies', async (req, res) => {
    console.log(`[DEBUG] /stock-discrepancies - Requête reçue`);
    try {
        const [rows] = await pool.query(`
            SELECT SAP_Material AS article, 
                   Qté_validée_SAP AS sap_quantity, 
                   QTE_NX AS nx_quantity,
                   (Qté_validée_SAP - QTE_NX) AS discrepancy
            FROM stockmagasin.migration
            WHERE Qté_validée_SAP IS NOT NULL AND QTE_NX IS NOT NULL
            HAVING discrepancy != 0
            ORDER BY ABS(discrepancy) DESC
            LIMIT 50
        `);
        console.log(`[DEBUG] /stock-discrepancies - Lignes retournées: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] /stock-discrepancies - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Stock Quality
router.get('/stock-quality', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /stock-quality - Requête: startDate=${startDate}, endDate=${endDate}`);
    try {
        let query = `
            SELECT 
                COALESCE(SUM(stock_utilisation_libre), 0) AS free_stock,
                COALESCE(SUM(stock_controle_qualite), 0) AS quality_control_stock,
                COALESCE(SUM(stock_bloque), 0) AS blocked_stock
            FROM stockmagasin.stock_iam
        `;
        const params = [];

        if (startDate && endDate) {
            if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
            query += ` WHERE DATE(date_reporting) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        const [rows] = await pool.query(query, params);
        console.log(`[DEBUG] /stock-quality - Lignes retournées: ${JSON.stringify(rows, null, 2)}`);
        return res.status(200).json({
            data: {
                free_stock: Number(rows[0]?.free_stock || 0),
                quality_control_stock: Number(rows[0]?.quality_control_stock || 0),
                blocked_stock: Number(rows[0]?.blocked_stock || 0)
            }
        });
    } catch (error) {
        console.error(`[ERREUR] /stock-quality - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Delivery Delays
router.get('/delivery-delays', async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`[DEBUG] /delivery-delays - Requête: startDate=${startDate}, endDate=${endDate}`);
    if (!validateDateRange(startDate, endDate)) return res.status(400).json({ message: 'Plage de dates invalide' });
    try {
        const [rows] = await pool.query(`
            SELECT 
                document,
                DATEDIFF(DATE(date_livraison_definitive), DATE(date_livraison_planifiee)) AS delay_days
            FROM stockmagasin.ls_status
            WHERE date_livraison_planifiee IS NOT NULL 
            AND date_livraison_definitive IS NOT NULL
            AND DATE(date_livraison_planifiee) BETWEEN ? AND ?
            HAVING delay_days > 0
            ORDER BY delay_days DESC
            LIMIT 50
        `, [startDate, endDate]);
        console.log(`[DEBUG] /delivery-delays - Lignes retournées: ${rows.length}`);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error(`[ERREUR] /delivery-delays - ${error.message}`, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
