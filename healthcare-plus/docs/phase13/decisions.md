# Phase 13 Decision Log — Emergency SOS & Ambulance Dispatch

## 1. Intentional Cross-Hospital Dispatch Exception
- **Decision:** Emergency ambulance searching (`emergencyDispatch.service.js#dispatchRequest`) explicitly queries ALL online, active ambulances system-wide, ignoring `hospitalId` scoping.
- **Rationale:** Emergency life preservation transcends hospital organization boundaries. Finding the physically nearest available ambulance to an active SOS call takes absolute priority.

## 2. Driver Claim Race Condition Safety
- **Decision:** Driver claims use atomic SQL updates with `WHERE status = 'SEARCHING'`.
- **Rationale:** Ensures that if 5 nearby drivers attempt to claim an emergency simultaneously, exactly one succeeds (`count === 1`) and the remaining 4 receive a clear "No longer available" message (`count === 0`).

## 3. Fallback Mechanism (3-Minute Rule)
- **Decision:** If no driver claims an emergency request within 3 minutes (or if zero online ambulances exist at trigger time), the status automatically transitions to `NO_DRIVER_FALLBACK` and emits a notification to the patient.
- **Rationale:** Prevents patients from waiting indefinitely on a digital screen during critical medical events. Prominently displays "CALL 108 NOW" hotline CTA.
