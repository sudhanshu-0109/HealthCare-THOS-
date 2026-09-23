-- Add ENDED value to OnlineSessionStatus enum
-- This separates "video call ended" from "consultation formally completed by doctor"

ALTER TYPE "OnlineSessionStatus" ADD VALUE IF NOT EXISTS 'ENDED';
