-- AlterTable
ALTER TABLE "ReminderSettings" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ReminderRule" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ReminderMessage" ADD COLUMN "companyId" TEXT;
ALTER TABLE "WhatsAppConnection" ADD COLUMN "companyId" TEXT;
ALTER TABLE "WhatsAppConnectionEvent" ADD COLUMN "companyId" TEXT;

UPDATE "ReminderSettings"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

UPDATE "ReminderRule"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

UPDATE "ReminderMessage" AS "message"
SET "companyId" = "sale"."companyId"
FROM "Installment" AS "installment"
INNER JOIN "Sale" AS "sale" ON "sale"."id" = "installment"."saleId"
WHERE "message"."installmentId" = "installment"."id"
  AND "message"."companyId" IS NULL;

UPDATE "ReminderMessage"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

UPDATE "WhatsAppConnection"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

UPDATE "WhatsAppConnectionEvent" AS "event"
SET "companyId" = "connection"."companyId"
FROM "WhatsAppConnection" AS "connection"
WHERE "event"."connectionId" = "connection"."id"
  AND "event"."companyId" IS NULL;

UPDATE "WhatsAppConnectionEvent"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

ALTER TABLE "ReminderSettings"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "ReminderRule"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "ReminderMessage"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "WhatsAppConnection"
ALTER COLUMN "companyId" SET NOT NULL;

ALTER TABLE "WhatsAppConnectionEvent"
ALTER COLUMN "companyId" SET NOT NULL;

DROP INDEX IF EXISTS "ReminderRule_triggerType_daysBefore_key";

CREATE UNIQUE INDEX "ReminderSettings_companyId_key" ON "ReminderSettings"("companyId");
CREATE INDEX "ReminderSettings_companyId_idx" ON "ReminderSettings"("companyId");

CREATE UNIQUE INDEX "ReminderRule_companyId_triggerType_daysBefore_key" ON "ReminderRule"("companyId", "triggerType", "daysBefore");
CREATE INDEX "ReminderRule_companyId_idx" ON "ReminderRule"("companyId");

CREATE INDEX "ReminderMessage_companyId_idx" ON "ReminderMessage"("companyId");

CREATE UNIQUE INDEX "WhatsAppConnection_companyId_key" ON "WhatsAppConnection"("companyId");
CREATE INDEX "WhatsAppConnection_companyId_idx" ON "WhatsAppConnection"("companyId");

CREATE INDEX "WhatsAppConnectionEvent_companyId_createdAt_idx" ON "WhatsAppConnectionEvent"("companyId", "createdAt");

ALTER TABLE "ReminderSettings" ADD CONSTRAINT "ReminderSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReminderRule" ADD CONSTRAINT "ReminderRule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReminderMessage" ADD CONSTRAINT "ReminderMessage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConnectionEvent" ADD CONSTRAINT "WhatsAppConnectionEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
