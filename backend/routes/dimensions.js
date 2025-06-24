const express = require('express');
const pool = require('../config/db');
const multer = require('multer');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

console.log('Imported pool in dimensions.js:', pool ? 'Yes' : 'No');

// Log all routes for debugging
router.stack.forEach((layer) => {
    if (layer.route) {
        console.log(`[${new Date().toISOString()}] Registered route: ${layer.route.path} ${layer.route.methods}`);
    }
});

// Route to fetch unique article IDs
router.get('/ids', async (req, res) => {
    try {
        console.log('Querying database for IDs...');
        console.log('Pool query method:', pool.query ? 'Available' : 'Undefined');
        const [rows] = await pool.query('SELECT DISTINCT Produit FROM stockmagasin.le_tache');
        const ids = rows.map(row => row.Produit || '');
        console.log("Fetched IDs:", ids);
        if (ids.length === 0) {
            return res.status(404).json({ message: 'Aucun ID trouvé dans le_tache.' });
        }
        return res.status(200).json({ ids });
    } catch (error) {
        console.error("Error fetching IDs:", error.message, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route to fetch all dimensions
router.get('/', async (req, res) => {
    try {
        console.log('Querying database for all dimensions...');
        const [rows] = await pool.query('SELECT * FROM dimensions');
        console.log("Fetched dimensions:", rows);
        return res.status(200).json({ message: 'success', data: rows });
    } catch (error) {
        console.error("Error fetching dimensions:", error.message, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Route to update or insert dimensions
router.post('/', upload.none(), async (req, res) => { // Added upload.none() to handle non-file POST
    const { id_article, longueur, largeur, hauteur, poids, qte } = req.body;

    // Validation des entrées
    if (!id_article || typeof longueur !== 'number' || typeof largeur !== 'number' ||
        typeof hauteur !== 'number' || typeof poids !== 'number' || typeof qte !== 'number') {
        console.error('Entrée invalide :', req.body);
        return res.status(400).json({ message: 'Tous les champs sont requis et doivent être des nombres (sauf id_article).' });
    }

    console.log('Données reçues :', req.body);

    const volume = longueur * largeur * hauteur;
    const vqte = volume / qte;
    const poids_global = qte * poids;
    let typeRayon = 'Non défini';
    let manutention = '';

    if (isNaN(volume) || isNaN(poids_global)) {
        console.error('Calcul invalide : volume ou poids_global est NaN');
        return res.status(400).json({ message: 'Calcul des dimensions invalide.' });
    }

    console.log('Calculs - volume:', volume, 'poids_global:', poids_global);

    if (poids_global >= 16) {
        manutention = 'Mécanique';
    } else {
        manutention = 'Manuelle';
    }

    if (volume >= 0 && volume <= 0.56 && poids_global >= 0 && poids_global <= 4) {
        typeRayon = 'Rayonnage à étagère avec bac-tiroir';
    } else if (volume >= 0.57 && volume <= 1.00 && poids_global >= 7 && poids_global <= 15) {
        typeRayon = 'Rayonnage à étagère';
    } else if (volume >= 1.01 && volume <= 1.584 && poids_global >= 16 && poids_global <= 1500) {
        typeRayon = 'GROS PORTEUR 9 NIVEAUX';
    } else if (volume >= 1.585 && volume <= 2.376 && poids_global >= 1501 && poids_global <= 1700) {
        typeRayon = 'GROS PORTEUR 6 NIVEAUX';
    } else if (volume >= 2.377 && volume <= 3.168 && poids_global >= 1701 && poids_global <= 1800) {
        typeRayon = 'GROS PORTEUR 5 NIVEAUX';
    } else if (volume >= 3.169 && volume <= 4.55 && poids_global >= 1801 && poids_global <= 1900) {
        typeRayon = 'GROS PORTEUR 4 NIVEAUX';
    } else if (volume >= 4.551 && volume <= 5.148 && poids_global >= 1901 && poids_global <= 2000) {
        typeRayon = 'GROS PORTEUR 3 NIVEAUX';
    } else if (volume > 5.148 || poids_global > 2000) {
        typeRayon = 'Type personnalisé (hors plage)';
    }

    const query = `
        INSERT INTO dimensions (id_article, longueur, largeur, hauteur, poids, quantite, volume, volume_quantite, Type_Rayon, manutention, poids_global)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            longueur = ?,
            largeur = ?,
            hauteur = ?,
            poids = ?,
            quantite = ?,
            volume = ?,
            volume_quantite = ?,
            Type_Rayon = ?,
            manutention = ?,
            poids_global = ?
    `;

    const values = [
        id_article, longueur, largeur, hauteur, poids, qte, volume, vqte, typeRayon, manutention, poids_global,
        longueur, largeur, hauteur, poids, qte, volume, vqte, typeRayon, manutention, poids_global
    ];

    try {
        const [results] = await pool.query(query, values);
        console.log('Résultats de la requête :', results);

        // Récupérer l'enregistrement mis à jour ou inséré
        const [inserted] = await pool.query(
            `SELECT * FROM dimensions WHERE id_article = ?`,
            [id_article]
        );
        console.log('Enregistrement inséré/mis à jour :', inserted);

        return res.status(200).json({ message: 'succès', data: inserted });
    } catch (error) {
        console.error("Erreur de la base de données :", error.message, error.stack);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;