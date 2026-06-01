import { SystemModuleKey } from '@prisma/client';

export interface PlatformModuleCatalogItem {
  key: SystemModuleKey;
  name: string;
  description: string | null;
  isActive: boolean;
  isTenantVisible: boolean;
  sortOrder: number;
}

export const defaultPlatformModuleCatalog: Array<{
  key: SystemModuleKey;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    key: SystemModuleKey.DASHBOARD,
    name: 'Dashboard',
    description: 'Resumo financeiro e operacional da empresa.',
    sortOrder: 10,
  },
  {
    key: SystemModuleKey.CUSTOMERS,
    name: 'Clientes',
    description: 'Cadastro e gestão de clientes.',
    sortOrder: 20,
  },
  {
    key: SystemModuleKey.SALES,
    name: 'Vendas',
    description: 'Vendas, parcelas e pagamentos.',
    sortOrder: 30,
  },
  {
    key: SystemModuleKey.REMINDERS,
    name: 'Cobrancas',
    description: 'Cobrancas, lembretes e WhatsApp.',
    sortOrder: 40,
  },
];
