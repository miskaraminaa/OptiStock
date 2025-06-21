const express = require('express');
const pool = require('../config/db');
const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.id, i.id_article, d.longueur, d.largeur, d.hauteur, d.poids, 
                   i.quantity_theoretical, i.quantity_counted, i.discrepancy, i.status, i.notes, 
                   d.volume, d.volume_quantite, d.Type_Rayon, d.manutention, d.poids_global
            FROM inventories i
            LEFT JOIN dimensions d ON i.id_article = d.id_article
        `);
        return res.status(200).json({ message: 'success', data: rows });
    } catch (error) {
        console.error('Erreur lors de la récupération des inventaires :', error.message);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.post('/start', async (req, res) => {
    const { id_article } = req.body;
    if (!id_article) {
        return res.status(400).json({ message: 'id_article est requis.' });
    }

    try {
        const [dimensions] = await pool.query(
            'SELECT quantite, volume, poids_global FROM dimensions WHERE id_article = ?',
            [id_article]
        );
        if (!dimensions.length) {
            return res.status(404).json({ message: 'Article non trouvé.' });
        }

        const { quantite: quantity_theoretical } = dimensions[0];
        const [existing] = await pool.query(
            'SELECT id FROM inventories WHERE id_article = ? AND status = "pending"',
            [id_article]
        );

        let inventory_id;
        if (existing.length === 0) {
            const [result] = await pool.query(
                'INSERT INTO inventories (id_article, quantity_theoretical) VALUES (?, ?)',
                [id_article, quantity_theoretical]
            );
            inventory_id = result.insertId;
        } else {
            inventory_id = existing[0].id;
        }

        return res.status(200).json({ message: 'Inventaire démarré ou récupéré', inventory_id });
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'inventaire :', error.message);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

router.post('/update', async (req, res) => {
    const { inventory_id, quantity_counted, notes } = req.body;
    if (!inventory_id || typeof quantity_counted !== 'number') {
        return res.status(400).json({ message: 'inventory_id et quantity_counted sont requis.' });
    }

    try {
        const [inventory] = await pool.query(
            'SELECT * FROM inventories WHERE id = ? AND status = "pending"',
            [inventory_id]
        );
        if (!inventory.length) {
            return res.status(404).json({ message: 'Inventaire non trouvé ou déjà complété.' });
        }

        const [dimensions] = await pool.query(
            'SELECT quantite FROM dimensions WHERE id_article = ?',
            [inventory[0].id_article]
        );
        const discrepancy = quantity_counted - dimensions[0].quantite;

        await pool.query(
            'UPDATE inventories SET quantity_counted = ?, discrepancy = ?, notes = ?, status = "completed" WHERE id = ?',
            [quantity_counted, discrepancy, notes, inventory_id]
        );

        return res.status(200).json({ message: 'Inventaire mis à jour avec succès', discrepancy });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'inventaire :', error.message);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;