import { lazy } from 'react';
import Rotations from '../pages/protected/Rotations';
import Explorer from '../pages/protected/Explorer';

const Dashboard = lazy(() => import('../pages/protected/Dashboard'));
const Welcome = lazy(() => import('../pages/protected/Welcome'));
const Charts = lazy(() => import('../pages/protected/Charts'));
const Leads = lazy(() => import('../pages/protected/Leads'));
const Dimensions = lazy(() => import('../pages/protected/Dimensions'));

const routes = [
  {
    path: '/dashboard', 
    component: Dashboard, // view rendered
  },
  {
    path: '/welcome', // the url
    component: Welcome, // view rendered
  },
  {
    path: '/leads',
    component: Leads,
  },
  {
    path: '/charts',
    component: Charts,
  },
  {
    path: '/dimensions',
    component: Dimensions,
  },
  {
    path: '/rotations',
    component: Rotations,
  },
  {
    path: '/explorer', 
    component: Explorer, 
  },
];

export default routes;