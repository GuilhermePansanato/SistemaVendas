-- CreateEnum
CREATE TYPE "PlatformUserRole" AS ENUM ('SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SystemModuleKey" AS ENUM ('DASHBOARD', 'CUSTOMERS', 'SALES', 'REMINDERS');

-- CreateTable
CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "PlatformUserRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemModule" (
    "key" "SystemModuleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTenantVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemModule_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CompanyModuleSubscription" (
    "companyId" TEXT NOT NULL,
    "moduleKey" "SystemModuleKey" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyModuleSubscription_pkey" PRIMARY KEY ("companyId","moduleKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

-- CreateIndex
CREATE INDEX "SystemModule_isActive_idx" ON "SystemModule"("isActive");

-- CreateIndex
CREATE INDEX "SystemModule_sortOrder_idx" ON "SystemModule"("sortOrder");

-- CreateIndex
CREATE INDEX "CompanyModuleSubscription_companyId_isActive_idx" ON "CompanyModuleSubscription"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "CompanyModuleSubscription_moduleKey_isActive_idx" ON "CompanyModuleSubscription"("moduleKey", "isActive");

INSERT INTO "SystemModule" ("key", "name", "description", "isActive", "isTenantVisible", "sortOrder", "createdAt", "updatedAt")
VALUES
  ('DASHBOARD', 'Dashboard', 'Resumo financeiro e operacional da empresa.', true, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CUSTOMERS', 'Clientes', 'Cadastro e gestão de clientes.', true, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SALES', 'Vendas', 'Vendas, parcelas e pagamentos.', true, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('REMINDERS', 'Cobrancas', 'Cobrancas, lembretes e WhatsApp.', true, true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "CompanyModuleSubscription" ("companyId", "moduleKey", "isActive", "createdAt", "updatedAt")
SELECT "company"."id", "module"."key", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Company" AS "company"
CROSS JOIN "SystemModule" AS "module"
ON CONFLICT ("companyId", "moduleKey") DO NOTHING;

-- AddForeignKey
ALTER TABLE "CompanyModuleSubscription" ADD CONSTRAINT "CompanyModuleSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyModuleSubscription" ADD CONSTRAINT "CompanyModuleSubscription_moduleKey_fkey" FOREIGN KEY ("moduleKey") REFERENCES "SystemModule"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
