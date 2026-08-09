# Phase 14 Decision Log — Hospital Administration & Analytics

## 1. Crowd Status Formula Replacement (Closing Phase 4 TODO)
- **Decision:** Replaced the mock placeholder formula in `hospitalSearch.service.js` with real queue-based load ratio calculation:
  - `ratio = waitingCount / max(activeDoctors, 1)`
  - `LOW` if ratio <= 2
  - `MODERATE` if ratio <= 5
  - `HIGH` otherwise
- **Rationale:** Fulfills the open TODO from Phase 4, providing accurate real-time hospital occupancy ratings to patients.

## 2. Audit Log Retrofit Discipline
- **Decision:** Added `recordAction(hospitalId, actorUserId, action, targetType, targetId, metadata)` to all administrative write operations.
- **Rationale:** Ensures complete auditability for compliance and security oversight.

## 3. Administrative Queue Force-Skip
- **Decision:** Hospital admins are granted override permission to force-skip queue tokens (`adminForceSkip`).
- **Rationale:** Provides operational recovery when patients leave or doctors encounter stuck tokens.
