-- CreateEnum
CREATE TYPE "ReminderFailureReason" AS ENUM ('WHATSAPP_DISCONNECTED', 'AUTH_FAILURE', 'DELIVERY_ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WhatsAppConnectionStatus" AS ENUM ('DISCONNECTED', 'PENDING_QR', 'CONNECTING', 'CONNECTED', 'AUTH_FAILURE');

-- CreateEnum
CREATE TYPE "WhatsAppConnectionEventType" AS ENUM ('QR_GENERATED', 'AUTHENTICATED', 'READY', 'DISCONNECTED', 'AUTH_FAILURE', 'SEND_BLOCKED');

-- AlterTable
ALTER TABLE "ReminderMessage" ADD COLUMN     "attemptedAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" "ReminderFailureReason",
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsappConnectionId" TEXT;

-- CreateTable
CREATE TABLE "WhatsAppConnection" (
    "id" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'WHATSAPP_WEB_JS',
    "status" "WhatsAppConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "displayName" TEXT,
    "phoneNumber" TEXT,
    "qrCode" TEXT,
    "sessionPath" TEXT,
    "lastConnectedAt" TIMESTAMP(3),
    "lastDisconnectedAt" TIMESTAMP(3),
    "lastQrGeneratedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConnectionEvent" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "type" "WhatsAppConnectionEventType" NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppConnectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConnection_clientKey_key" ON "WhatsAppConnection"("clientKey");

-- CreateIndex
CREATE INDEX "WhatsAppConnection_status_idx" ON "WhatsAppConnection"("status");

-- CreateIndex
CREATE INDEX "WhatsAppConnection_lastConnectedAt_idx" ON "WhatsAppConnection"("lastConnectedAt");

-- CreateIndex
CREATE INDEX "WhatsAppConnectionEvent_connectionId_createdAt_idx" ON "WhatsAppConnectionEvent"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppConnectionEvent_type_idx" ON "WhatsAppConnectionEvent"("type");

-- CreateIndex
CREATE INDEX "ReminderMessage_whatsappConnectionId_idx" ON "ReminderMessage"("whatsappConnectionId");

-- CreateIndex
CREATE INDEX "ReminderMessage_failureReason_idx" ON "ReminderMessage"("failureReason");

-- CreateIndex
CREATE INDEX "ReminderMessage_attemptedAt_idx" ON "ReminderMessage"("attemptedAt");

-- AddForeignKey
ALTER TABLE "ReminderMessage" ADD CONSTRAINT "ReminderMessage_whatsappConnectionId_fkey" FOREIGN KEY ("whatsappConnectionId") REFERENCES "WhatsAppConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConnectionEvent" ADD CONSTRAINT "WhatsAppConnectionEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "WhatsAppConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
