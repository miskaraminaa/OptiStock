const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const initializeDatabase = require('./config/initDatabase');

const authRoutes = require('./routes/auth');
const dimensionsRouter = require('./routes/dimensions');
const explorationRouter = require('./routes/exploration');
const chartsRouter = require('./routes/charts');
const controleRouter = require('./routes/controle');
const rangementRouter = require('./routes/rangement');
const rangementLeRouter = require('./routes/rangementle');

let livraisonRouter;
let uploadRouter;
let rotaRouter;

try {
    rotaRouter = require('./routes/rotation');
    console.log('Routeur rotation chargé avec succès');
} catch (err) {
    console.error('Échec du chargement du routeur rotation :', err.message, err.stack);
    process.exit(1);
}
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
    origin: ['http://localhost:5000'], // Matches backend port
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Body:`, JSON.stringify(req.body, null, 2));
    next();
});

// Serve React build
const buildPath = path.join(__dirname, 'build');
console.log(`Serving static files from: ${buildPath}`);
app.use(express.static(buildPath));

// Routes
app.use('/auth', authRoutes);
if (uploadRouter) {
    app.use('/uploads', uploadRouter);
}
app.use('/livraison', livraisonRouter);
app.use('/dimensions', dimensionsRouter);
app.use('/explorer', explorationRouter);
app.use('/charts', chartsRouter);
app.use('/rotation', rotaRouter);
app.use('/controle', controleRouter);
app.use('/rangement', rangementRouter);
app.use('/rangement-le', rangementLeRouter);

// Test DB route
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

// Catch-all route for React SPA (Express v5 syntax)
app.get(/(.*)/, (req, res) => {
    console.log(`[${new Date().toISOString()}] Serving index.html for path: ${req.path}`);
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) {
            console.error(`[${new Date().toISOString()}] Failed to serve index.html: ${err.message}`);
            res.status(404).json({ message: 'Page non trouvée' });
        }
    });
});

// 404 handler
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 404: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Route non trouvée' });
});

// Global error handler
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
        console.log('Initialisation de la base de données...');
        await initializeDatabase();
        console.log('Base de données initialisée avec succès');

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
        console.error('Échec du démarrage du serveur à cause d\'une erreur :', err.message, err.stack);
        process.exit(1);
    }
})();