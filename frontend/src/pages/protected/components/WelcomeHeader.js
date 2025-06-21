import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StockIcon from '@heroicons/react/24/outline/CircleStackIcon';

function WelcomeHeader({ onStartNow }) {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100/80 backdrop-blur-md shadow-lg py-6 sticky top-0 z-10"
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <StockIcon className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary tracking-tight">
                            Gestion de Stock OCP
                        </h1>
                        <p className="text-base text-base-content/60 mt-1">
                            Votre plateforme ultime de gestion d'inventaire
                        </p>
                    </div>
                </div>
                <Link to="/app/dashboard">
                    <button
                        className="btn btn-outline btn-primary"
                        onClick={onStartNow}
                    >
                        Importer
                    </button>
                </Link>
            </div>
        </motion.header>
    );
}

export default WelcomeHeader;