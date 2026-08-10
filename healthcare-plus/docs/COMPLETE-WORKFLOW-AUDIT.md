# COMPLETE WORKFLOW AUDIT (real vs simulated)

_The core principle: **every business state transition must flow through the real backend/DB/socket** — never a frontend timer, mock array, auto-progression, or local-only state flip. This document classifies each workflow as **REAL**, **SIMULATED**, or **MIXED**, with exact file:line evidence._

Legend: 🟢 REAL · 🔴 SIMULATED · 🟡 MIXED (real backend exists but frontend fakes part of it)

---

## 1. Patient → Doctor (appointment appears on doctor device)
**🟢 REAL.** Appointment created via backend; doctor dashboard fetches `/doctors/me` + queue; queue is socket-live (`useDoctorQueue.js`). Doctor "call patient" flows through `/queue/*` → server emits → patient `PatientQueueTracker` shows the call. No simulation.

## 2. Appointment booking + payment
**🟡 MIXED.**
- `DoctorBooking → RazorpayCheckout` is the **REAL** path: `/billing/pay` (or the appointment-initiate) → Razorpay (or mock) → `/payments/verify` → `verifyAndCompletePayment` marks `Bill` PAID and fires `onBillPaid('APPOINTMENT')` → appointment CONFIRMED. Correct.
- **But** the generic `PaymentModal` (used for the *other* payables) is a pure fake — see §7.

## 3. Doctor → Pharmacy (prescription → patient accepts → pharmacy order)
**🟡 MIXED.** Backend order lifecycle is real (`pharmacyOrders.service.js`; `onBillPaid('PHARMACY_ORDER')` confirms on payment). **But** the patient "pay for pharmacy order" UI in `HospitalWorkspace.jsx:377-386` uses the **fake `PaymentModal`** — it flips `paymentStatus:'PAID'` in local state only, never calls `/billing/pay`+`/verify`, so the DB order is never confirmed and no downstream progression fires. Payment must be re-wired to the real path.

## 4. Pharmacy fulfillment (Received → Prepare → Ready → Complete)
**🟢 REAL.** `pharmacy/Dashboard.jsx` fetches by status and advances only via `advancePharmacyOrderStatus(orderId, newStatus)` — manual, button-driven, no auto-progression. Matches `PharmacyOrderStatus`. Good.

## 5. Doctor → Lab (request → patient accepts → pay → lab → sample → report)
**🟡 MIXED — two defects.**
- **Patient pay** (`HospitalWorkspace.jsx:466-475`) uses the **fake `PaymentModal`** (local `status:'PAYMENT_COMPLETED'`), and the whole `LabTab` `STATUS_FLOW` (`:405`) invents statuses (`REQUESTED / PAYMENT_PENDING / PAYMENT_COMPLETED / SAMPLE_PENDING / SAMPLE_COLLECTED / TESTING / REPORT_READY`) that don't match `LabRequestStatus` (`PENDING / CONFIRMED / SAMPLE_COLLECTED / PROCESSING / COMPLETED / CANCELLED`). View/Download report buttons (`:448-454`) have no handler.
- **Lab staff advance** (`lab/Dashboard.jsx:210-223`) is a **frontend hack**: it fakes the `SAMPLE_COLLECTED` and `PROCESSING` transitions by calling `uploadLabReport({ reportFileUrl:'pending', resultSummary:'Status updated to: …' })`, because (per its own comment) "the backend only has confirm + upload-report." This writes junk report rows to advance status.
  - **Backend gap:** there is no clean status-advance endpoint for lab (sample-collected / processing). **Fix:** add real lab status-advance endpoints (mirroring pharmacy's `advanceStatus`) and call them; stop overloading `uploadReport`.

## 6. Emergency dispatch (SOS → driver phone → accept → patient sees → tracking)
**🟡 MIXED — backend REAL, patient UI SIMULATED.**
- Backend dispatch is fully real (`emergencyDispatch.service.js`): haversine nearest-driver, atomic claim, real state machine, real socket emits, 3-min server fallback.
- Driver dashboard is real (calls `/driver/*`, listens `emergency:new-request`).
- **Patient `EmergencyTracking.jsx` is 100% simulated** — no socket, `setTimeout` auto-progression (`:62-77`), wrong fetch path (`:35`), wrong status map (`:39-43`), fake ETA (`:174`), fake map (`:110-128`). This is the single largest simulation violation. Full detail in REALTIME-AUDIT §4 and GOOGLE-MAPS-INTEGRATION-PLAN.

## 7. Generic payment — `PaymentModal` (the central simulation, P1)
`components/common/PaymentModal.jsx:20-27`:
```js
const handlePay = async () => {
  setPaying(true);
  await new Promise((r) => setTimeout(r, 1800));  // fake gateway delay
  setPaid(true);
  await new Promise((r) => setTimeout(r, 800));
  onSuccess();                                     // <-- no backend call, ever
};
```
Every caller's `onSuccess` only mutates **local React state**:

| Caller | onSuccess effect | Real effect on DB |
|---|---|---|
| `patient/Dashboard.jsx:687` (Billing) | `setBills(... 'PAID')` | none — reverts on refresh |
| `HospitalWorkspace.jsx:381` (Pharmacy) | `setOrders(... paymentStatus:'PAID')` | none — order never confirmed |
| `HospitalWorkspace.jsx:470` (Lab) | `setRequests(... 'PAYMENT_COMPLETED')` | none — invented status |
| `HospitalWorkspace.jsx:538` (Billing) | `setBills(... 'PAID')` | none |

**Fix:** replace `PaymentModal` usages with the real initiate→checkout→verify flow. The backend already supports paying **any** UNPAID bill/source: `POST /billing/pay` returns `{ billId, razorpayOrderId, amount, keyId, isMock }`; feed that into a Razorpay-checkout component (the existing `RazorpayCheckout` is the model); on success call `/billing/verify` (or `/payments/verify`). This marks the `Bill` PAID **and** fires `onBillPaid`, which performs the real pharmacy/lab/appointment progression. Then re-fetch from the backend rather than flipping local state. `patient/Billing.jsx` (a complete dead file) already does the real Razorpay flow and can be the pattern.

## 8. Frontend timers inventory (setInterval/setTimeout)
Not all timers are violations. Classification:

| Location | Purpose | Verdict |
|---|---|---|
| `EmergencyTracking.jsx:67,81` | **fake stage progression** + elapsed clock | 🔴 progression must be deleted (elapsed clock OK) |
| `PaymentModal.jsx:23,25` | **fake payment delay** | 🔴 remove with the modal |
| `RazorpayCheckout.jsx:52` | slot-hold countdown (display) | 🟢 fine |
| `RazorpayCheckout.jsx:90` | mock-mode delay before hitting **real** `/verify` | 🟢 acceptable in mock mode |
| `IncomingRequestModal.jsx:12` | accept-countdown display | 🟢 fine |
| `PatientQueueTracker.jsx:38` | clear "called" banner after 30s (display) | 🟢 fine |
| `patient/Dashboard.jsx:63` | SOS press-and-hold progress | 🟢 fine (UX gesture) |
| `useDebounce.js`, `Register/ForgotPassword` resend timers, `*/showSuccess` toasts | display/UX | 🟢 fine |

## 9. Mock business data inventory
| Location | Item | Action |
|---|---|---|
| `admin/Dashboard.jsx:432` | `MOCK_MEDICINES` (undefined) | 🔴 crash — replace with `[]` / real fetch |
| `admin/Dashboard.jsx:151-156` | `ACTIVITIES` mock array (defined, never rendered) | remove dead code |
| `admin/Dashboard.jsx:146-148` | duplicate "Departments" stat | fix stat |
| `admin/Dashboard.jsx:436-439` | `MedicinesTab.handleAdd` optimistic local-only add | wire to a service or remove |
| `admin/Dashboard.jsx:562-570` | `SettingsTab` hardcodes "Apollo Hospitals"; Save flips a flag | persist or remove |
| `RazorpayCheckout.jsx:68-69,91` | `mock_payment_*` / `mock_signature` | acceptable **only** in mock mode; real once keys set |

---

## 10. Summary — what must change to satisfy "no simulation"
1. **Delete `EmergencyTracking` timer progression; wire real sockets** (biggest).
2. **Replace `PaymentModal` with the real billing flow** for pharmacy/lab/bill payments; re-fetch from backend after verify.
3. **Add real lab status-advance endpoints;** stop faking transitions via `uploadReport`.
4. **Fix invented statuses** in `HospitalWorkspace` LabTab to match `LabRequestStatus`.
5. **Remove `MOCK_MEDICINES` crash and admin mock arrays.**
6. Keep the genuinely real workflows (doctor queue, pharmacy fulfillment, driver side, appointment-booking Razorpay path) untouched.
