-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "reversalReason" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_reversedAt_idx" ON "Payment"("reversedAt");
