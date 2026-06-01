import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/use-auth';
import { getDefaultAppPath } from '../lib/module-access';

export function GuestOnlyRoute() {
  const { isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f8f1e8_0%,_#f1e3d0_100%)]">
        <p className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          Validando acesso...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultAppPath(user?.modules)} replace />;
  }

  return <Outlet />;
}
