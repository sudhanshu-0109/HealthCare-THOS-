-- Migration: 20260905092414_add_reached_patient_pickup_confirmation_states
-- Adds REACHED_PATIENT and PICKUP_PENDING_CONFIRMATION to EmergencyStatus enum.
-- Adds reachedPatientAt and pickupConfirmedAt timestamp columns to emergency_requests.

-- Step 1: Alter the EmergencyStatus enum to add new values.
ALTER TYPE "EmergencyStatus" ADD VALUE IF NOT EXISTS 'REACHED_PATIENT' BEFORE 'PICKED_UP';
ALTER TYPE "EmergencyStatus" ADD VALUE IF NOT EXISTS 'PICKUP_PENDING_CONFIRMATION' BEFORE 'PICKED_UP';

-- Step 2: Add the new timestamp columns to emergency_requests.
ALTER TABLE "emergency_requests"
  ADD COLUMN IF NOT EXISTS "reachedPatientAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pickupConfirmedAt" TIMESTAMP(3);
