import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/parcelas', label: 'Parcelas' },
  { to: '/pagamentos', label: 'Pagamentos' },
  { to: '/cobrancas', label: 'Cobrancas' },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(238,116,85,0.18),_transparent_32%),linear-gradient(180deg,_#f8f1e8_0%,_#f1e3d0_100%)] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_80px_rgba(72,52,35,0.14)] backdrop-blur">
          <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
            <p className="text-xs uppercase tracking-[0.28em] text-orange-200">
              Sistema de vendas
            </p>
            <h1 className="mt-3 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-3xl font-semibold tracking-tight">
              Clientes, parcelas e cobrancas em um painel so.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Base inicial do projeto com foco em operacao real e apresentacao
              profissional para portfolio.
            </p>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/80 text-slate-700 hover:bg-slate-900 hover:text-white',
                  ].join(' ')
                }
              >
                <span>{item.label}</span>
                <span className="text-xs uppercase tracking-[0.24em]">Go</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Proximo marco
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Conectar autenticacao, cadastro de clientes e criacao de vendas
              com geracao automatica de parcelas.
            </p>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-3rem)] flex-col rounded-[32px] border border-white/70 bg-white/70 p-5 shadow-[0_24px_80px_rgba(72,52,35,0.12)] backdrop-blur lg:p-6">
          <header className="flex flex-col gap-4 rounded-[28px] bg-slate-950 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-teal-200">
                MVP em construcao
              </p>
              <h2 className="mt-2 font-[Aptos_Display,Aptos,Segoe_UI,sans-serif] text-2xl font-semibold">
                Arquitetura limpa para um fluxo de cobranca simples e confiavel
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right text-sm lg:min-w-[320px]">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Frontend
                </p>
                <p className="mt-2 font-semibold text-orange-200">
                  React + Vite
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Backend
                </p>
                <p className="mt-2 font-semibold text-teal-200">Nest + Prisma</p>
              </div>
            </div>
          </header>

          <div className="mt-6 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
