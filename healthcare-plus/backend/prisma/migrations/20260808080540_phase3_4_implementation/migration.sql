-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE', 'PICKED_UP', 'ARRIVED', 'CANCELLED', 'NO_DRIVER_FALLBACK');

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "averageRating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "qualification" TEXT;

-- AlterTable
ALTER TABLE "hospitals" ADD COLUMN     "averageRating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "specialities" TEXT[],
ADD COLUMN     "workingHoursClose" TEXT,
ADD COLUMN     "workingHoursOpen" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "city" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "bloodGroup" "BloodGroup",
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receptionists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receptionists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambulance_drivers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ambulance_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_token_key" ON "invite_tokens"("token");

-- CreateIndex
CREATE INDEX "invite_tokens_userId_idx" ON "invite_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "receptionists_userId_key" ON "receptionists"("userId");

-- CreateIndex
CREATE INDEX "receptionists_hospitalId_idx" ON "receptionists"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacists_userId_key" ON "pharmacists"("userId");

-- CreateIndex
CREATE INDEX "pharmacists_hospitalId_idx" ON "pharmacists"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_staff_userId_key" ON "lab_staff"("userId");

-- CreateIndex
CREATE INDEX "lab_staff_hospitalId_idx" ON "lab_staff"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "ambulance_drivers_userId_key" ON "ambulance_drivers"("userId");

-- CreateIndex
CREATE INDEX "ambulance_drivers_hospitalId_idx" ON "ambulance_drivers"("hospitalId");

-- CreateIndex
CREATE INDEX "emergency_requests_patientId_idx" ON "emergency_requests"("patientId");

-- CreateIndex
CREATE INDEX "emergency_requests_status_idx" ON "emergency_requests"("status");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptionists" ADD CONSTRAINT "receptionists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptionists" ADD CONSTRAINT "receptionists_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacists" ADD CONSTRAINT "pharmacists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacists" ADD CONSTRAINT "pharmacists_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_staff" ADD CONSTRAINT "lab_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_staff" ADD CONSTRAINT "lab_staff_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_drivers" ADD CONSTRAINT "ambulance_drivers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambulance_drivers" ADD CONSTRAINT "ambulance_drivers_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
