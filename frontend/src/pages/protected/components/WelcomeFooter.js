import React from 'react';
import { Link } from 'react-router-dom';

function WelcomeFooter() {
    return (
        <footer className="bg-white shadow-lg py-6 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-600 text-sm">
                        © {new Date().getFullYear()} Gestion de Stock. Tous droits réservés.
                    </p>
                    <div className="flex space-x-4 mt-4 sm:mt-0">
                        <Link to="/about" className="text-blue-600 hover:text-blue-700 text-sm">
                            À propos
                        </Link>
                       
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default WelcomeFooter;