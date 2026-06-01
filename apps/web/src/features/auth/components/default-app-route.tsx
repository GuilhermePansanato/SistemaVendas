import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/use-auth';
import { getDefaultAppPath } from '../lib/module-access';

export function DefaultAppRoute() {
  const { user } = useAuth();

  return <Navigate to={getDefaultAppPath(user?.modules)} replace />;
}
