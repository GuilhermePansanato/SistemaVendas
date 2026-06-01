import { hash } from 'bcrypt';
import {
  PlatformUserRole,
  PrismaClient,
  SystemModuleKey,
  UserRole,
} from '@prisma/client';

const prisma = new PrismaClient();

function slugifyCompanyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function main() {
  const name = process.env.DEFAULT_ADMIN_NAME;
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const companyName = process.env.DEFAULT_COMPANY_NAME?.trim() || 'Loja Principal';
  const platformAdminName =
    process.env.DEFAULT_PLATFORM_ADMIN_NAME?.trim() || 'Master Admin';
  const platformAdminEmail =
    process.env.DEFAULT_PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ||
    'master@sistemavendas.local';
  const platformAdminPassword =
    process.env.DEFAULT_PLATFORM_ADMIN_PASSWORD || '12345678';

  if (!name || !email || !password) {
    throw new Error(
      'Configure DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL e DEFAULT_ADMIN_PASSWORD no arquivo .env antes de executar o seed.',
    );
  }

  const companySlug = slugifyCompanyName(companyName) || 'loja-principal';
  const passwordHash = await hash(password, 10);
  const platformPasswordHash = await hash(platformAdminPassword, 10);
  const company = await prisma.company.upsert({
    where: { slug: companySlug },
    update: {
      name: companyName,
      isActive: true,
    },
    create: {
      name: companyName,
      slug: companySlug,
      isActive: true,
    },
  });

  const modulesCatalog = [
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

  await prisma.systemModule.createMany({
    data: modulesCatalog.map((module) => ({
      key: module.key,
      name: module.name,
      description: module.description,
      isActive: true,
      isTenantVisible: true,
      sortOrder: module.sortOrder,
    })),
    skipDuplicates: true,
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      companyId: company.id,
      name,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      companyId: company.id,
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.companyModuleSubscription.createMany({
    data: modulesCatalog.map((module) => ({
      companyId: company.id,
      moduleKey: module.key,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  await prisma.platformUser.upsert({
    where: {
      email: platformAdminEmail,
    },
    update: {
      name: platformAdminName,
      passwordHash: platformPasswordHash,
      role: PlatformUserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: platformAdminName,
      email: platformAdminEmail,
      passwordHash: platformPasswordHash,
      role: PlatformUserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(
    `Usuario administrador pronto para uso: ${email} (empresa: ${company.name})`,
  );
  console.log(`Usuario master pronto para uso: ${platformAdminEmail}`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
