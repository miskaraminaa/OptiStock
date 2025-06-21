import { lazy } from 'react';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import DocumentIcon from '@heroicons/react/24/outline/DocumentIcon';
import ArrowLeftOnRectangleIcon from '@heroicons/react/24/outline/ArrowLeftOnRectangleIcon';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import InboxArrowDownIcon from '@heroicons/react/24/outline/InboxArrowDownIcon';
import KeyIcon from '@heroicons/react/24/outline/KeyIcon';
import CubeIcon from '@heroicons/react/24/outline/CubeIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon'; // Corrected import

// Lazy-loaded components
const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Charts = lazy(() => import('../pages/protected/Charts'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const Dimensions = lazy(() => import('../pages/protected/Dimensions'));
const Rotations = lazy(() => import('../pages/protected/Rotations'));

const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));

const iconClasses = `h-6 w-6`;
const submenuIconClasses = `h-5 w-5`;

const logoutUser = () => {
    console.log('Déconnexion déclenchée');
    localStorage.clear();
    console.log('Stockage local vidé :', localStorage);
    window.location.href = '/login'; // Rediriger vers la page de connexion
};

const routes = [
    {
        path: '/app/dashboard',
        component: Dashboard,
        icon: <Squares2X2Icon className={iconClasses} />,
        name: 'Téléchargement des fichiers',
    },
    {
        path: '/app/leads',
        component: Leads,
        icon: <InboxArrowDownIcon className={iconClasses} />,
        name: 'Livraison',
    },
    {
        path: '/app/charts',
        component: Charts,
        icon: <ChartBarIcon className={iconClasses} />,
        name: 'Analytique',
    },
    {
        path: '/app/dimensions',
        component: Dimensions,
        icon: <CubeIcon className={iconClasses} />,
        name: 'Dimensions',
    },
    {
        path: '/app/rotations', // Nouveau chemin pour les rotations
        component: Rotations,
        icon: <ArrowPathIcon className={iconClasses} />, // Icône mise à jour
        name: 'Calcul des rotations', // Nom reflétant la fonctionnalité
    },
    {
        path: '',
        icon: <Cog6ToothIcon className={`${iconClasses} inline`} />,
        name: 'Paramètres',
        submenu: [
            {
                path: '/forgot-password',
                component: ForgotPassword,
                icon: <KeyIcon className={submenuIconClasses} />,
                name: 'Mot de passe oublié',
            },
        ],
    },
    {
        path: '/app/welcome',
        component: Welcome,
        icon: <DocumentIcon className={iconClasses} />,
        name: 'Bienvenue',
    },
    {
        path: null,
        component: 'Déconnexion',
        icon: <ArrowLeftOnRectangleIcon className={iconClasses} />,
        name: 'Déconnexion',
        onClick: logoutUser,
    },
];

export default routes;