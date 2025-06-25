const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const VALID_FILE_TYPES = ['LE', 'LS'];

// Route to fetch available file names from imported_file
router.post('/files', async (req, res) => {
    console.log('Received /files request with body:', req.body);
    const { type } = req.body;

    if (!type || !VALID_FILE_TYPES.includes(type)) {
        console.log(`Invalid treatment type received: ${type}`);
        return res.status(400).json({ message: `Invalid treatment type. Allowed types: ${VALID_FILE_TYPES.join(', ')}` });
    }

    const query = `SELECT DISTINCT fichier_name FROM stockmagasin.imported_file WHERE type = ? AND fichier_name IS NOT NULL`;
    try {
        console.log(`Fetching files for type ${type}: executing query "${query}" with param ${type}`);
        const [results] = await pool.query(query, [type]);
        const files = results.map((row) => row.fichier_name);
        console.log(`Returning ${files.length} files for type ${type}:`, files);
        return res.json({ files });
    } catch (err) {
        console.error(`Error fetching ${type} files:`, err.message, err.stack);
        return res.status(500).json({ message: 'Error fetching files', error: err.message });
    }
});

// Route to process file selection and treatments
router.post('/process', async (req, res) => {
    console.log('Received /process request with body:', req.body);

    try {
        // Validate req.body
        if (!req.body || typeof req.body !== 'object') {
            console.log('Invalid or missing request body:', req.body);
            return res.status(400).json({ message: 'Invalid or missing request body' });
        }

        const { type, fileName, value, stock } = req.body;

        // Log extracted fields
        console.log('Extracted fields:', { type, fileName, value, stock });

        if (!type || !fileName) {
            console.log('Missing required fields:', { type, fileName });
            return res.status(400).json({ message: 'Type and fileName are required' });
        }

        if (!VALID_FILE_TYPES.includes(type)) {
            console.log(`Invalid treatment type received: ${type}`);
            return res.status(400).json({ message: `Invalid treatment type. Allowed types: ${VALID_FILE_TYPES.join(', ')}` });
        }

        const validStocks = ['Terminée', 'Non terminée', 'Tous les statuts'];
        if (stock && !validStocks.includes(stock)) {
            console.log(`Invalid stock status received: ${stock}`);
            return res.status(400).json({ message: 'Invalid stock status' });
        }

        let query = '';
        const params = [fileName];
        const sub = stock === 'Terminée' ? '=' : '!=';

        // Debugging query for product 80001093
        if (value === '80001093') {
            const debugQuery = `
                SELECT t.Produit, s.name_file, d.id_article, d.longueur, d.largeur, d.hauteur, d.poids, d.volume
                FROM stockmagasin.le_tache t
                JOIN stockmagasin.le_status s ON t.Document = s.document
                LEFT JOIN stockmagasin.dimensions d ON TRIM(t.Produit) = TRIM(d.id_article)
                WHERE t.Produit = ? AND s.name_file = ?
            `;
            console.log('Debugging product 80001093 for fileName:', fileName);
            const [debugResults] = await pool.query(debugQuery, ['80001093', fileName]);
            console.log('Debug results for 80001093:', debugResults);
        }

        if (type === 'LE') {
            query = `
                SELECT DISTINCT
                    s.document AS Document,
                    t.Statut_tache_magasin,
                    t.Produit,
                    t.Designation_produit AS designation_article,
                    t.Qte_theo_ced_UQA,
                    t.emplacement_cedant,
                    t.Emplacement_prenant,
                    t.Qte_reelle_pren_UQA AS Quantite,
                    t.Qte_ecart_pren_UQA AS quantite_ecart,
                    d.poids AS poids,              
                    d.volume AS volume,            
                    s.statut_activite_magasin AS statut_entree_stock,
                    d.longueur AS longueur,
                    d.largeur AS largeur,
                    d.hauteur AS hauteur,
                    d.poids_global AS poids_global,       
                    d.volume_quantite AS volume_quantite,   
                    d.manutention AS manutention,
                    d.Type_Rayon AS Type_Rayon,
                FROM stockmagasin.le_status s
                LEFT JOIN stockmagasin.le_tache t ON s.document = t.Document
                LEFT JOIN stockmagasin.dimensions d ON TRIM(t.Produit) = TRIM(d.id_article)
                WHERE s.name_file = ?${value ? ' AND t.Produit = ?' : ''}${stock && stock !== 'Tous les statuts' ? ` AND s.statut_activite_magasin ${sub} 'Terminée'` : ''};
            `;
            if (value) params.push(value);
        } else if (type === 'LS') {
            query = `
                SELECT DISTINCT
                    s.document AS Document,
                    t.Statut_tache_magasin,
                    t.Produit,
                    t.Designation_produit AS designation_article,
                    t.Qte_theo_ced_UQA,
                    t.Emplacement_cedant,
                    t.Emplacement_prenant,
                    t.Qte_reelle_pren_UQA AS quantit,
                    t.Qte_ecart_pren_UQA AS quantite_ecart,
                    s.statut_activite_magasin AS statut_entree_stock, 
                    NULL AS famille,
                    NULL AS libelle_produit,
                    NULL AS Plant_Storage,
                    NULL AS Emplacement_EWM_Qte
                FROM stockmagasin.ls_status s
                LEFT JOIN stockmagasin.ls_tache t ON s.document = t.Document
                WHERE s.name_file = ?${value ? ' AND t.Produit = ?' : ''}${stock && stock !== 'Tous les statuts' ? ` AND s.statut_activite_magasin ${sub} 'Terminée'` : ''
                }`;
            if (value) params.push(value);
        }

        console.log(`Executing query for type ${type} with parameters:`, params);
        console.log(`Query: ${query}`);

        const QUERY_TIMEOUT = process.env.QUERY_TIMEOUT || 30000;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timed out')), QUERY_TIMEOUT);
        });

        const queryPromise = pool.query(query, params);
        const [rows] = await Promise.race([queryPromise, timeoutPromise]);

        console.log(`Query returned ${rows.length} rows`);
        return res.json(rows);
    } catch (error) {
        console.error(`Error processing request:`, error.message, error.stack);
        return res.status(500).json({ message: 'Unexpected server error', error: error.message });
    }
});

module.exports = router;