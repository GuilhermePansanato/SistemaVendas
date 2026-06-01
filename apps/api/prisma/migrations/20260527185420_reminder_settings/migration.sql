-- CreateTable
CREATE TABLE "ReminderSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultSendTime" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSettings_pkey" PRIMARY KEY ("id")
);
