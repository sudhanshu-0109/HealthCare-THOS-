-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT', 'MEDICATION');

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "fee" DECIMAL(65,30) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_tokens" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "queueDate" TIMESTAMP(3) NOT NULL,
    "tokenNumber" DOUBLE PRECISION NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "calledAt" TIMESTAMP(3),
    "consultationStartAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "healthcare_passports" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "allergies" TEXT[],
    "medicalConditions" TEXT[],
    "currentMedications" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passport_consents" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "doctorId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "passport_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_timeline_events" (
    "id" TEXT NOT NULL,
    "passportId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_availability_doctorId_idx" ON "doctor_availability"("doctorId");

-- CreateIndex
CREATE INDEX "appointments_hospitalId_idx" ON "appointments"("hospitalId");

-- CreateIndex
CREATE INDEX "appointments_doctorId_idx" ON "appointments"("doctorId");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_doctorId_scheduledDate_scheduledTime_key" ON "appointments"("doctorId", "scheduledDate", "scheduledTime");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayOrderId_key" ON "payments"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "payments_appointmentId_idx" ON "payments"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tokens_appointmentId_key" ON "queue_tokens"("appointmentId");

-- CreateIndex
CREATE INDEX "queue_tokens_doctorId_queueDate_idx" ON "queue_tokens"("doctorId", "queueDate");

-- CreateIndex
CREATE INDEX "queue_tokens_hospitalId_idx" ON "queue_tokens"("hospitalId");

-- CreateIndex
CREATE INDEX "queue_tokens_status_idx" ON "queue_tokens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "healthcare_passports_patientId_key" ON "healthcare_passports"("patientId");

-- CreateIndex
CREATE INDEX "passport_consents_passportId_idx" ON "passport_consents"("passportId");

-- CreateIndex
CREATE INDEX "medical_timeline_events_passportId_idx" ON "medical_timeline_events"("passportId");

-- CreateIndex
CREATE INDEX "medical_timeline_events_eventType_idx" ON "medical_timeline_events"("eventType");

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tokens" ADD CONSTRAINT "queue_tokens_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "healthcare_passports" ADD CONSTRAINT "healthcare_passports_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_consents" ADD CONSTRAINT "passport_consents_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "healthcare_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_consents" ADD CONSTRAINT "passport_consents_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_consents" ADD CONSTRAINT "passport_consents_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_timeline_events" ADD CONSTRAINT "medical_timeline_events_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "healthcare_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
