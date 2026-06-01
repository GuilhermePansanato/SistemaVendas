import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './shell';
import { PlatformShell } from './platform-shell';
import { DefaultAppRoute } from '../features/auth/components/default-app-route';
import { GuestOnlyRoute } from '../features/auth/components/guest-only-route';
import { ModuleRoute } from '../features/auth/components/module-route';
import { ProtectedRoute } from '../features/auth/components/protected-route';
import { PlatformGuestOnlyRoute } from '../features/platform-auth/components/platform-guest-only-route';
import { PlatformProtectedRoute } from '../features/platform-auth/components/platform-protected-route';
import { CustomersPage } from '../pages/customers-page';
import { DashboardPage } from '../pages/dashboard-page';
import { LoginPage } from '../pages/login-page';
import { NoModulesPage } from '../pages/no-modules-page';
import { PlatformCompaniesPage } from '../pages/platform-companies-page';
import { PlatformLoginPage } from '../pages/platform-login-page';
import { RemindersPage } from '../pages/reminders-page';
import { SalesPage } from '../pages/sales-page';

export const router = createBrowserRouter([
  {
    element: <PlatformGuestOnlyRoute />,
    children: [
      {
        path: '/master/login',
        element: <PlatformLoginPage />,
      },
    ],
  },
  {
    element: <PlatformProtectedRoute />,
    children: [
      {
        path: '/master',
        element: <PlatformShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/master/empresas" replace />,
          },
          {
            path: 'empresas',
            element: <PlatformCompaniesPage />,
          },
        ],
      },
    ],
  },
  {
    element: <GuestOnlyRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DefaultAppRoute />,
          },
          {
            path: 'sem-modulos',
            element: <NoModulesPage />,
          },
          {
            path: 'dashboard',
            element: (
              <ModuleRoute moduleKey="DASHBOARD">
                <DashboardPage />
              </ModuleRoute>
            ),
          },
          {
            path: 'clientes',
            element: (
              <ModuleRoute moduleKey="CUSTOMERS">
                <CustomersPage />
              </ModuleRoute>
            ),
          },
          {
            path: 'vendas',
            element: (
              <ModuleRoute moduleKey="SALES">
                <SalesPage />
              </ModuleRoute>
            ),
          },
          {
            path: 'parcelas',
            element: <Navigate to="/vendas" replace />,
          },
          {
            path: 'pagamentos',
            element: <Navigate to="/vendas" replace />,
          },
          {
            path: 'cobrancas',
            element: (
              <ModuleRoute moduleKey="REMINDERS">
                <RemindersPage />
              </ModuleRoute>
            ),
          },
        ],
      },
    ],
  },
]);
