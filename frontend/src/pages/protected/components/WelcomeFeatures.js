import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ChartBarIcon,
    ClockIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

// Données statistiques échantillons
const statsData = [
    {
        title: 'Stock Total',
        value: '12 345',
        icon: <ChartBarIcon className="w-8 h-8" />,
        description: 'À travers tous les entrepôts',
    },
    {
        title: 'Mises à jour en Temps Réel',
        value: 'Instantané',
        icon: <ClockIcon className="w-8 h-8" />,
        description: 'Suivi en direct de l’inventaire',
    },
    {
        title: 'Accès Sécurisé',
        value: '100 %',
        icon: <ShieldCheckIcon className="w-8 h-8" />,
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
            className="card bg-base-100 shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300"
        >
            <div className="flex items-center gap-4">
                <div className="text-primary">{icon}</div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <p className="text-2xl font-bold text-primary">{value}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </motion.div>
    );
}

function WelcomeFeatures() {
    return (
        <main className="flex-grow container mx-auto px-4 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
            >
                <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">
                    Optimisez la Gestion de Votre Inventaire
                </h2>
                <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto">
                    Découvrez une plateforme innovante conçue pour simplifier les opérations de stock avec
                    une automatisation intelligente et des analyses approfondies.
                </p>
                <Link to="/app/dashboard">
                    <button className="btn btn-primary btn-lg mt-8 shadow-2xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                        Commencer Maintenant
                    </button>
                </Link>
            </motion.div>

            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
                {statsData.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
        </main>
    );
}

export default WelcomeFeatures;