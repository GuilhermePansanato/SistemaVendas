import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/use-auth';
import { getAvailableNavigation } from '../features/auth/lib/module-access';

export function AppShell() {
  const { logout, user } = useAuth();
  const navigation = getAvailableNavigation(user?.modules);

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-4">
            <div className="px-2 py-5">
              <p className="text-sm font-semibold tracking-[0.24em] text-slate-700">
                Sistema Vendas
              </p>
            </div>

            <nav className="flex flex-wrap gap-2 py-2 lg:flex-1 lg:flex-col lg:flex-nowrap">
              {navigation.length > 0 ? (
                navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      [
                        'flex items-center rounded-xl border border-transparent px-4 py-3 text-sm font-medium transition duration-200',
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <span
                        className={isActive ? 'font-semibold text-white' : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                ))
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Nenhum modulo ativo.
                </div>
              )}
            </nav>

            <button
              type="button"
              onClick={logout}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:shadow-sm"
            >
              Sair
            </button>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
