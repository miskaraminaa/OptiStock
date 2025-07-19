import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCubes } from 'react-icons/fa';

function WelcomeHeader({ onStartNow }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg py-6 sticky top-0 z-10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaCubes className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Gestion de Stock
            </h1>
            <p className="text-base text-gray-600 mt-1">
              Votre plateforme de gestion d'inventaire
            </p>
          </div>
        </div>
        <Link to="/app/dashboard">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-200 text-sm font-medium"
            onClick={onStartNow}
          >
            Commencer
          </button>
        </Link>
      </div>
    </motion.header>
  );
}

export default WelcomeHeader;
