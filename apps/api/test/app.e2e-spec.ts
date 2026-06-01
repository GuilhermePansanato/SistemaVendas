import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';

jest.setTimeout(20000);

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let adminCompanyId = '';

  const adminEmail = 'auth.e2e@sistemavendas.local';
  const adminPassword = '12345678';
  const adminCompanyName = 'Auth E2E Company';
  const adminCompanySlug = 'auth-e2e-company';
  const platformAdminEmail = 'platform.e2e@sistemavendas.local';
  const platformAdminPassword = '12345678';
  const platformAdminName = 'Platform E2E Admin';
  const defaultModuleCatalog = [
    {
      key: 'DASHBOARD',
      name: 'Dashboard',
      description: 'Resumo financeiro e operacional da empresa.',
      sortOrder: 10,
    },
    {
      key: 'CUSTOMERS',
      name: 'Clientes',
      description: 'Cadastro e gestao de clientes.',
      sortOrder: 20,
    },
    {
      key: 'SALES',
      name: 'Vendas',
      description: 'Vendas, parcelas e pagamentos.',
      sortOrder: 30,
    },
    {
      key: 'REMINDERS',
      name: 'Cobrancas',
      description: 'Cobrancas, lembretes e WhatsApp.',
      sortOrder: 40,
    },
  ] as const;

  interface AuthResponseBody {
    accessToken: string;
    user: {
      id: string;
      companyId: string;
      companyName: string;
      modules: string[];
      name: string;
      email: string;
      role: string;
    };
  }

  interface PlatformAuthResponseBody {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }

  interface PlatformModuleResponseBody {
    key: string;
    name: string;
    description: string | null;
    isActive: boolean;
    isTenantVisible: boolean;
    sortOrder: number;
  }

  interface PlatformCompanyResponseBody {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    modules: string[];
    adminUsers: Array<{
      id: string;
      name: string;
      email: string;
      isActive: boolean;
    }>;
  }

  interface ApiStatusResponseBody {
    name: string;
    version: string;
    status: string;
    timestamp: string;
  }

  interface CustomerResponseBody {
    id: string;
    companyId: string;
    name: string;
    document: string | null;
    phone: string;
    whatsappPhone: string;
    email: string | null;
    notes: string | null;
    isActive: boolean;
  }

  interface SaleInstallmentResponseBody {
    id: string;
    number: number;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    paidAt: string | null;
    status: string;
  }

  interface SaleResponseBody {
    id: string;
    customerId: string;
    description: string | null;
    totalAmount: number;
    installmentCount: number;
    saleDate: string;
    status: string;
    notes?: string | null;
    customer: {
      id: string;
      name: string;
      whatsappPhone: string;
    };
    financial: {
      paidAmount: number;
      remainingAmount: number;
    };
    counts: {
      pending: number;
      partiallyPaid: number;
      paid: number;
      overdue: number;
    };
    nextDueDate: string | null;
    installments?: SaleInstallmentResponseBody[];
  }

  interface InstallmentResponseBody {
    id: string;
    saleId: string;
    customerId: string;
    number: number;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: string;
    paidAt: string | null;
    status: string;
    customer: {
      id: string;
      name: string;
      whatsappPhone: string;
    };
    sale: {
      id: string;
      description: string | null;
      saleDate: string;
      totalAmount: number;
      installmentCount: number;
      status: string;
    };
    saleNotes: string | null;
  }

  interface PaymentResponseBody {
    id: string;
    installmentId: string;
    saleId: string;
    customerId: string;
    amount: number;
    paidAt: string;
    method: string;
    reference: string | null;
    notes: string | null;
    customer: {
      id: string;
      name: string;
      whatsappPhone: string;
    };
    sale: {
      id: string;
      description: string | null;
      saleDate: string;
      status: string;
    };
    installment: {
      id: string;
      number: number;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      dueDate: string;
      paidAt: string | null;
      status: string;
    };
  }

  interface DashboardInstallmentPreviewBody {
    installmentId: string;
    saleId: string;
    customerId: string;
    customerName: string;
    whatsappPhone: string;
    saleDescription: string | null;
    installmentNumber: number;
    dueDate: string;
    remainingAmount: number;
    status: string;
  }

  interface DashboardPaymentPreviewBody {
    paymentId: string;
    installmentId: string;
    saleId: string;
    customerId: string;
    customerName: string;
    saleDescription: string | null;
    amount: number;
    paidAt: string;
    method: string;
  }

  interface DashboardSummaryResponseBody {
    generatedAt: string;
    upcomingWindowDays: number;
    totals: {
      openAmount: number;
      overdueAmount: number;
      receivedInRange: number;
      receivedThisMonth: number;
      receivedToday: number;
      salesInRange: number;
      totalCustomers: number;
      activeCustomers: number;
      openInstallments: number;
      overdueInstallments: number;
      paidInstallments: number;
    };
    saleStatusBreakdown: {
      open: number;
      partiallyPaid: number;
      paid: number;
      overdue: number;
    };
    upcomingInstallments: DashboardInstallmentPreviewBody[];
    overdueInstallments: DashboardInstallmentPreviewBody[];
    recentPayments: DashboardPaymentPreviewBody[];
  }

  function toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  function getMonthRange(date: Date) {
    return {
      from: toDateInput(new Date(date.getFullYear(), date.getMonth(), 1)),
      to: toDateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
    };
  }

  interface WhatsAppConnectionResponseBody {
    id: string;
    clientKey: string;
    provider: string;
    status: string;
    displayName: string | null;
    phoneNumber: string | null;
    qrCode: string | null;
    sessionPath: string | null;
    lastConnectedAt: string | null;
    lastDisconnectedAt: string | null;
    lastQrGeneratedAt: string | null;
    lastError: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface ReminderSummaryResponseBody {
    pending: number;
    sent: number;
    failed: number;
    blockedByConnection: number;
  }

  interface ReminderSettingsResponseBody {
    defaultSendTime: string;
  }

  interface ReminderListItemResponseBody {
    id: string;
    customerName: string;
    customerWhatsappPhone: string;
    saleDescription: string | null;
    installmentNumber: number;
    dueDate: string;
    triggerType: string;
    messageBody: string;
    status: string;
    failureReason: string | null;
    errorMessage: string | null;
    sentAt: string | null;
    attemptedAt: string | null;
    createdAt: string;
  }

  interface ProcessRemindersResponseBody {
    referenceDate: string;
    created: number;
    sent: number;
    failed: number;
    skipped: number;
  }

  function buildWhatsAppClientKey(companyId: string) {
    return companyId === 'default-company' ? 'default' : `company-${companyId}`;
  }

  async function loginAs(email: string, password: string) {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    return loginResponse.body as AuthResponseBody;
  }

  async function loginAsPlatform(email: string, password: string) {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/platform/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    return loginResponse.body as PlatformAuthResponseBody;
  }

  async function getAccessToken() {
    const body = await loginAs(adminEmail, adminPassword);
    return body.accessToken;
  }

  async function getPlatformAccessToken() {
    const body = await loginAsPlatform(
      platformAdminEmail,
      platformAdminPassword,
    );
    return body.accessToken;
  }

  async function ensureSystemModuleCatalog() {
    for (const module of defaultModuleCatalog) {
      await prismaService.systemModule.upsert({
        where: {
          key: module.key,
        },
        update: {
          name: module.name,
          description: module.description,
          isActive: true,
          isTenantVisible: true,
          sortOrder: module.sortOrder,
        },
        create: {
          key: module.key,
          name: module.name,
          description: module.description,
          isActive: true,
          isTenantVisible: true,
          sortOrder: module.sortOrder,
        },
      });
    }
  }

  async function ensureCompanyModuleSubscriptions(
    companyId: string,
    moduleKeys = defaultModuleCatalog.map((module) => module.key),
  ) {
    await prismaService.companyModuleSubscription.deleteMany({
      where: {
        companyId,
      },
    });

    await prismaService.companyModuleSubscription.createMany({
      data: moduleKeys.map((moduleKey) => ({
        companyId,
        moduleKey,
        isActive: true,
      })),
    });
  }

  async function clearE2EData() {
    if (adminCompanyId) {
      await prismaService.whatsAppConnectionEvent.deleteMany({
        where: {
          companyId: adminCompanyId,
        },
      });

      await prismaService.whatsAppConnection.deleteMany({
        where: {
          companyId: adminCompanyId,
        },
      });

      await prismaService.reminderMessage.deleteMany({
        where: {
          companyId: adminCompanyId,
        },
      });

      await prismaService.reminderRule.deleteMany({
        where: {
          companyId: adminCompanyId,
        },
      });

      await prismaService.reminderSettings.deleteMany({
        where: {
          companyId: adminCompanyId,
        },
      });
    }

    const tenantCompanies = await prismaService.company.findMany({
      where: {
        slug: {
          contains: 'tenant-e2e-',
        },
      },
      select: {
        id: true,
      },
    });
    const tenantCompanyIds = tenantCompanies.map((company) => company.id);
    const platformCompanies = await prismaService.company.findMany({
      where: {
        slug: {
          contains: 'platform-e2e-',
        },
      },
      select: {
        id: true,
      },
    });
    const platformCompanyIds = platformCompanies.map((company) => company.id);
    const isolatedCompanyIds = [...tenantCompanyIds, ...platformCompanyIds];

    if (isolatedCompanyIds.length > 0) {
      await prismaService.whatsAppConnectionEvent.deleteMany({
        where: {
          companyId: {
            in: isolatedCompanyIds,
          },
        },
      });

      await prismaService.whatsAppConnection.deleteMany({
        where: {
          companyId: {
            in: isolatedCompanyIds,
          },
        },
      });

      await prismaService.reminderMessage.deleteMany({
        where: {
          companyId: {
            in: isolatedCompanyIds,
          },
        },
      });

      await prismaService.reminderRule.deleteMany({
        where: {
          companyId: {
            in: isolatedCompanyIds,
          },
        },
      });

      await prismaService.reminderSettings.deleteMany({
        where: {
          companyId: {
            in: isolatedCompanyIds,
          },
        },
      });
    }

    await prismaService.user.deleteMany({
      where: {
        OR: [
          {
            email: {
              contains: '@tenant.e2e.local',
            },
          },
          {
            email: {
              contains: '@platform-company.e2e.local',
            },
          },
          {
            companyId: {
              in: isolatedCompanyIds,
            },
          },
        ],
      },
    });

    await prismaService.reminderMessage.deleteMany({
      where: {
        customer: {
          email: {
            contains: '@customers.e2e.local',
          },
        },
      },
    });

    await prismaService.payment.deleteMany({
      where: {
        installment: {
          sale: {
            customer: {
              email: {
                contains: '@customers.e2e.local',
              },
            },
          },
        },
      },
    });

    await prismaService.installment.deleteMany({
      where: {
        sale: {
          customer: {
            email: {
              contains: '@customers.e2e.local',
            },
          },
        },
      },
    });

    await prismaService.sale.deleteMany({
      where: {
        customer: {
          email: {
            contains: '@customers.e2e.local',
          },
        },
      },
    });

    await prismaService.customer.deleteMany({
      where: {
        email: {
          contains: '@customers.e2e.local',
        },
      },
    });

    await prismaService.company.deleteMany({
      where: {
        id: {
          in: isolatedCompanyIds,
        },
      },
    });

    if (adminCompanyId) {
      await ensureSystemModuleCatalog();
      await ensureCompanyModuleSubscriptions(adminCompanyId);

      await prismaService.reminderSettings.upsert({
        where: { companyId: adminCompanyId },
        update: {
          defaultSendTime: '09:00',
          lastAutomatedRunAt: null,
        },
        create: {
          companyId: adminCompanyId,
          defaultSendTime: '09:00',
          lastAutomatedRunAt: null,
        },
      });
    }
  }

  async function createTenantUserFixture(
    moduleKeys = defaultModuleCatalog.map((module) => module.key),
  ) {
    const suffix = Date.now().toString();
    const company = await prismaService.company.create({
      data: {
        name: `Tenant E2E ${suffix}`,
        slug: `tenant-e2e-${suffix}`,
        isActive: true,
      },
    });
    await ensureCompanyModuleSubscriptions(company.id, moduleKeys);
    const email = `tenant.${suffix}@tenant.e2e.local`;
    const password = '12345678';

    await prismaService.user.create({
      data: {
        companyId: company.id,
        name: `Tenant User ${suffix}`,
        email,
        passwordHash: await hash(password, 10),
        isActive: true,
      },
    });

    return {
      company,
      email,
      password,
    };
  }

  async function createCustomerFixture(
    accessToken: string,
    overrides?: Partial<{
      name: string;
      phone: string;
      whatsappPhone: string;
      document: string;
      email: string;
      notes: string;
    }>,
  ) {
    const response = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: overrides?.name ?? 'Cliente venda e2e',
        phone: overrides?.phone ?? '(11) 96666-5555',
        whatsappPhone: overrides?.whatsappPhone ?? '(11) 96666-5555',
        document: overrides?.document ?? '12312312300',
        email: overrides?.email ?? `sales.${Date.now()}@customers.e2e.local`,
        notes: overrides?.notes ?? 'Cliente criado para o fluxo de vendas.',
      })
      .expect(201);

    return response.body as CustomerResponseBody;
  }

  async function createSaleFixture(
    accessToken: string,
    customerId: string,
    overrides?: Partial<{
      description: string;
      totalAmount: number;
      saleDate: string;
      notes: string;
      installments: Array<{ dueDate: string }>;
      payment: {
        method: string;
        reference?: string;
        notes?: string;
      };
    }>,
  ) {
    const response = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customerId,
        description: overrides?.description ?? 'Venda e2e parcelada',
        totalAmount: overrides?.totalAmount ?? 1000,
        saleDate: overrides?.saleDate ?? '2030-01-05',
        notes: overrides?.notes ?? 'Fluxo de venda criado pelo teste e2e.',
        installments: overrides?.installments ?? [
          { dueDate: '2030-02-10' },
          { dueDate: '2030-03-10' },
          { dueDate: '2030-04-10' },
        ],
        ...(overrides?.payment ? { payment: overrides.payment } : {}),
      })
      .expect(201);

    return response.body as SaleResponseBody;
  }

  async function registerPaymentFixture(
    accessToken: string,
    installmentId: string,
    overrides?: Partial<{
      amount: number;
      paidAt: string;
      method: string;
      reference: string;
      notes: string;
    }>,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/api/installments/${installmentId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: overrides?.amount ?? 100,
        paidAt: overrides?.paidAt ?? '2026-02-05',
        method: overrides?.method ?? 'PIX',
        reference: overrides?.reference ?? 'PAG-E2E-001',
        notes: overrides?.notes ?? 'Pagamento registrado via teste e2e.',
      })
      .expect(201);

    return response.body as PaymentResponseBody;
  }

  async function reopenInstallmentFixture(
    accessToken: string,
    installmentId: string,
    password: string,
  ) {
    await request(app.getHttpServer())
      .post(`/api/installments/${installmentId}/reopen`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password })
      .expect(200);
  }

  async function ensureWhatsAppConnectionStatus(
    companyId: string,
    status: 'DISCONNECTED',
  ) {
    await prismaService.whatsAppConnection.upsert({
      where: { companyId },
      update: {
        status,
        displayName: null,
        phoneNumber: null,
        qrCode: null,
        sessionPath: null,
        lastConnectedAt: null,
        lastDisconnectedAt: new Date(),
        lastQrGeneratedAt: null,
        lastError: null,
      },
      create: {
        companyId,
        clientKey: buildWhatsAppClientKey(companyId),
        provider: 'WHATSAPP_WEB_JS',
        status,
        lastDisconnectedAt: new Date(),
      },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prismaService = app.get(PrismaService);
    await ensureSystemModuleCatalog();

    const adminCompany = await prismaService.company.upsert({
      where: { slug: adminCompanySlug },
      update: {
        name: adminCompanyName,
        isActive: true,
      },
      create: {
        name: adminCompanyName,
        slug: adminCompanySlug,
        isActive: true,
      },
    });

    await ensureCompanyModuleSubscriptions(adminCompany.id);

    await prismaService.user.upsert({
      where: { email: adminEmail },
      update: {
        companyId: adminCompany.id,
        name: 'Auth E2E Admin',
        passwordHash: await hash(adminPassword, 10),
        isActive: true,
      },
      create: {
        companyId: adminCompany.id,
        name: 'Auth E2E Admin',
        email: adminEmail,
        passwordHash: await hash(adminPassword, 10),
        isActive: true,
      },
    });

    await prismaService.platformUser.upsert({
      where: { email: platformAdminEmail },
      update: {
        name: platformAdminName,
        passwordHash: await hash(platformAdminPassword, 10),
        isActive: true,
      },
      create: {
        name: platformAdminName,
        email: platformAdminEmail,
        passwordHash: await hash(platformAdminPassword, 10),
        isActive: true,
      },
    });

    adminCompanyId = adminCompany.id;

    await clearE2EData();
  });

  it('GET /api returns API status', async () => {
    const response = await request(app.getHttpServer()).get('/api').expect(200);
    const body = response.body as ApiStatusResponseBody;

    expect(body.status).toBe('ok');
    expect(body.name).toBe('Sistema Vendas API');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
  });

  it('POST /api/auth/login authenticates an active user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: adminPassword,
      })
      .expect(201);
    const body = response.body as AuthResponseBody;

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user.companyId).toEqual(expect.any(String));
    expect(body.user.companyName).toBe(adminCompanyName);
    expect(body.user.modules).toEqual([
      'DASHBOARD',
      'CUSTOMERS',
      'SALES',
      'REMINDERS',
    ]);
    expect(body.user.email).toBe(adminEmail);
    expect(body.user.name).toBe('Auth E2E Admin');
    expect(body.user.role).toBe('ADMIN');
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: 'wrong-pass',
      })
      .expect(401);
  });

  it('GET /api/auth/me returns the authenticated profile', async () => {
    const accessToken = await getAccessToken();

    const profileResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = profileResponse.body as AuthResponseBody['user'];

    expect(body.companyId).toEqual(expect.any(String));
    expect(body.companyName).toBe(adminCompanyName);
    expect(body.modules).toEqual([
      'DASHBOARD',
      'CUSTOMERS',
      'SALES',
      'REMINDERS',
    ]);
    expect(body.email).toBe(adminEmail);
    expect(body.name).toBe('Auth E2E Admin');
    expect(body.role).toBe('ADMIN');
  });

  it('POST /api/platform/auth/login authenticates an active master user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/platform/auth/login')
      .send({
        email: platformAdminEmail,
        password: platformAdminPassword,
      })
      .expect(201);
    const body = response.body as PlatformAuthResponseBody;

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user.email).toBe(platformAdminEmail);
    expect(body.user.name).toBe(platformAdminName);
    expect(body.user.role).toBe('SUPER_ADMIN');
  });

  it('GET /api/platform/auth/me returns the authenticated master profile', async () => {
    const accessToken = await getPlatformAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/platform/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as PlatformAuthResponseBody['user'];

    expect(body.email).toBe(platformAdminEmail);
    expect(body.name).toBe(platformAdminName);
    expect(body.role).toBe('SUPER_ADMIN');
  });

  it('GET /api/platform/modules lists the contractable tenant modules', async () => {
    const accessToken = await getPlatformAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/platform/modules')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as PlatformModuleResponseBody[];

    expect(body).toHaveLength(4);
    expect(body.map((module) => module.key)).toEqual([
      'DASHBOARD',
      'CUSTOMERS',
      'SALES',
      'REMINDERS',
    ]);
    expect(body.every((module) => module.isActive)).toBe(true);
    expect(body.every((module) => module.isTenantVisible)).toBe(true);
  });

  it('POST /api/platform/companies creates a company with admin login and module subscriptions', async () => {
    const accessToken = await getPlatformAccessToken();
    const suffix = Date.now().toString();
    const companyName = `Platform Tenant ${suffix}`;
    const adminName = `Platform Tenant Admin ${suffix}`;
    const adminEmailForCompany = `tenant.${suffix}@platform-company.e2e.local`;

    const response = await request(app.getHttpServer())
      .post('/api/platform/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: companyName,
        slug: `platform-e2e-${suffix}`,
        adminName,
        adminEmail: adminEmailForCompany,
        adminPassword: '12345678',
        moduleKeys: ['CUSTOMERS', 'SALES'],
      })
      .expect(201);
    const body = response.body as PlatformCompanyResponseBody;

    expect(body.name).toBe(companyName);
    expect(body.slug).toBe(`platform-e2e-${suffix}`);
    expect(body.modules).toEqual(['CUSTOMERS', 'SALES']);
    expect(body.adminUsers).toHaveLength(1);
    expect(body.adminUsers[0].email).toBe(adminEmailForCompany);

    const companiesResponse = await request(app.getHttpServer())
      .get('/api/platform/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const companiesBody =
      companiesResponse.body as PlatformCompanyResponseBody[];

    expect(
      companiesBody.some(
        (company) =>
          company.slug === `platform-e2e-${suffix}` &&
          company.modules.join(',') === 'CUSTOMERS,SALES',
      ),
    ).toBe(true);

    const tenantLogin = await loginAs(adminEmailForCompany, '12345678');

    expect(tenantLogin.user.companyName).toBe(companyName);
    expect(tenantLogin.user.modules).toEqual(['CUSTOMERS', 'SALES']);
  });

  it('PATCH /api/platform/companies/:id/modules updates the contracted modules', async () => {
    const accessToken = await getPlatformAccessToken();
    const suffix = `${Date.now()}-modules`;
    const adminEmailForCompany = `tenant.${suffix}@platform-company.e2e.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/platform/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Platform Modules ${suffix}`,
        slug: `platform-e2e-${suffix}`,
        adminName: `Platform Modules Admin ${suffix}`,
        adminEmail: adminEmailForCompany,
        adminPassword: '12345678',
        moduleKeys: ['CUSTOMERS'],
      })
      .expect(201);
    const createdCompany = createResponse.body as PlatformCompanyResponseBody;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/platform/companies/${createdCompany.id}/modules`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        moduleKeys: ['DASHBOARD', 'REMINDERS'],
      })
      .expect(200);
    const updatedCompany = updateResponse.body as PlatformCompanyResponseBody;

    expect(updatedCompany.modules).toEqual(['DASHBOARD', 'REMINDERS']);

    const tenantLogin = await loginAs(adminEmailForCompany, '12345678');

    expect(tenantLogin.user.modules).toEqual(['DASHBOARD', 'REMINDERS']);

    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${tenantLogin.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${tenantLogin.accessToken}`)
      .expect(200);
  });

  it('PATCH /api/platform/companies/:id/status toggles company access for tenant login and profile', async () => {
    const accessToken = await getPlatformAccessToken();
    const suffix = `${Date.now()}-status`;
    const adminEmailForCompany = `tenant.${suffix}@platform-company.e2e.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/platform/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Platform Status ${suffix}`,
        slug: `platform-e2e-${suffix}`,
        adminName: `Platform Status Admin ${suffix}`,
        adminEmail: adminEmailForCompany,
        adminPassword: '12345678',
        moduleKeys: ['CUSTOMERS'],
      })
      .expect(201);
    const createdCompany = createResponse.body as PlatformCompanyResponseBody;

    const tenantLoginBeforeDeactivate = await loginAs(
      adminEmailForCompany,
      '12345678',
    );

    const deactivateResponse = await request(app.getHttpServer())
      .patch(`/api/platform/companies/${createdCompany.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: false,
      })
      .expect(200);
    const deactivatedCompany =
      deactivateResponse.body as PlatformCompanyResponseBody;

    expect(deactivatedCompany.isActive).toBe(false);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmailForCompany,
        password: '12345678',
      })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tenantLoginBeforeDeactivate.accessToken}`)
      .expect(401);

    const reactivateResponse = await request(app.getHttpServer())
      .patch(`/api/platform/companies/${createdCompany.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        isActive: true,
      })
      .expect(200);
    const reactivatedCompany =
      reactivateResponse.body as PlatformCompanyResponseBody;

    expect(reactivatedCompany.isActive).toBe(true);

    const tenantLoginAfterReactivate = await loginAs(
      adminEmailForCompany,
      '12345678',
    );

    expect(tenantLoginAfterReactivate.user.companyName).toBe(
      `Platform Status ${suffix}`,
    );
  });

  it('PATCH /api/platform/companies/:id/users/:userId/password resets the company admin password', async () => {
    const accessToken = await getPlatformAccessToken();
    const suffix = `${Date.now()}-password`;
    const adminEmailForCompany = `tenant.${suffix}@platform-company.e2e.local`;

    const createResponse = await request(app.getHttpServer())
      .post('/api/platform/companies')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Platform Password ${suffix}`,
        slug: `platform-e2e-${suffix}`,
        adminName: `Platform Password Admin ${suffix}`,
        adminEmail: adminEmailForCompany,
        adminPassword: '12345678',
        moduleKeys: ['CUSTOMERS'],
      })
      .expect(201);
    const createdCompany = createResponse.body as PlatformCompanyResponseBody;
    const adminUser = createdCompany.adminUsers[0];

    expect(adminUser).toBeDefined();

    await request(app.getHttpServer())
      .patch(
        `/api/platform/companies/${createdCompany.id}/users/${adminUser.id}/password`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        newPassword: '87654321',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmailForCompany,
        password: '12345678',
      })
      .expect(401);

    const tenantLogin = await loginAs(adminEmailForCompany, '87654321');

    expect(tenantLogin.user.companyName).toBe(`Platform Password ${suffix}`);
  });

  it('tenant APIs only allow access to contracted modules', async () => {
    await clearE2EData();

    const limitedTenant = await createTenantUserFixture(['CUSTOMERS']);
    const tenantLogin = await loginAs(
      limitedTenant.email,
      limitedTenant.password,
    );
    const tenantAccessToken = tenantLogin.accessToken;

    expect(tenantLogin.user.modules).toEqual(['CUSTOMERS']);

    await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/sales')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/installments')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/reminders')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/whatsapp/connection')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(403);
  });

  it('GET /api/whatsapp/connection returns the current connection status', async () => {
    const accessToken = await getAccessToken();

    await ensureWhatsAppConnectionStatus(adminCompanyId, 'DISCONNECTED');

    const response = await request(app.getHttpServer())
      .get('/api/whatsapp/connection')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as WhatsAppConnectionResponseBody;

    expect(body.clientKey).toBe(buildWhatsAppClientKey(adminCompanyId));
    expect(body.provider).toBe('WHATSAPP_WEB_JS');
    expect(body.status).toBe('DISCONNECTED');
    expect(body.lastConnectedAt).toBeNull();
  });

  it('POST /api/whatsapp/test-message rejects the test when the WhatsApp session is disconnected', async () => {
    const accessToken = await getAccessToken();

    await ensureWhatsAppConnectionStatus(adminCompanyId, 'DISCONNECTED');

    await request(app.getHttpServer())
      .post('/api/whatsapp/test-message')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        phoneNumber: '5511999998888',
        message: 'Teste de sessao indisponivel',
      })
      .expect(400);
  });

  it('GET /api/reminders/settings returns the default reminder send time', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/reminders/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as ReminderSettingsResponseBody;

    expect(body.defaultSendTime).toBe('09:00');
  });

  it('PATCH /api/reminders/settings updates the default reminder send time', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app.getHttpServer())
      .patch('/api/reminders/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        defaultSendTime: '14:30',
      })
      .expect(200);
    const body = response.body as ReminderSettingsResponseBody;

    expect(body.defaultSendTime).toBe('14:30');

    const persistedResponse = await request(app.getHttpServer())
      .get('/api/reminders/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const persistedBody =
      persistedResponse.body as ReminderSettingsResponseBody;

    expect(persistedBody.defaultSendTime).toBe('14:30');

    await request(app.getHttpServer())
      .patch('/api/reminders/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        defaultSendTime: '09:00',
      })
      .expect(200);
  });

  it('reminder settings and WhatsApp connection are isolated by company', async () => {
    const primaryAccessToken = await getAccessToken();
    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    await request(app.getHttpServer())
      .patch('/api/reminders/settings')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({
        defaultSendTime: '08:15',
      })
      .expect(200);

    const tenantInitialSettingsResponse = await request(app.getHttpServer())
      .get('/api/reminders/settings')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantInitialSettingsBody =
      tenantInitialSettingsResponse.body as ReminderSettingsResponseBody;

    expect(tenantInitialSettingsBody.defaultSendTime).toBe('09:00');

    const tenantUpdatedSettingsResponse = await request(app.getHttpServer())
      .patch('/api/reminders/settings')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .send({
        defaultSendTime: '16:45',
      })
      .expect(200);
    const tenantUpdatedSettingsBody =
      tenantUpdatedSettingsResponse.body as ReminderSettingsResponseBody;

    expect(tenantUpdatedSettingsBody.defaultSendTime).toBe('16:45');

    const primaryPersistedSettingsResponse = await request(app.getHttpServer())
      .get('/api/reminders/settings')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryPersistedSettingsBody =
      primaryPersistedSettingsResponse.body as ReminderSettingsResponseBody;

    expect(primaryPersistedSettingsBody.defaultSendTime).toBe('08:15');

    const primaryConnectionResponse = await request(app.getHttpServer())
      .get('/api/whatsapp/connection')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryConnectionBody =
      primaryConnectionResponse.body as WhatsAppConnectionResponseBody;

    const tenantConnectionResponse = await request(app.getHttpServer())
      .get('/api/whatsapp/connection')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantConnectionBody =
      tenantConnectionResponse.body as WhatsAppConnectionResponseBody;

    expect(primaryConnectionBody.id).not.toBe(tenantConnectionBody.id);
    expect(primaryConnectionBody.clientKey).toBe(
      buildWhatsAppClientKey(adminCompanyId),
    );
    expect(tenantConnectionBody.clientKey).toBe(
      buildWhatsAppClientKey(isolatedTenant.company.id),
    );

    await request(app.getHttpServer())
      .patch('/api/reminders/settings')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({
        defaultSendTime: '09:00',
      })
      .expect(200);
  });

  it('GET /api/customers requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/customers').expect(401);
  });

  it('POST /api/customers creates a customer', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Maria das Parcelas',
        phone: '(11) 99999-1111',
        whatsappPhone: '(11) 99999-1111',
        document: '12345678900',
        email: 'Maria.Cliente@customers.e2e.local',
        notes: 'Cliente criada no fluxo e2e.',
      })
      .expect(201);
    const body = response.body as CustomerResponseBody;

    expect(body.id).toEqual(expect.any(String));
    expect(body.companyId).toEqual(expect.any(String));
    expect(body.name).toBe('Maria das Parcelas');
    expect(body.email).toBe('maria.cliente@customers.e2e.local');
    expect(body.isActive).toBe(true);
  });

  it('GET /api/customers lists created customers', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as CustomerResponseBody[];

    expect(Array.isArray(body)).toBe(true);
    expect(
      body.some(
        (customer) => customer.email === 'maria.cliente@customers.e2e.local',
      ),
    ).toBe(true);
  });

  it('PATCH /api/customers/:id updates the customer', async () => {
    const accessToken = await getAccessToken();

    const createdCustomer = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Cliente para editar',
        phone: '(11) 98888-7777',
        whatsappPhone: '(11) 98888-7777',
        email: 'editar@customers.e2e.local',
        notes: '',
      })
      .expect(201);
    const createdBody = createdCustomer.body as CustomerResponseBody;

    const response = await request(app.getHttpServer())
      .patch(`/api/customers/${createdBody.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        notes: 'Atualizado pelo teste e2e.',
        isActive: false,
      })
      .expect(200);
    const body = response.body as CustomerResponseBody;

    expect(body.notes).toBe('Atualizado pelo teste e2e.');
    expect(body.isActive).toBe(false);
  });

  it('GET /api/customers/:id returns the customer detail', async () => {
    const accessToken = await getAccessToken();

    const createdCustomer = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Cliente detalhe',
        phone: '(11) 97777-6666',
        whatsappPhone: '(11) 97777-6666',
        email: 'detalhe@customers.e2e.local',
      })
      .expect(201);
    const createdBody = createdCustomer.body as CustomerResponseBody;

    const response = await request(app.getHttpServer())
      .get(`/api/customers/${createdBody.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as CustomerResponseBody;

    expect(body.id).toBe(createdBody.id);
    expect(body.companyId).toBe(createdBody.companyId);
    expect(body.email).toBe('detalhe@customers.e2e.local');
  });

  it('GET /api/customers and GET /api/customers/:id only expose customers from the authenticated company', async () => {
    const primaryAccessToken = await getAccessToken();
    const isolatedTenant = await createTenantUserFixture();

    const tenantLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: isolatedTenant.email,
        password: isolatedTenant.password,
      })
      .expect(201);
    const tenantAccessToken = (tenantLoginResponse.body as AuthResponseBody)
      .accessToken;

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente isolado por empresa',
      email: `isolated.${Date.now()}@customers.e2e.local`,
    });

    const primaryListResponse = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryListBody = primaryListResponse.body as CustomerResponseBody[];

    expect(
      primaryListBody.some((customer) => customer.id === tenantCustomer.id),
    ).toBe(false);

    await request(app.getHttpServer())
      .get(`/api/customers/${tenantCustomer.id}`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(404);

    const tenantDetailResponse = await request(app.getHttpServer())
      .get(`/api/customers/${tenantCustomer.id}`)
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantDetailBody = tenantDetailResponse.body as CustomerResponseBody;

    expect(tenantDetailBody.id).toBe(tenantCustomer.id);
    expect(tenantDetailBody.companyId).toBe(tenantCustomer.companyId);
  });

  it('POST /api/sales creates a sale and generates installments', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken);

    const body = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda parcelada principal',
      totalAmount: 1000,
    });

    expect(body.id).toEqual(expect.any(String));
    expect(body.customerId).toBe(customer.id);
    expect(body.status).toBe('OPEN');
    expect(body.installmentCount).toBe(3);
    expect(body.customer.name).toBe(customer.name);
    expect(body.financial.paidAmount).toBe(0);
    expect(body.financial.remainingAmount).toBe(1000);
    expect(body.installments).toHaveLength(3);
    expect(body.installments?.map((installment) => installment.amount)).toEqual(
      [333.34, 333.33, 333.33],
    );
  });

  it('GET /api/sales and GET /api/sales/:id only expose sales from the authenticated company', async () => {
    const primaryAccessToken = await getAccessToken();
    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente da venda isolada',
      email: `isolated.sale.${Date.now()}@customers.e2e.local`,
    });
    const tenantSale = await createSaleFixture(
      tenantAccessToken,
      tenantCustomer.id,
      {
        description: 'Venda isolada por empresa',
        totalAmount: 780,
        saleDate: '2030-03-05',
        installments: [{ dueDate: '2030-04-05' }, { dueDate: '2030-05-05' }],
      },
    );

    const primaryListResponse = await request(app.getHttpServer())
      .get('/api/sales?search=Venda%20isolada%20por%20empresa')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryListBody = primaryListResponse.body as SaleResponseBody[];

    expect(primaryListBody.some((sale) => sale.id === tenantSale.id)).toBe(
      false,
    );

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({
        customerId: tenantCustomer.id,
        description: 'Tentativa de venda cruzada',
        totalAmount: 250,
        saleDate: '2030-03-05',
        installments: [{ dueDate: '2030-04-05' }],
      })
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/sales/${tenantSale.id}`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(404);

    const tenantDetailResponse = await request(app.getHttpServer())
      .get(`/api/sales/${tenantSale.id}`)
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantDetailBody = tenantDetailResponse.body as SaleResponseBody;

    expect(tenantDetailBody.id).toBe(tenantSale.id);
    expect(tenantDetailBody.customerId).toBe(tenantCustomer.id);
  });

  it('POST /api/sales preserves sale and installment dates sent as YYYY-MM-DD', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `sales.dates.${Date.now()}@customers.e2e.local`,
    });

    const body = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda com data preservada',
      totalAmount: 250,
      saleDate: '2026-05-27',
      installments: [{ dueDate: '2026-05-27' }],
    });

    expect(body.saleDate.slice(0, 10)).toBe('2026-05-27');
    expect(body.installments?.[0]?.dueDate.slice(0, 10)).toBe('2026-05-27');
  });

  it('POST /api/sales validates installment dates in ascending order', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `invalid.sale.${Date.now()}@customers.e2e.local`,
    });

    await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customerId: customer.id,
        description: 'Venda invalida',
        totalAmount: 900,
        saleDate: '2030-05-10',
        installments: [{ dueDate: '2030-07-10' }, { dueDate: '2030-06-10' }],
      })
      .expect(400);
  });

  it('POST /api/sales creates an immediate payment sale for cash flow tracking', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `cash.sale.${Date.now()}@customers.e2e.local`,
    });

    const body = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda a vista e2e',
      totalAmount: 320,
      saleDate: '2026-05-05',
      installments: [{ dueDate: '2026-05-05' }],
      payment: {
        method: 'PIX',
        reference: 'PIX-VISTA-320',
      },
    });

    expect(body.status).toBe('PAID');
    expect(body.installmentCount).toBe(1);
    expect(body.financial.paidAmount).toBe(320);
    expect(body.financial.remainingAmount).toBe(0);
    expect(body.installments).toHaveLength(1);
    expect(body.installments?.[0]?.status).toBe('PAID');
    expect(body.installments?.[0]?.paidAmount).toBe(320);

    const paymentsResponse = await request(app.getHttpServer())
      .get(`/api/payments?installmentId=${body.installments?.[0]?.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const paymentsBody = paymentsResponse.body as PaymentResponseBody[];

    expect(paymentsBody).toHaveLength(1);
    expect(paymentsBody[0].amount).toBe(320);
    expect(paymentsBody[0].method).toBe('PIX');
    expect(paymentsBody[0].reference).toBe('PIX-VISTA-320');
  });

  it('GET /api/sales lists created sales', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `list.sale.${Date.now()}@customers.e2e.local`,
    });

    await createSaleFixture(accessToken, customer.id, {
      description: 'Venda listada e2e',
      totalAmount: 1500,
    });

    const response = await request(app.getHttpServer())
      .get('/api/sales?search=Venda%20listada')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as SaleResponseBody[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.some((sale) => sale.description === 'Venda listada e2e')).toBe(
      true,
    );
  });

  it('GET /api/sales/:id returns the sale detail with installments', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `detail.sale.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda detalhe e2e',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/sales/${createdSale.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as SaleResponseBody;

    expect(body.id).toBe(createdSale.id);
    expect(body.description).toBe('Venda detalhe e2e');
    expect(body.installments).toHaveLength(3);
    expect(body.counts.pending).toBe(3);
  });

  it('GET /api/installments lists installments for a sale', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `installment.list.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda parcelas listadas',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/installments?saleId=${createdSale.id}&status=PENDING`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as InstallmentResponseBody[];

    expect(body).toHaveLength(3);
    expect(
      body.every((installment) => installment.saleId === createdSale.id),
    ).toBe(true);
    expect(body.every((installment) => installment.status === 'PENDING')).toBe(
      true,
    );
  });

  it('GET /api/installments/:id returns installment detail', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `installment.detail.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda detalhe da parcela',
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/api/installments/${firstInstallment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as InstallmentResponseBody;

    expect(body.id).toBe(firstInstallment.id);
    expect(body.sale.id).toBe(createdSale.id);
    expect(body.customer.id).toBe(customer.id);
    expect(body.remainingAmount).toBe(firstInstallment.amount);
  });

  it('GET /api/installments and GET /api/installments/:id only expose installments from the authenticated company', async () => {
    const primaryAccessToken = await getAccessToken();
    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente da parcela isolada',
      email: `isolated.installment.${Date.now()}@customers.e2e.local`,
    });
    const tenantSale = await createSaleFixture(
      tenantAccessToken,
      tenantCustomer.id,
      {
        description: 'Venda com parcela isolada',
        totalAmount: 420,
        saleDate: '2030-02-10',
        installments: [{ dueDate: '2030-03-10' }],
      },
    );
    const [tenantInstallment] = tenantSale.installments ?? [];

    expect(tenantInstallment).toBeDefined();

    const primaryListResponse = await request(app.getHttpServer())
      .get(`/api/installments?saleId=${tenantSale.id}`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryListBody =
      primaryListResponse.body as InstallmentResponseBody[];

    expect(primaryListBody).toHaveLength(0);

    await request(app.getHttpServer())
      .get(`/api/installments/${tenantInstallment.id}`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(404);

    const tenantDetailResponse = await request(app.getHttpServer())
      .get(`/api/installments/${tenantInstallment.id}`)
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantDetailBody =
      tenantDetailResponse.body as InstallmentResponseBody;

    expect(tenantDetailBody.id).toBe(tenantInstallment.id);
    expect(tenantDetailBody.saleId).toBe(tenantSale.id);
    expect(tenantDetailBody.customerId).toBe(tenantCustomer.id);
  });

  it('POST /api/installments/:id/payments registers a partial payment', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.partial.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda com pagamento parcial',
      totalAmount: 900,
      saleDate: '2026-04-05',
      installments: [
        { dueDate: '2026-06-10' },
        { dueDate: '2026-07-10' },
        { dueDate: '2026-08-10' },
      ],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    const payment = await registerPaymentFixture(
      accessToken,
      firstInstallment.id,
      {
        amount: 200,
        paidAt: '2026-05-05',
        method: 'PIX',
        reference: 'PIX-2026-0001',
      },
    );

    expect(payment.amount).toBe(200);
    expect(payment.method).toBe('PIX');
    expect(payment.installment.status).toBe('PARTIALLY_PAID');
    expect(payment.installment.paidAmount).toBe(200);
    expect(payment.installment.remainingAmount).toBe(100);

    const updatedInstallment = await request(app.getHttpServer())
      .get(`/api/installments/${firstInstallment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const installmentBody = updatedInstallment.body as InstallmentResponseBody;

    expect(installmentBody.status).toBe('PARTIALLY_PAID');
    expect(installmentBody.paidAmount).toBe(200);
    expect(installmentBody.remainingAmount).toBe(100);
  });

  it('POST /api/installments/:id/payments preserves the payment date sent as YYYY-MM-DD', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.date.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda com data de pagamento preservada',
      totalAmount: 300,
      saleDate: '2026-05-20',
      installments: [{ dueDate: '2026-05-27' }],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    const payment = await registerPaymentFixture(
      accessToken,
      firstInstallment.id,
      {
        amount: 300,
        paidAt: '2026-05-27',
        method: 'PIX',
        reference: 'PIX-DATE-300',
      },
    );

    expect(payment.paidAt.slice(0, 10)).toBe('2026-05-27');
    expect(payment.installment.paidAt?.slice(0, 10)).toBe('2026-05-27');
  });

  it('GET /api/sales?status=OPEN keeps partially paid sales in the open list', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.filter.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda parcial no filtro de abertas',
      totalAmount: 900,
      saleDate: '2026-04-05',
      installments: [
        { dueDate: '2026-06-10' },
        { dueDate: '2026-07-10' },
        { dueDate: '2026-08-10' },
      ],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallment.id, {
      amount: 200,
      paidAt: '2026-05-05',
      method: 'PIX',
      reference: 'PIX-FILTER-200',
    });

    const response = await request(app.getHttpServer())
      .get('/api/sales?status=OPEN&search=Venda%20parcial%20no%20filtro')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as SaleResponseBody[];

    expect(
      body.some(
        (sale) =>
          sale.description === 'Venda parcial no filtro de abertas' &&
          sale.status === 'PARTIALLY_PAID',
      ),
    ).toBe(true);
  });

  it('POST /api/installments/:id/payments rejects overpayment', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.over.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda para validar limite do pagamento',
      totalAmount: 450,
      saleDate: '2026-01-15',
      installments: [{ dueDate: '2026-02-15' }],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/installments/${firstInstallment.id}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 500,
        paidAt: '2026-02-16',
        method: 'CASH',
      })
      .expect(400);
  });

  it('POST /api/installments/:id/payments settles the installment and updates sale status', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.full.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda quitada em uma parcela',
      totalAmount: 450,
      saleDate: '2026-02-15',
      installments: [{ dueDate: '2026-03-15' }],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    const payment = await registerPaymentFixture(
      accessToken,
      firstInstallment.id,
      {
        amount: 450,
        paidAt: '2026-03-15',
        method: 'CREDIT_CARD',
        reference: 'CC-2026-450',
      },
    );

    expect(payment.installment.status).toBe('PAID');
    expect(payment.installment.remainingAmount).toBe(0);
    expect(payment.sale.status).toBe('PAID');

    const saleResponse = await request(app.getHttpServer())
      .get(`/api/sales/${createdSale.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const saleBody = saleResponse.body as SaleResponseBody;

    expect(saleBody.status).toBe('PAID');
    expect(saleBody.financial.remainingAmount).toBe(0);
    expect(saleBody.financial.paidAmount).toBe(450);
    expect(saleBody.installments?.[0]?.status).toBe('PAID');
  });

  it('POST /api/installments/:id/reopen requires the user password and restores the installment balance', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.reopen.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda reaberta com senha',
      totalAmount: 450,
      saleDate: '2026-02-15',
      installments: [{ dueDate: '2026-03-15' }],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallment.id, {
      amount: 450,
      paidAt: '2026-03-15',
      method: 'PIX',
      reference: 'PIX-REOPEN-450',
    });

    await request(app.getHttpServer())
      .post(`/api/installments/${firstInstallment.id}/reopen`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password: 'senha-incorreta' })
      .expect(401);

    await reopenInstallmentFixture(
      accessToken,
      firstInstallment.id,
      adminPassword,
    );

    const installmentResponse = await request(app.getHttpServer())
      .get(`/api/installments/${firstInstallment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const installmentBody = installmentResponse.body as InstallmentResponseBody;

    expect(installmentBody.status).toBe('OVERDUE');
    expect(installmentBody.paidAmount).toBe(0);
    expect(installmentBody.remainingAmount).toBe(450);
    expect(installmentBody.paidAt).toBeNull();

    const saleResponse = await request(app.getHttpServer())
      .get(`/api/sales/${createdSale.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const saleBody = saleResponse.body as SaleResponseBody;

    expect(saleBody.status).toBe('OVERDUE');
    expect(saleBody.financial.paidAmount).toBe(0);
    expect(saleBody.financial.remainingAmount).toBe(450);
    expect(saleBody.installments?.[0]?.status).toBe('OVERDUE');

    const paymentsResponse = await request(app.getHttpServer())
      .get(`/api/payments?installmentId=${firstInstallment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const paymentsBody = paymentsResponse.body as PaymentResponseBody[];

    expect(paymentsBody).toHaveLength(0);
  });

  it('payments and installment reopening only mutate records from the authenticated company', async () => {
    const primaryAccessToken = await getAccessToken();
    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente do pagamento isolado',
      email: `isolated.payment.${Date.now()}@customers.e2e.local`,
    });
    const tenantSale = await createSaleFixture(
      tenantAccessToken,
      tenantCustomer.id,
      {
        description: 'Venda com pagamento isolado',
        totalAmount: 500,
        saleDate: '2026-01-12',
        installments: [{ dueDate: '2026-02-12' }],
      },
    );
    const [tenantInstallment] = tenantSale.installments ?? [];

    expect(tenantInstallment).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/installments/${tenantInstallment.id}/payments`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({
        amount: 100,
        paidAt: '2026-02-12',
        method: 'PIX',
        reference: 'CROSS-TENANT-PAYMENT',
      })
      .expect(404);

    const tenantPayment = await registerPaymentFixture(
      tenantAccessToken,
      tenantInstallment.id,
      {
        amount: 500,
        paidAt: '2026-02-12',
        method: 'PIX',
        reference: 'TENANT-FULL-PAYMENT',
      },
    );

    expect(tenantPayment.installment.status).toBe('PAID');

    await request(app.getHttpServer())
      .post(`/api/installments/${tenantInstallment.id}/reopen`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({ password: adminPassword })
      .expect(404);

    const primaryPaymentsResponse = await request(app.getHttpServer())
      .get(`/api/payments?installmentId=${tenantInstallment.id}`)
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryPaymentsBody =
      primaryPaymentsResponse.body as PaymentResponseBody[];

    expect(primaryPaymentsBody).toHaveLength(0);

    const tenantPaymentsResponse = await request(app.getHttpServer())
      .get(`/api/payments?installmentId=${tenantInstallment.id}`)
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantPaymentsBody =
      tenantPaymentsResponse.body as PaymentResponseBody[];

    expect(tenantPaymentsBody).toHaveLength(1);
    expect(tenantPaymentsBody[0].id).toBe(tenantPayment.id);

    await reopenInstallmentFixture(
      tenantAccessToken,
      tenantInstallment.id,
      isolatedTenant.password,
    );

    const tenantInstallmentResponse = await request(app.getHttpServer())
      .get(`/api/installments/${tenantInstallment.id}`)
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantInstallmentBody =
      tenantInstallmentResponse.body as InstallmentResponseBody;

    expect(tenantInstallmentBody.status).toBe('OVERDUE');
    expect(tenantInstallmentBody.paidAmount).toBe(0);
    expect(tenantInstallmentBody.remainingAmount).toBe(500);
  });

  it('GET /api/payments lists payments and supports filtering by installment', async () => {
    const accessToken = await getAccessToken();
    const customer = await createCustomerFixture(accessToken, {
      email: `payment.list.${Date.now()}@customers.e2e.local`,
    });
    const createdSale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda com historico de pagamentos',
      totalAmount: 800,
      saleDate: '2026-03-15',
      installments: [{ dueDate: '2026-04-15' }],
    });
    const [firstInstallment] = createdSale.installments ?? [];

    expect(firstInstallment).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallment.id, {
      amount: 300,
      paidAt: '2026-04-10',
      method: 'BANK_TRANSFER',
      reference: 'TED-2026-300',
    });

    const response = await request(app.getHttpServer())
      .get(`/api/payments?installmentId=${firstInstallment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as PaymentResponseBody[];

    expect(body).toHaveLength(1);
    expect(body[0].installmentId).toBe(firstInstallment.id);
    expect(body[0].method).toBe('BANK_TRANSFER');
    expect(body[0].customer.id).toBe(customer.id);
  });

  it('GET /api/dashboard/summary returns the financial panorama with real aggregates', async () => {
    const accessToken = await getAccessToken();
    const today = new Date();
    const todayInput = toDateInput(today);
    const saleAInstallments = [
      { dueDate: toDateInput(addDays(today, -30)) },
      { dueDate: toDateInput(addDays(today, 5)) },
      { dueDate: toDateInput(addDays(today, 25)) },
    ];

    await clearE2EData();

    const baselineResponse = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const baselineBody = baselineResponse.body as DashboardSummaryResponseBody;

    const customerA = await createCustomerFixture(accessToken, {
      name: 'Cliente Dashboard A',
      email: `dashboard.a.${Date.now()}@customers.e2e.local`,
    });
    const saleA = await createSaleFixture(accessToken, customerA.id, {
      description: 'Venda dashboard em atraso',
      totalAmount: 1200,
      saleDate: toDateInput(addDays(today, -60)),
      installments: saleAInstallments,
    });

    const firstInstallmentA = saleA.installments?.[0];
    expect(firstInstallmentA).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallmentA!.id, {
      amount: 200,
      paidAt: todayInput,
      method: 'PIX',
      reference: 'DASH-PIX-200',
    });

    const customerB = await createCustomerFixture(accessToken, {
      name: 'Cliente Dashboard B',
      email: `dashboard.b.${Date.now()}@customers.e2e.local`,
    });
    const saleB = await createSaleFixture(accessToken, customerB.id, {
      description: 'Venda dashboard quitada',
      totalAmount: 450,
      saleDate: toDateInput(addDays(today, -10)),
      installments: [{ dueDate: todayInput }],
    });

    const firstInstallmentB = saleB.installments?.[0];
    expect(firstInstallmentB).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallmentB!.id, {
      amount: 450,
      paidAt: todayInput,
      method: 'BANK_TRANSFER',
      reference: 'DASH-TED-450',
    });

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as DashboardSummaryResponseBody;

    expect(body.upcomingWindowDays).toBe(7);
    expect(body.totals.totalCustomers).toBe(
      baselineBody.totals.totalCustomers + 2,
    );
    expect(body.totals.activeCustomers).toBe(
      baselineBody.totals.activeCustomers + 2,
    );
    expect(body.totals.openAmount).toBe(baselineBody.totals.openAmount + 1000);
    expect(body.totals.overdueAmount).toBe(
      baselineBody.totals.overdueAmount + 200,
    );
    expect(body.totals.receivedThisMonth).toBe(
      baselineBody.totals.receivedThisMonth + 650,
    );
    expect(body.totals.openInstallments).toBe(
      baselineBody.totals.openInstallments + 3,
    );
    expect(body.totals.overdueInstallments).toBe(
      baselineBody.totals.overdueInstallments + 1,
    );
    expect(body.totals.paidInstallments).toBe(
      baselineBody.totals.paidInstallments + 1,
    );
    expect(body.saleStatusBreakdown.overdue).toBe(
      baselineBody.saleStatusBreakdown.overdue + 1,
    );
    expect(body.saleStatusBreakdown.paid).toBe(
      baselineBody.saleStatusBreakdown.paid + 1,
    );
    expect(
      body.upcomingInstallments.some(
        (installment) => installment.remainingAmount === 400,
      ),
    ).toBe(true);
    expect(
      body.overdueInstallments.some(
        (installment) =>
          installment.saleDescription === 'Venda dashboard em atraso',
      ),
    ).toBe(true);
    expect(
      body.recentPayments.some(
        (payment) =>
          payment.saleDescription === 'Venda dashboard quitada' &&
          payment.amount === 450,
      ),
    ).toBe(true);
  });

  it('GET /api/dashboard/summary filters the panorama by the selected date range', async () => {
    const accessToken = await getAccessToken();
    const today = new Date();
    const currentMonthRange = getMonthRange(today);
    const insideSaleDate = toDateInput(addDays(today, -2));
    const insideDueDate = toDateInput(addDays(today, 10));
    const paymentDate = toDateInput(today);
    const outsideSaleDate = toDateInput(
      new Date(today.getFullYear(), today.getMonth() - 1, 10),
    );
    const outsideDueDate = toDateInput(
      new Date(today.getFullYear(), today.getMonth() - 1, 20),
    );

    await clearE2EData();

    const baselineResponse = await request(app.getHttpServer())
      .get(
        `/api/dashboard/summary?from=${currentMonthRange.from}&to=${currentMonthRange.to}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const baselineBody = baselineResponse.body as DashboardSummaryResponseBody;

    const customerOutside = await createCustomerFixture(accessToken, {
      name: 'Cliente Dashboard Fora do Range',
      email: `dashboard.outside.${Date.now()}@customers.e2e.local`,
    });
    await createSaleFixture(accessToken, customerOutside.id, {
      description: 'Venda fora do range',
      totalAmount: 700,
      saleDate: outsideSaleDate,
      installments: [{ dueDate: outsideDueDate }],
    });

    const customerInside = await createCustomerFixture(accessToken, {
      name: 'Cliente Dashboard Dentro do Range',
      email: `dashboard.inside.${Date.now()}@customers.e2e.local`,
    });
    const saleInside = await createSaleFixture(accessToken, customerInside.id, {
      description: 'Venda dentro do range',
      totalAmount: 300,
      saleDate: insideSaleDate,
      installments: [{ dueDate: insideDueDate }],
    });

    const firstInstallmentInside = saleInside.installments?.[0];
    expect(firstInstallmentInside).toBeDefined();

    await registerPaymentFixture(accessToken, firstInstallmentInside!.id, {
      amount: 150,
      paidAt: paymentDate,
      method: 'PIX',
      reference: 'DASH-RANGE-150',
    });

    const response = await request(app.getHttpServer())
      .get(
        `/api/dashboard/summary?from=${currentMonthRange.from}&to=${currentMonthRange.to}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as DashboardSummaryResponseBody;

    expect(body.totals.salesInRange).toBe(baselineBody.totals.salesInRange + 1);
    expect(body.totals.receivedInRange).toBe(
      baselineBody.totals.receivedInRange + 150,
    );
    expect(body.totals.openAmount).toBe(baselineBody.totals.openAmount + 850);
    expect(body.totals.overdueAmount).toBe(
      baselineBody.totals.overdueAmount + 700,
    );
    expect(body.saleStatusBreakdown.partiallyPaid).toBe(
      baselineBody.saleStatusBreakdown.partiallyPaid + 1,
    );
    expect(body.saleStatusBreakdown.overdue).toBe(
      baselineBody.saleStatusBreakdown.overdue + 1,
    );
    expect(
      body.recentPayments.some(
        (payment) => payment.saleDescription === 'Venda dentro do range',
      ),
    ).toBe(true);
  });

  it('GET /api/dashboard/summary only aggregates data from the authenticated company', async () => {
    const primaryAccessToken = await getAccessToken();

    await clearE2EData();

    const baselineResponse = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const baselineBody = baselineResponse.body as DashboardSummaryResponseBody;

    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente dashboard isolado',
      email: `dashboard.isolated.${Date.now()}@customers.e2e.local`,
    });
    await createSaleFixture(tenantAccessToken, tenantCustomer.id, {
      description: 'Venda exclusiva do tenant',
      totalAmount: 600,
      saleDate: '2026-05-20',
      installments: [{ dueDate: '2026-06-10' }],
    });

    const primaryAfterTenantResponse = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryAfterTenantBody =
      primaryAfterTenantResponse.body as DashboardSummaryResponseBody;

    expect(primaryAfterTenantBody.totals.totalCustomers).toBe(
      baselineBody.totals.totalCustomers,
    );
    expect(primaryAfterTenantBody.totals.openAmount).toBe(
      baselineBody.totals.openAmount,
    );
    expect(primaryAfterTenantBody.saleStatusBreakdown.open).toBe(
      baselineBody.saleStatusBreakdown.open,
    );

    const tenantSummaryResponse = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantSummaryBody =
      tenantSummaryResponse.body as DashboardSummaryResponseBody;

    expect(tenantSummaryBody.totals.totalCustomers).toBe(1);
    expect(tenantSummaryBody.totals.openAmount).toBe(600);
    expect(tenantSummaryBody.saleStatusBreakdown.open).toBe(1);
  });

  it('POST /api/reminders/process records blocked reminders when WhatsApp is disconnected', async () => {
    const accessToken = await getAccessToken();
    const scheduledDueDate = new Date(2030, 0, 25);

    await clearE2EData();
    await ensureWhatsAppConnectionStatus(adminCompanyId, 'DISCONNECTED');

    const summaryBeforeResponse = await request(app.getHttpServer())
      .get('/api/reminders/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const summaryBefore =
      summaryBeforeResponse.body as ReminderSummaryResponseBody;

    const customer = await createCustomerFixture(accessToken, {
      name: 'Cliente cobranca bloqueada',
      email: `reminder.blocked.${Date.now()}@customers.e2e.local`,
      whatsappPhone: '(11) 97777-4444',
    });

    const sale = await createSaleFixture(accessToken, customer.id, {
      description: 'Venda com lembrete bloqueado',
      totalAmount: 360,
      saleDate: toDateInput(addDays(scheduledDueDate, -5)),
      installments: [{ dueDate: toDateInput(scheduledDueDate) }],
    });

    const firstInstallment = sale.installments?.[0];
    expect(firstInstallment).toBeDefined();

    const referenceDateInput = toDateInput(new Date(firstInstallment!.dueDate));

    const processResponse = await request(app.getHttpServer())
      .post('/api/reminders/process')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        referenceDate: referenceDateInput,
      })
      .expect(201);
    const processBody = processResponse.body as ProcessRemindersResponseBody;

    expect(processBody.created).toBe(1);
    expect(processBody.sent).toBe(0);
    expect(processBody.failed).toBe(1);

    const summaryAfterResponse = await request(app.getHttpServer())
      .get('/api/reminders/summary')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const summaryAfter =
      summaryAfterResponse.body as ReminderSummaryResponseBody;

    expect(summaryAfter.failed).toBe(summaryBefore.failed + 1);
    expect(summaryAfter.blockedByConnection).toBe(
      summaryBefore.blockedByConnection + 1,
    );

    const remindersResponse = await request(app.getHttpServer())
      .get('/api/reminders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const remindersBody =
      remindersResponse.body as ReminderListItemResponseBody[];

    expect(
      remindersBody.some(
        (reminder) =>
          reminder.customerName === 'Cliente cobranca bloqueada' &&
          reminder.status === 'FAILED' &&
          reminder.failureReason === 'WHATSAPP_DISCONNECTED',
      ),
    ).toBe(true);
  });

  it('reminders list, summary and manual processing are isolated by company', async () => {
    const primaryAccessToken = await getAccessToken();

    await clearE2EData();
    await ensureWhatsAppConnectionStatus(adminCompanyId, 'DISCONNECTED');

    const isolatedTenant = await createTenantUserFixture();
    const tenantAccessToken = (
      await loginAs(isolatedTenant.email, isolatedTenant.password)
    ).accessToken;

    await ensureWhatsAppConnectionStatus(
      isolatedTenant.company.id,
      'DISCONNECTED',
    );

    const tenantCustomer = await createCustomerFixture(tenantAccessToken, {
      name: 'Cliente cobranca isolada',
      email: `reminder.isolated.${Date.now()}@customers.e2e.local`,
      whatsappPhone: '(11) 97777-3333',
    });
    const tenantSale = await createSaleFixture(
      tenantAccessToken,
      tenantCustomer.id,
      {
        description: 'Venda isolada para cobranca',
        totalAmount: 480,
        saleDate: '2030-01-20',
        installments: [{ dueDate: '2030-01-25' }],
      },
    );
    const [tenantInstallment] = tenantSale.installments ?? [];

    expect(tenantInstallment).toBeDefined();

    const primaryProcessResponse = await request(app.getHttpServer())
      .post('/api/reminders/process')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .send({
        referenceDate: '2030-01-25',
      })
      .expect(201);
    const primaryProcessBody =
      primaryProcessResponse.body as ProcessRemindersResponseBody;

    expect(primaryProcessBody.created).toBe(0);
    expect(primaryProcessBody.failed).toBe(0);

    const tenantSummaryBeforeResponse = await request(app.getHttpServer())
      .get('/api/reminders/summary')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantSummaryBefore =
      tenantSummaryBeforeResponse.body as ReminderSummaryResponseBody;

    expect(tenantSummaryBefore.failed).toBe(0);
    expect(tenantSummaryBefore.sent).toBe(0);

    const tenantProcessResponse = await request(app.getHttpServer())
      .post('/api/reminders/process')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .send({
        referenceDate: '2030-01-25',
      })
      .expect(201);
    const tenantProcessBody =
      tenantProcessResponse.body as ProcessRemindersResponseBody;

    expect(tenantProcessBody.created).toBe(1);
    expect(tenantProcessBody.failed).toBe(1);

    const primaryRemindersResponse = await request(app.getHttpServer())
      .get('/api/reminders')
      .set('Authorization', `Bearer ${primaryAccessToken}`)
      .expect(200);
    const primaryRemindersBody =
      primaryRemindersResponse.body as ReminderListItemResponseBody[];

    expect(primaryRemindersBody).toHaveLength(0);

    const tenantRemindersResponse = await request(app.getHttpServer())
      .get('/api/reminders')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantRemindersBody =
      tenantRemindersResponse.body as ReminderListItemResponseBody[];

    expect(tenantRemindersBody).toHaveLength(1);
    expect(tenantRemindersBody[0].customerName).toBe(
      'Cliente cobranca isolada',
    );
    expect(tenantRemindersBody[0].status).toBe('FAILED');

    const tenantSummaryAfterResponse = await request(app.getHttpServer())
      .get('/api/reminders/summary')
      .set('Authorization', `Bearer ${tenantAccessToken}`)
      .expect(200);
    const tenantSummaryAfter =
      tenantSummaryAfterResponse.body as ReminderSummaryResponseBody;

    expect(tenantSummaryAfter.failed).toBe(1);
    expect(tenantSummaryAfter.blockedByConnection).toBe(1);
  });

  afterAll(async () => {
    await app.close();
  });
});
