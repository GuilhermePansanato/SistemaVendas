import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/use-auth';
import {
  getDefaultAppPath,
  hasModuleAccess,
  type TenantModuleKey,
} from '../lib/module-access';

type ModuleRouteProps = PropsWithChildren<{
  moduleKey: TenantModuleKey;
}>;

export function ModuleRoute({ moduleKey, children }: ModuleRouteProps) {
  const location = useLocation();
  const { user } = useAuth();

  if (!hasModuleAccess(user?.modules, moduleKey)) {
    return (
      <Navigate
        to={getDefaultAppPath(user?.modules)}
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
