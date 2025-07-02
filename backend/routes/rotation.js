const express = require('express');
const pool = require('../config/db');
const multer = require('multer');

const router = express.Router();

router.get('/turnover', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const years = req.query.years ? req.query.years.split(',') : [];
        let yearCondition = '';

        if (years.length === 0) {
            return res.status(400).json({ error: 'Veuillez sélectionner au moins une année.' });
        }

        yearCondition = `AND (m.date_comptable LIKE '${years.map(year => `${year}%`).join("' OR m.date_comptable LIKE '")}' OR m.date_comptable IS NULL)`;

        const [rows] = await connection.execute(`
            SELECT 
                m.article AS id,
                COALESCE(
                    SUM(CASE 
                        WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                        THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                        ELSE 0 
                    END),
                    0
                ) AS totalExits,
                COALESCE(AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))), 0) AS averageStock,
                COALESCE(
                    CASE 
                        WHEN AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) > 0 
                        THEN SUM(CASE 
                            WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                            THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                            ELSE 0 
                        END) 
                             / AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) 
                        ELSE 0 
                    END, 
                    0
                ) AS turnoverRate
            FROM 
                mb51 m
            LEFT JOIN 
                stock_ewm s ON m.article = s.article
            WHERE 
                1=1
                ${yearCondition}
                AND (s.date_em LIKE '${years.map(year => `${year}%`).join("' OR s.date_em LIKE '")}' OR s.date_em IS NULL)
            GROUP BY 
                m.article
            HAVING 
                averageStock > 0
            ORDER BY 
                m.article ASC
        `);

        connection.release();
        res.json(rows);
    } catch (error) {
        if (connection) connection.release();
        console.error('Error fetching turnover data:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;