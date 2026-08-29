-- Phase 17: Add granular Lab + Pharmacy notification types to NotificationType enum.
-- These 6 new values enable fine-grained patient alerts at every stage of the
-- lab test and pharmacy order fulfillment workflows.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LAB_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LAB_BILL_GENERATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LAB_SAMPLE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LAB_PROCESSING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PRESCRIPTION_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHARMACY_BILL_GENERATED';
