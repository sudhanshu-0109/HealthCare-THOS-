# Phase 15 — Notifications & System Integration: Decision Log

## Decision 1: Email Delivery Subset

**Decision**: Send transactional email for exactly 4 event types; all others are in-app only.

**Qualifying types**:
- `APPOINTMENT_CONFIRMED` — patient needs to know even if they close the app
- `PAYMENT_RESULT` — especially for failures; patient may not be watching the UI
- `LAB_REPORT_READY` — report is actionable and may be time-sensitive
- `PASSPORT_ACCESS_CHANGED` — security event; patient must know

**Excluded types** (in-app only):
- `QUEUE_YOUR_TURN`, `QUEUE_YOUR_TURN_APPROACHING` — time-sensitive; email is too slow
- `CONSULTATION_COMPLETED` — patient is present; in-app notification is sufficient
- `PHARMACY_ORDER_UPDATE` — polled frequently; email would be noisy (multiple status transitions)
- `BILL_GENERATED` — patient will see this when they go to pay

**Rationale**: Email-every-event = notification fatigue and spam filters. Email-zero-events = invisible to offline users. The 4-type subset is the minimum set needed to bridge the offline gap for high-stakes events.

---

## Decision 2: Server-Authoritative Socket Events

**Decision**: `notification:new` is **emitted by the server only**. The client never emits notification mutations over Socket.IO.

**Rationale**: Phase 6's architecture rule — "Clients call REST endpoints → server updates DB → server emits events." Notifications follow the same pattern. This prevents notification spoofing and ensures every notification has a DB record.

---

## Decision 3: User Room Naming

**Decision**: Personal notification rooms are `user:{userId}` (not `patient:{userId}`).

**Rationale**: Notifications are multi-role (doctors, pharmacists, admins also receive notifications). The `patient:{userId}` room (from Phase 6) is kept for backward compatibility with queue events but the new `user:{userId}` room is used for Phase 15 notification delivery.

---

## Decision 4: Approaching Queue Notification Threshold

**Decision**: Notify a patient "approaching" when they are the **2nd patient in the remaining WAITING queue** after the doctor calls a patient (i.e., 2 spots away from being called).

**Rationale**: At 10 mins/consultation average, 2 spots = ~20 minutes. Enough lead time to return to the waiting area without being overly early.

---

## Decision 5: Typed Helper Functions vs. Raw `notify()`

**Decision**: All call sites use typed helpers (`notifyAppointmentConfirmed`, `notifyPharmacyStatusChanged`, etc.) instead of raw `notify()`.

**Rationale**: Canonical message shape is enforced at the helper level. Call sites cannot accidentally produce malformed notifications. Helpers are auditable — if a notification message needs to change, there is exactly one place to change it.

---

## Decision 6: Best-Effort Wrapping

**Decision**: All notification calls are wrapped in `try/catch` and tagged as fire-and-forget. Notification failure never propagates into the core business flow.

**Rationale**: The payment confirmation, appointment booking, and queue management flows are primary. Notifications are secondary. A notification failure must never cause a payment to appear failed or an appointment to appear un-confirmed.
