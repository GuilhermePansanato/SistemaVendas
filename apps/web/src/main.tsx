import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AuthProvider } from './features/auth/context/auth-provider';
import { PlatformAuthProvider } from './features/platform-auth/context/platform-auth-provider';
import './index.css';
import { queryClient } from './shared/lib/query-client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PlatformAuthProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </PlatformAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
