import { lazy } from 'react';
import BellIcon from '@heroicons/react/24/outline/BellIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import TableCellsIcon from '@heroicons/react/24/outline/TableCellsIcon';
import CodeBracketSquareIcon from '@heroicons/react/24/outline/CodeBracketSquareIcon';
import DocumentIcon from '@heroicons/react/24/outline/DocumentIcon';
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import ArrowLeftOnRectangleIcon from '@heroicons/react/24/outline/ArrowLeftOnRectangleIcon';
import UserIcon from '@heroicons/react/24/outline/UserIcon';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import InboxArrowDownIcon from '@heroicons/react/24/outline/InboxArrowDownIcon';
import KeyIcon from '@heroicons/react/24/outline/KeyIcon';
import DocumentDuplicateIcon from '@heroicons/react/24/outline/DocumentDuplicateIcon';
import Explorer from '../pages/protected/Explorer';

// Lazy-loaded components
const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Charts = lazy(() => import('../pages/protected/Charts'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));

const iconClasses = `h-6 w-6`;
const submenuIconClasses = `h-5 w-5`;

const logoutUser = () => {
  console.log('Logout triggered');
  localStorage.clear();
  console.log('Local storage cleared:', localStorage);
  window.location.href = '/login'; // Redirect to login
};

const routes = [
  {
    path: '/app/dashboard',
    component: Dashboard,
    icon: <Squares2X2Icon className={iconClasses} />,
    name: 'Dashboard',
  },
  {
    path: '/app/welcome',
    component: Welcome,
    icon: <DocumentIcon className={iconClasses} />,
    name: 'Welcome',
  },
  {
    path: '/app/leads',
    component: Leads,
    icon: <InboxArrowDownIcon className={iconClasses} />,
    name: 'Leads',
  },
  {
    path: '/app/charts',
    component: Charts,
    icon: <ChartBarIcon className={iconClasses} />,
    name: 'Analytics',
  },
  {
    path: '/app/explorer',
    component: Explorer,
    icon: <ChartBarIcon className={iconClasses} />,
    name: 'Explorer',
  },
  {
    path: '',
    icon: <DocumentDuplicateIcon className={`${iconClasses} inline`} />,
    name: 'Pages',
    submenu: [
   
     
      {
        path: '/forgot-password',
        component: ForgotPassword,
        icon: <KeyIcon className={submenuIconClasses} />,
        name: 'Forgot Password',
      },
    ],
  },
  {
    path: '',
    icon: <Cog6ToothIcon className={`${iconClasses} inline`} />,
    name: 'Settings',
    submenu: [

     
    ],
  },

  {
    path: null,
    component: 'Logout',
    icon: <ArrowLeftOnRectangleIcon className={iconClasses} />,
    name: 'Logout',
    onClick: logoutUser,
  },
];

export default routes;