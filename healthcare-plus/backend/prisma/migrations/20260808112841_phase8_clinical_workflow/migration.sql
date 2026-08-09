-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LabRequestPriority" AS ENUM ('ROUTINE', 'URGENT');

-- CreateEnum
CREATE TYPE "LabRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'BOOKED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('REGULAR', 'LITE');

-- CreateEnum
CREATE TYPE "PharmacyOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'PACKED', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderLogStatus" AS ENUM ('PENDING', 'TAKEN', 'MISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LAB_REPORT_READY', 'PHARMACY_ORDER_UPDATE', 'APPOINTMENT_REMINDER', 'GENERAL');

-- AlterEnum
ALTER TYPE "TimelineEventType" ADD VALUE 'LAB_REQUEST';

-- DropIndex
DROP INDEX "appointments_doctorId_scheduledDate_scheduledTime_key";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "appointmentType" "AppointmentType" NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "acceptsLiteAppointments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liteConsultationFee" DECIMAL(65,30),
ADD COLUMN     "liteSlotMinutes" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "queueTokenId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "treatmentPlan" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "generalInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_requests" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "priority" "LabRequestPriority" NOT NULL DEFAULT 'ROUTINE',
    "notes" TEXT,
    "status" "LabRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_request_items" (
    "id" TEXT NOT NULL,
    "labRequestId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "estimatedPrice" DECIMAL(65,30),

    CONSTRAINT "lab_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_up_recommendations" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "recommendedDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "bookedAppointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_up_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_orders" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" "PharmacyOrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_order_items" (
    "id" TEXT NOT NULL,
    "pharmacyOrderId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "medicineId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30),
    "subtotal" DECIMAL(65,30),

    CONSTRAINT "pharmacy_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_reminders" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "pharmacyOrderId" TEXT,
    "medicineName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reminderTimes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_reminder_logs" (
    "id" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "ReminderLogStatus" NOT NULL DEFAULT 'PENDING',
    "markedAt" TIMESTAMP(3),

    CONSTRAINT "medicine_reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_test_catalog" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "sampleType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_test_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" TEXT NOT NULL,
    "labRequestId" TEXT NOT NULL,
    "labRequestItemId" TEXT,
    "resultSummary" TEXT,
    "reportFileUrl" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consultations_appointmentId_key" ON "consultations"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_queueTokenId_key" ON "consultations"("queueTokenId");

-- CreateIndex
CREATE INDEX "consultations_doctorId_idx" ON "consultations"("doctorId");

-- CreateIndex
CREATE INDEX "consultations_patientId_idx" ON "consultations"("patientId");

-- CreateIndex
CREATE INDEX "consultations_hospitalId_idx" ON "consultations"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_consultationId_key" ON "prescriptions"("consultationId");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_idx" ON "prescriptions"("patientId");

-- CreateIndex
CREATE INDEX "prescriptions_hospitalId_idx" ON "prescriptions"("hospitalId");

-- CreateIndex
CREATE INDEX "prescription_items_prescriptionId_idx" ON "prescription_items"("prescriptionId");

-- CreateIndex
CREATE INDEX "lab_requests_patientId_idx" ON "lab_requests"("patientId");

-- CreateIndex
CREATE INDEX "lab_requests_hospitalId_idx" ON "lab_requests"("hospitalId");

-- CreateIndex
CREATE INDEX "lab_requests_status_idx" ON "lab_requests"("status");

-- CreateIndex
CREATE INDEX "lab_request_items_labRequestId_idx" ON "lab_request_items"("labRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_up_recommendations_consultationId_key" ON "follow_up_recommendations"("consultationId");

-- CreateIndex
CREATE INDEX "follow_up_recommendations_patientId_idx" ON "follow_up_recommendations"("patientId");

-- CreateIndex
CREATE INDEX "medicines_hospitalId_idx" ON "medicines"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_orders_prescriptionId_key" ON "pharmacy_orders"("prescriptionId");

-- CreateIndex
CREATE INDEX "pharmacy_orders_patientId_idx" ON "pharmacy_orders"("patientId");

-- CreateIndex
CREATE INDEX "pharmacy_orders_hospitalId_idx" ON "pharmacy_orders"("hospitalId");

-- CreateIndex
CREATE INDEX "pharmacy_orders_status_idx" ON "pharmacy_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_order_items_prescriptionItemId_key" ON "pharmacy_order_items"("prescriptionItemId");

-- CreateIndex
CREATE INDEX "pharmacy_order_items_pharmacyOrderId_idx" ON "pharmacy_order_items"("pharmacyOrderId");

-- CreateIndex
CREATE INDEX "medicine_reminders_patientId_idx" ON "medicine_reminders"("patientId");

-- CreateIndex
CREATE INDEX "medicine_reminder_logs_reminderId_idx" ON "medicine_reminder_logs"("reminderId");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_reminder_logs_reminderId_scheduledFor_key" ON "medicine_reminder_logs"("reminderId", "scheduledFor");

-- CreateIndex
CREATE INDEX "lab_test_catalog_hospitalId_idx" ON "lab_test_catalog"("hospitalId");

-- CreateIndex
CREATE INDEX "lab_reports_labRequestId_idx" ON "lab_reports"("labRequestId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_queueTokenId_fkey" FOREIGN KEY ("queueTokenId") REFERENCES "queue_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_requests" ADD CONSTRAINT "lab_requests_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_request_items" ADD CONSTRAINT "lab_request_items_labRequestId_fkey" FOREIGN KEY ("labRequestId") REFERENCES "lab_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_up_recommendations" ADD CONSTRAINT "follow_up_recommendations_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_pharmacyOrderId_fkey" FOREIGN KEY ("pharmacyOrderId") REFERENCES "pharmacy_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "prescription_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_reminders" ADD CONSTRAINT "medicine_reminders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_reminder_logs" ADD CONSTRAINT "medicine_reminder_logs_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "medicine_reminders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_test_catalog" ADD CONSTRAINT "lab_test_catalog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_labRequestId_fkey" FOREIGN KEY ("labRequestId") REFERENCES "lab_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
