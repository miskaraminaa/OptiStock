const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET / - Fetch storage data with pagination, precise search, and group by article
router.get('/', async (req, res) => {
    try {
        const { search, page = 1 } = req.query;
        const limit = 25;
        const offset = Math.max(0, (parseInt(page) - 1) * limit);

        // Query for stock data with migration join and group by article
        let stockQuery = `
            SELECT 
                s.article AS article_code,
                MAX(s.designation_article) AS description,
                MAX(s.numero_magasin) AS numero_magasin,
                MAX(s.division) AS division,
                MAX(s.magasin) AS warehouse,
                MAX(s.emplacement) AS bin_location,
                MAX(s.type_magasin) AS type_magasin,
                SUM(s.quantite) AS quantity,
                MAX(s.unite_qte_base) AS unit,
                MAX(s.type_stock) AS type_stock,
                MAX(s.designation_type_stock) AS designation_type_stock,
                MAX(s.groupe_valorisation) AS groupe_valorisation,
                MAX(s.prix) AS pmp,
                SUM(s.valeur_stock) AS valeur_stock,
                MAX(s.devise) AS devise,
                MAX(s.date_em) AS date_em,
                MAX(s.derniere_sortie) AS derniere_sortie,
                MAX(s.name_file) AS name_file,
                MAX(m.Marque) AS Marque,
                MAX(m.Oracle_item_code) AS Oracle_item_code,
                MAX(m.DESCRIPTION) AS migration_description,
                MAX(m.Qté_validée_SAP) AS Qté_validée_SAP,
                MAX(m.SAP_Material) AS SAP_Material,
                MAX(m.PLANT) AS PLANT,
                MAX(m.Plant_Validé) AS Plant_Validé,
                MAX(m.Storage_Location) AS Storage_Location,
                MAX(m.Storage_location_Validé) AS Storage_location_Validé,
                MAX(m.local) AS local,
                MAX(m.BIN_SAP) AS BIN_SAP,
                MAX(m.Nombre_de_bin_NX) AS Nombre_de_bin_NX,
                GROUP_CONCAT(
                    CONCAT(m.bin, ':', 
                        CASE 
                            WHEN m.QTE_NX IS NOT NULL THEN FORMAT(m.QTE_NX, 3)
                            ELSE 'N/A'
                        END
                    ) 
                    SEPARATOR ', '
                ) AS bins_with_qte_nx
            FROM stock_ewm s
            LEFT JOIN migration m ON s.article = m.SAP_Material
            WHERE s.article IS NOT NULL
        `;
        let stockCountQuery = `
            SELECT COUNT(DISTINCT s.article) AS total 
            FROM stock_ewm s
            LEFT JOIN migration m ON s.article = m.SAP_Material
            WHERE s.article IS NOT NULL
        `;
        const stockParams = [];
        if (search) {
            stockQuery += ` AND (s.article = ? OR s.designation_article LIKE ? OR m.Marque LIKE ? OR m.DESCRIPTION LIKE ?)`;
            stockCountQuery += ` AND (s.article = ? OR s.designation_article LIKE ? OR m.Marque LIKE ? OR m.DESCRIPTION LIKE ?)`;
            stockParams.push(search, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        stockQuery += ` GROUP BY s.article ORDER BY s.article LIMIT ? OFFSET ?`;
        stockParams.push(limit, offset);

        const [stockResults] = await pool.query(stockQuery, stockParams);
        const [stockCountResult] = await pool.query(stockCountQuery, stockParams.slice(0, -2));
        const totalRecords = stockCountResult[0].total;

        // Format results
        const formattedResults = stockResults.map(item => ({
            article_code: item.article_code,
            description: item.description,
            numero_magasin: item.numero_magasin,
            division: item.division,
            warehouse: item.warehouse,
            bin_location: item.bin_location,
            type_magasin: item.type_magasin,
            quantity: item.quantity,
            unit: item.unit,
            type_stock: item.type_stock,
            designation_type_stock: item.designation_type_stock,
            groupe_valorisation: item.groupe_valorisation,
            pmp: item.pmp,
            valeur_stock: item.valeur_stock,
            devise: item.devise,
            date_em: item.date_em,
            derniere_sortie: item.derniere_sortie,
            name_file: item.name_file,
            Marque: item.Marque,
            Oracle_item_code: item.Oracle_item_code,
            migration_description: item.migration_description,
            Qté_validée_SAP: item.Qté_validée_SAP,
            SAP_Material: item.SAP_Material,
            PLANT: item.PLANT,
            Plant_Validé: item.Plant_Validé,
            Storage_Location: item.Storage_Location,
            Storage_location_Validé: item.Storage_location_Validé,
            local: item.local,
            BIN_SAP: item.BIN_SAP,
            Nombre_de_bin_NX: item.Nombre_de_bin_NX,
            bins_with_qte_nx: item.bins_with_qte_nx || 'N/A'
        }));

        res.json({
            data: formattedResults,
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
