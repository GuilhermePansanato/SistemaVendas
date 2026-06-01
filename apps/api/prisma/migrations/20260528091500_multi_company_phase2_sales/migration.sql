-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "companyId" TEXT;

UPDATE "Sale" AS "sale"
SET "companyId" = "customer"."companyId"
FROM "Customer" AS "customer"
WHERE "sale"."customerId" = "customer"."id"
  AND "sale"."companyId" IS NULL;

UPDATE "Sale"
SET "companyId" = 'default-company'
WHERE "companyId" IS NULL;

ALTER TABLE "Sale"
ALTER COLUMN "companyId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Sale_companyId_idx" ON "Sale"("companyId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
