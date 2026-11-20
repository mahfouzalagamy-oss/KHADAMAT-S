import { createBrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Application routes configuration using React Router v6.
 *
 * Routes:
 * - /           : App (root - handles role-based rendering internally)
 * - /login      : Auth login screen
 * - /customer/* : Customer dashboard (renders App with customer role)
 * - /technician/* : Technician dashboard (renders App with technician role)
 *
 * The App component internally handles role-based rendering,
 * so these routes mainly support deep linking and URL management.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <App />,
  },
  {
    path: '/customer/:tab?',
    element: <App />,
  },
  {
    path: '/technician/:tab?',
    element: <App />,
  },
]);
