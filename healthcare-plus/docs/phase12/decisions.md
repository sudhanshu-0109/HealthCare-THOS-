# Phase 12 Decision Log — Unified Billing System

## 1. Single Shared Payment Path Architecture
- **Decision:** All payable transactions (appointments, pharmacy orders, lab requests) MUST route through `billing.service.js#createBillAndInitiatePayment` and `verifyAndCompletePayment`.
- **Rationale:** Prevents fragmentation across services, guarantees uniform signature verification, and creates an audit-compliant financial ledger (`Bill` + `BillItem` + `Payment`).

## 2. Deprecation of Direct Payment-Appointment & Payment-Order Relations
- **Decision:** The `Payment.appointmentId` column was removed and replaced with `Payment.billId`.
- **Status Fields:** `PharmacyOrder.isPaid` and `LabRequest.isPaid` are retained in the schema for legacy backward compatibility but marked DEPRECATED; application code checks `Bill.status === 'PAID'` as the source of truth.

## 3. Webhook Sentinel Handling
- **Decision:** The Razorpay webhook passes `razorpaySignature: 'webhook-verified'` to `billing.service.js#verifyAndCompletePayment`.
- **Rationale:** Allows asynchronous payment reconciliation for browser disconnects without requiring HMAC re-computation inside the webhook worker.
