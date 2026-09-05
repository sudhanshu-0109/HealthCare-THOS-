-- Migration: add_last_driver_location
-- Adds lastDriverLat / lastDriverLng to emergency_requests so that the latest
-- ambulance GPS position is persisted in the DB.  This allows a refreshing
-- patient to recover the ambulance position without the driver being live on socket.

ALTER TABLE "emergency_requests"
  ADD COLUMN IF NOT EXISTS "lastDriverLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lastDriverLng" DOUBLE PRECISION;
