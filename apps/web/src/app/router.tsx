import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './shell';
import { CustomersPage } from '../pages/customers-page';
import { DashboardPage } from '../pages/dashboard-page';
import { InstallmentsPage } from '../pages/installments-page';
import { LoginPage } from '../pages/login-page';
import { PaymentsPage } from '../pages/payments-page';
import { RemindersPage } from '../pages/reminders-page';
import { SalesPage } from '../pages/sales-page';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'clientes',
        element: <CustomersPage />,
      },
      {
        path: 'vendas',
        element: <SalesPage />,
      },
      {
        path: 'parcelas',
        element: <InstallmentsPage />,
      },
      {
        path: 'pagamentos',
        element: <PaymentsPage />,
      },
      {
        path: 'cobrancas',
        element: <RemindersPage />,
      },
    ],
  },
]);
