import { lazy } from 'react';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import DocumentIcon from '@heroicons/react/24/outline/DocumentIcon';
import ArrowLeftOnRectangleIcon from '@heroicons/react/24/outline/ArrowLeftOnRectangleIcon';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import InboxArrowDownIcon from '@heroicons/react/24/outline/InboxArrowDownIcon';
import KeyIcon from '@heroicons/react/24/outline/KeyIcon';
import CubeIcon from '@heroicons/react/24/outline/CubeIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import ClipboardDocumentListIcon from '@heroicons/react/24/outline/ClipboardDocumentListIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ArchiveBoxIcon from '@heroicons/react/24/outline/ArchiveBoxIcon'; // Nouvelle icône importée

// Lazy-loaded components
const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Charts = lazy(() => import('../pages/protected/Charts'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const Dimensions = lazy(() => import('../pages/protected/Dimensions'));
const Rotations = lazy(() => import('../pages/protected/Rotations'));
const Explorer = lazy(() => import('../pages/protected/Explorer'));
const Controle = lazy(() => import('../pages/protected/Controle'));
const Rangement = lazy(() => import('../pages/protected/Rangement'));
const RangementLE = lazy(() => import('../pages/protected/RangementLE'));

const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));

const iconClasses = `h-6 w-6`;
const submenuIconClasses = `h-5 w-5`;

const logoutUser = () => {
    console.log(`[${new Date().toISOString()}] Déconnexion déclenchée`);
    localStorage.clear();
    console.log(`[${new Date().toISOString()}] Stockage local vidé :`, localStorage);
    window.location.href = '/login';
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
        path: '/app/controle',
        component: Controle,
        icon: <CheckCircleIcon className={iconClasses} />,
        name: 'Controle Livraison',
    },
    {
        path: '/app/dimensions',
        component: Dimensions,
        icon: <CubeIcon className={iconClasses} />,
        name: 'Dimensions',
    },
    {
        path: '/app/rotations',
        component: Rotations,
        icon: <ArrowPathIcon className={iconClasses} />,
        name: 'Calcul des KPI',
    },
    {
        path: '/app/explorer',
        component: Explorer,
        icon: <ClipboardDocumentListIcon className={iconClasses} />,
        name: 'Explorer Articles',
    },
    {
        path: '/app/rangementle',
        component: RangementLE,
        icon: <ArchiveBoxIcon className={iconClasses} />, // Remplacement par ArchiveBoxIcon
        name: 'Guide de rangement LE',
    },
    {
        path: '/app/rangement',
        component: Rangement,
        icon: <ArchiveBoxIcon className={iconClasses} />, // Remplacement par ArchiveBoxIcon
        name: 'Guide de rangement global',
    },

    {
        path: '/app/charts',
        component: Charts,
        icon: <ChartBarIcon className={iconClasses} />,
        name: 'Tableaux de bord',
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
        component: () => logoutUser(),
        icon: <ArrowLeftOnRectangleIcon className={iconClasses} />,
        name: 'Déconnexion',
        onClick: logoutUser,
    },
];

export default routes;