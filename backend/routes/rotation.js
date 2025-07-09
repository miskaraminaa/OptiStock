const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/kpi', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const years = req.query.years ? req.query.years.split(',') : [];

        if (years.length === 0) {
            return res.status(400).json({ error: 'Veuillez sélectionner au moins une année.' });
        }

        const yearCondition = years.length > 0
            ? `AND (m.date_comptable LIKE '${years.map(year => `${year}%`).join("' OR m.date_comptable LIKE '")}' OR m.date_comptable IS NULL) 
               AND (t.Date_creation LIKE '${years.map(year => `${year}%`).join("' OR t.Date_creation LIKE '")}' OR t.Date_creation IS NULL) 
               AND (s.date_em LIKE '${years.map(year => `${year}%`).join("' OR s.date_em LIKE '")}' OR s.date_em IS NULL)`
            : '';

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
                    CASE 
                        WHEN COUNT(s.article) = 0 OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) IS NULL
                        THEN 'Aucune Donnée de Stock'
                        ELSE COALESCE(AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))), 0)
                    END AS averageStock,
                    CASE 
                        WHEN COUNT(s.article) = 0 OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) IS NULL OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) = 0
                        THEN 'Non Calculé'
                        WHEN SUM(CASE 
                            WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                            THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                            ELSE 0 
                        END) = 0
                        THEN 'Aucune Sortie'
                        ELSE COALESCE(
                            SUM(CASE 
                                WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                                THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                                ELSE 0 
                            END) 
                            / AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))),
                            0
                        )
                    END AS turnoverRate,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Aucune Tâche de Prélèvement'
                        ELSE COALESCE(
                            SUM(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                                AND t.Qte_reelle_pren_UQB IS NOT NULL 
                                AND t.Qte_theo_ced_UQB IS NOT NULL 
                                THEN 1 
                                ELSE 0 
                            END),
                            0
                        )
                    END AS stockoutTasks,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Aucune Tâche de Prélèvement'
                        ELSE COALESCE(COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END), 0)
                    END AS totalPickupTasks,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Non Calculé'
                        WHEN SUM(CASE 
                            WHEN t.Type_processus_magasin = '1010' 
                            AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                            AND t.Qte_reelle_pren_UQB IS NOT NULL 
                            AND t.Qte_theo_ced_UQB IS NOT NULL 
                            THEN 1 
                            ELSE 0 
                        END) = 0
                        THEN 'Aucune Rupture de Stock'
                        ELSE COALESCE(
                            (SUM(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                                AND t.Qte_reelle_pren_UQB IS NOT NULL 
                                AND t.Qte_theo_ced_UQB IS NOT NULL 
                                THEN 1 
                                ELSE 0 
                            END) * 100.0 / COUNT(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                THEN 1 
                                END)),
                            0
                        )
                    END AS stockoutRate
                FROM mb51 m
                LEFT JOIN le_tache t ON m.article = t.Produit AND t.Type_processus_magasin = '1010' AND t.Produit IS NOT NULL
                LEFT JOIN stock_ewm s ON m.article = s.article
                WHERE 1=1
                    ${yearCondition}
                    AND m.article IS NOT NULL
                GROUP BY m.article
            
                UNION
            
                SELECT 
                    t.Produit AS id,
                    COALESCE(
                        SUM(CASE 
                            WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                            THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                            ELSE 0 
                        END),
                        0
                    ) AS totalExits,
                    CASE 
                        WHEN COUNT(s.article) = 0 OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) IS NULL
                        THEN 'Aucune Donnée de Stock'
                        ELSE COALESCE(AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))), 0)
                    END AS averageStock,
                    CASE 
                        WHEN COUNT(s.article) = 0 OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) IS NULL OR AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))) = 0
                        THEN 'Non Calculé'
                        WHEN SUM(CASE 
                            WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                            THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                            ELSE 0 
                        END) = 0
                        THEN 'Aucune Sortie'
                        ELSE COALESCE(
                            SUM(CASE 
                                WHEN CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2)) < 0 
                                THEN ABS(CAST(REPLACE(REPLACE(m.quantite, ',', '.'), ' ', '') AS DECIMAL(10,2))) 
                                ELSE 0 
                            END) 
                            / AVG(CAST(REPLACE(REPLACE(s.quantite, ',', '.'), ' ', '') AS DECIMAL(10,3))),
                            0
                        )
                    END AS turnoverRate,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Aucune Tâche de Prélèvement'
                        ELSE COALESCE(
                            SUM(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                                AND t.Qte_reelle_pren_UQB IS NOT NULL 
                                AND t.Qte_theo_ced_UQB IS NOT NULL 
                                THEN 1 
                                ELSE 0 
                            END),
                            0
                        )
                    END AS stockoutTasks,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Aucune Tâche de Prélèvement'
                        ELSE COALESCE(COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END), 0)
                    END AS totalPickupTasks,
                    CASE 
                        WHEN COUNT(CASE WHEN t.Type_processus_magasin = '1010' THEN 1 END) = 0
                        THEN 'Non Calculé'
                        WHEN SUM(CASE 
                            WHEN t.Type_processus_magasin = '1010' 
                            AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                            AND t.Qte_reelle_pren_UQB IS NOT NULL 
                            AND t.Qte_theo_ced_UQB IS NOT NULL 
                            THEN 1 
                            ELSE 0 
                        END) = 0
                        THEN 'Aucune Rupture de Stock'
                        ELSE COALESCE(
                            (SUM(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                AND CAST(t.Qte_reelle_pren_UQB AS DECIMAL(10,2)) < CAST(t.Qte_theo_ced_UQB AS DECIMAL(10,2)) 
                                AND t.Qte_reelle_pren_UQB IS NOT NULL 
                                AND t.Qte_theo_ced_UQB IS NOT NULL 
                                THEN 1 
                                ELSE 0 
                            END) * 100.0 / COUNT(CASE 
                                WHEN t.Type_processus_magasin = '1010' 
                                THEN 1 
                                END)),
                            0
                        )
                    END AS stockoutRate
                FROM le_tache t
                LEFT JOIN mb51 m ON t.Produit = m.article
                LEFT JOIN stock_ewm s ON t.Produit = s.article
                WHERE 1=1
                    ${yearCondition}
                    AND t.Produit IS NOT NULL
                    AND t.Type_processus_magasin = '1010'
                GROUP BY t.Produit
                HAVING totalPickupTasks != 'Aucune Tâche de Prélèvement' OR averageStock != 'Aucune Donnée de Stock'
                ORDER BY id 
            `);

        connection.release();
        res.json(rows);
    } catch (error) {
        if (connection) connection.release();
        console.error('Error fetching KPI data:', error);
        res.status(500).json({ error: 'Erreur interne du serveur', details: error.message });
    }
});

module.exports = router;