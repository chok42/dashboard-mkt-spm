// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import  { lazy } from 'react';
import { Navigate, createBrowserRouter } from "react-router";
import Loadable from 'src/layouts/full/shared/loadable/Loadable';




/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

// Dashboard
const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));

// utilities
const Typography = Loadable(lazy(() => import("../views/typography/Typography")));
const Table = Loadable(lazy(() => import("../views/tables/Table")));
const Form = Loadable(lazy(() => import("../views/forms/Form")));
const Alert = Loadable(lazy(() => import("../views/alerts/Alerts")));

// icons
const Solar = Loadable(lazy(() => import("../views/icons/Solar")));

// authentication
const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));

import ProtectedRoute from './ProtectedRoute';

// CRM
const CustomerContacts = Loadable(lazy(() => import('../views/crm/CustomerContacts')));
const Platforms = Loadable(lazy(() => import('../views/crm/Platforms')));
const HospitalServices = Loadable(lazy(() => import('../views/crm/HospitalServices')));
const Employees = Loadable(lazy(() => import('../views/crm/Employees')));

const Router = [
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <FullLayout />,
        children: [
          { path: '/', exact: true, element: <Dashboard/> },
          { path: '/crm/contacts', exact: true, element: <CustomerContacts/> },
          { path: '/crm/platforms', exact: true, element: <Platforms/> },
          { path: '/crm/services', exact: true, element: <HospitalServices/> },
          { path: '/crm/employees', exact: true, element: <Employees/> },
          { path: '/ui/typography', exact: true, element: <Typography/> },
          { path: '/ui/table', exact: true, element: <Table/> },
          { path: '/ui/form', exact: true, element: <Form/> },
          { path: '/ui/alert', exact: true, element: <Alert/> },
          { path: '/icons/solar', exact: true, element: <Solar /> },
          { path: '/sample-page', exact: true, element: <SamplePage /> },
          { path: '*', element: <Navigate to="/auth/404" /> },
        ],
      }
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  }
  ,
];

const router = createBrowserRouter(Router)

export default router;
