// All components mapping with path for internal routes

import { lazy } from 'react'
import Rotations from '../pages/protected/Rotations'

const Dashboard = lazy(() => import('../pages/protected/Dashboard'))
const Welcome = lazy(() => import('../pages/protected/Welcome'))
const Charts = lazy(() => import('../pages/protected/Charts'))
const Leads = lazy(() => import('../pages/protected/Leads'))
const Dimensions = lazy(()=>import('../pages/protected/Dimensions'))

const routes = [
  {
    path: '/dashboard', // the url
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


]

export default routes
