// backend/config/initDatabase.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        // Connexion SANS sélectionner de base (juste pour CREATE DATABASE)
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        // Crée la base si elle n'existe pas
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log('Base de données vérifiée / créée');

        // Connexion à la bonne base
        await connection.changeUser({ database: process.env.DB_NAME });

        // Vérifie s'il y a des tables
        const [tables] = await connection.query(`SHOW TABLES`);
        if (tables.length === 0) {
            console.log(' Aucune table trouvée. Import depuis le fichier SQL...');

            const backupPath = path.join(__dirname, '../mysql/stockmagasin_backup.sql');
            const sql = fs.readFileSync(backupPath, 'utf8');

            await connection.query(sql);
            console.log('Base de données restaurée depuis le fichier SQL');
        } else {
            console.log('Tables déjà présentes. Pas de restauration nécessaire');
        }

        await connection.end();
    } catch (err) {
        console.error('Erreur d\'initialisation de la base de données :', err.message);
        throw err;
    }
}

module.exports = initializeDatabase;
