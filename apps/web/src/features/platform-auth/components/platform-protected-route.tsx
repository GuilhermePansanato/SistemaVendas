import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePlatformAuth } from '../context/use-platform-auth';

export function PlatformProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isHydrating } = usePlatformAuth();

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          Carregando plataforma...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/master/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
