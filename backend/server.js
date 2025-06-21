const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dimensionsRouter = require('./routes/dimensions');
let livraisonRouter;
let uploadRouter;

try {
    livraisonRouter = require('./routes/livraison');
    console.log('Routeur livraison chargé avec succès');
} catch (err) {
    console.error('Échec du chargement du routeur livraison :', err.message, err.stack);
    process.exit(1);
}

try {
    uploadRouter = require('./routes/uploads');
    console.log('Routeur uploads chargé avec succès');
} catch (err) {
    console.warn('Routeur uploads non trouvé, ignoré :', err.message);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Body:`, JSON.stringify(req.body, null, 2));
    next();
});

// Routes avec préfixe /api
app.use('/auth', authRoutes); // Supprimez /register redondant
if (uploadRouter) {
    app.use('/uploads', uploadRouter);
}
app.use('/livraison', livraisonRouter);
app.use('/dimensions', dimensionsRouter);

// Route de test DB
app.get('/test-db', async (req, res) => {
    const pool = require('./config/db');
    console.log('Pool importé dans /test-db :', pool ? 'Oui' : 'Non');
    try {
        const [rows] = await pool.query('SELECT 1 AS test');
        res.status(200).json({ message: 'Connexion à la base de données réussie', data: rows });
    } catch (err) {
        console.error('Erreur de test DB :', err.message, err.stack);
        res.status(500).json({ message: 'Échec de la connexion à la base de données', error: err.message });
    }
});

// Route par défaut
app.get('/', (req, res) => {
    res.send('API est en cours d\'exécution...');
});

// Gestionnaire 404
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 404: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Erreur serveur :`, err.message, err.stack);
    if (res.headersSent) {
        console.warn('En-têtes déjà envoyés, réponse ignorée');
        return;
    }
    res.status(500).json({
        message: 'Erreur serveur inattendue',
        error: err.message,
    });
});

const PORT = process.env.PORT || 5000;
(async () => {
    try {
        const pool = require('./config/db');
        console.log('Variables d\'environnement :', {
            DB_HOST: process.env.DB_HOST,
            DB_USER: process.env.DB_USER,
            DB_NAME: process.env.DB_NAME,
            PORT: process.env.PORT,
        });
        console.log('Pool importé :', pool ? 'Oui' : 'Non');
        if (!pool) {
            throw new Error('Pool est indéfini dans config/db');
        }
        const [rows] = await pool.query('SELECT 1 AS test');
        console.log('Connexion à la base de données réussie :', rows);
        app.listen(PORT, () => console.log(`Serveur en cours d\'exécution sur le port http://localhost:${PORT}`));
    } catch (err) {
        console.error('Échec du démarrage du serveur à cause d\'une erreur de base de données :', err.message, err.stack);
        process.exit(1);
    }
})();