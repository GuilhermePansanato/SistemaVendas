export type TenantModuleKey = 'DASHBOARD' | 'CUSTOMERS' | 'SALES' | 'REMINDERS';

export type TenantNavigationItem = {
  moduleKey: TenantModuleKey;
  to: string;
  label: string;
};

export const tenantNavigation: TenantNavigationItem[] = [
  { moduleKey: 'DASHBOARD', to: '/dashboard', label: 'Dashboard' },
  { moduleKey: 'CUSTOMERS', to: '/clientes', label: 'Clientes' },
  { moduleKey: 'SALES', to: '/vendas', label: 'Vendas' },
  { moduleKey: 'REMINDERS', to: '/cobrancas', label: 'Cobrancas' },
];

const tenantModuleKeySet = new Set<TenantModuleKey>(
  tenantNavigation.map((item) => item.moduleKey),
);

function normalizeModules(modules: string[] | null | undefined): Set<TenantModuleKey> {
  const normalizedModules = new Set<TenantModuleKey>();

  for (const module of modules ?? []) {
    if (tenantModuleKeySet.has(module as TenantModuleKey)) {
      normalizedModules.add(module as TenantModuleKey);
    }
  }

  return normalizedModules;
}

export function hasModuleAccess(
  modules: string[] | null | undefined,
  moduleKey: TenantModuleKey,
) {
  return normalizeModules(modules).has(moduleKey);
}

export function getAvailableNavigation(modules: string[] | null | undefined) {
  const activeModules = normalizeModules(modules);
  return tenantNavigation.filter((item) => activeModules.has(item.moduleKey));
}

export function getDefaultAppPath(modules: string[] | null | undefined) {
  return getAvailableNavigation(modules)[0]?.to ?? '/sem-modulos';
}
