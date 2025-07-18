import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaChartLine, FaClock, FaShieldAlt } from 'react-icons/fa';

// Données statistiques échantillons
const statsData = [
    {
        title: 'Stock Total',
        value: '12 345',
        icon: <FaChartLine className="w-8 h-8 text-blue-600" />,
        description: 'À travers tous les entrepôts',
    },
    {
        title: 'Mises à jour en Temps Réel',
        value: 'Instantané',
        icon: <FaClock className="w-8 h-8 text-blue-600" />,
        description: 'Suivi en direct de l’inventaire',
    },
    {
        title: 'Accès Sécurisé',
        value: '100 %',
        icon: <FaShieldAlt className="w-8 h-8 text-blue-600" />,
        description: 'Données protégées',
    },
];

// Composant réutilisable StatCard
function StatCard({ title, value, icon, description }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300"
        >
            <div className="flex items-center gap-4">
                <div>{icon}</div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <p className="text-2xl font-bold text-blue-600">{value}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </motion.div>
    );
}

function WelcomeFeatures() {
    return (
        <main className="flex-grow mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
                    Optimisez la Gestion de Votre Inventaire
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
                    Découvrez une plateforme conçue pour simplifier les opérations de stock avec des analyses approfondies.
                </p>
                <Link to="/app.">
                    <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all duration-200 text-sm font-medium hover:scale-105">
                        Commencer maintenant
                    </button>
                </Link>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {statsData.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
        </main>
    );
}

export default WelcomeFeatures;