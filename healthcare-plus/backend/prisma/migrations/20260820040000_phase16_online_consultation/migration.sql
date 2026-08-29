-- Phase 16: Online Consultation
-- This migration is STRICTLY ADDITIVE for existing data:
--   - consultationType defaults to 'OFFLINE' so every existing row stays offline
--   - queueTokenId becomes nullable; existing values retained
--   - OnlineSession is a brand-new table; no existing rows affected
--   - NotificationType gets new values; nothing removed

-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "OnlineSessionStatus" AS ENUM ('SCHEDULED', 'WAITING_FOR_PARTICIPANTS', 'PATIENT_JOINED', 'DOCTOR_JOINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterEnum: Add new NotificationType values for online consultation events
ALTER TYPE "NotificationType" ADD VALUE 'ONLINE_CONSULTATION_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'ONLINE_CONSULTATION_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'ONLINE_SESSION_STARTING';
ALTER TYPE "NotificationType" ADD VALUE 'ONLINE_SESSION_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'ONLINE_SESSION_COMPLETED';

-- DropForeignKey: drop old NOT NULL FK before altering column
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_queueTokenId_fkey";

-- AlterTable appointments: add consultationType with safe default
ALTER TABLE "appointments" ADD COLUMN "consultationType" "ConsultationType" NOT NULL DEFAULT 'OFFLINE';

-- AlterTable consultations: make queueTokenId nullable, add onlineSessionId
ALTER TABLE "consultations" ADD COLUMN "onlineSessionId" TEXT,
ALTER COLUMN "queueTokenId" DROP NOT NULL;

-- CreateTable: online_sessions
CREATE TABLE "online_sessions" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "status" "OnlineSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "patientJoinedAt" TIMESTAMP(3),
    "doctorJoinedAt" TIMESTAMP(3),
    "endedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "online_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "online_sessions_appointmentId_key" ON "online_sessions"("appointmentId");
CREATE UNIQUE INDEX "online_sessions_roomId_key" ON "online_sessions"("roomId");
CREATE INDEX "online_sessions_status_idx" ON "online_sessions"("status");
CREATE INDEX "online_sessions_scheduledStart_idx" ON "online_sessions"("scheduledStart");
CREATE INDEX "appointments_consultationType_idx" ON "appointments"("consultationType");
CREATE UNIQUE INDEX "consultations_onlineSessionId_key" ON "consultations"("onlineSessionId");

-- AddForeignKey: re-add queueToken FK as nullable (SET NULL on delete)
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_queueTokenId_fkey"
  FOREIGN KEY ("queueTokenId") REFERENCES "queue_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: onlineSession FK
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_onlineSessionId_fkey"
  FOREIGN KEY ("onlineSessionId") REFERENCES "online_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: online_sessions -> appointments
ALTER TABLE "online_sessions" ADD CONSTRAINT "online_sessions_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
