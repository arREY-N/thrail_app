# Firestore Audit Trail System — Architecture & Implementation Guide

## 1. Overview & Goals

The Audit Trail system provides a server-side, tamper-proof record of `create`, `update`, and `delete` operations on critical Firestore collections in the Thrail app.

### Key Design Requirements
- **Server-Side Integrity:** Audit logs are written exclusively by Cloud Functions (2nd Gen) via the Firebase Admin SDK into the top-level `auditLogs` collection. Clients cannot create, modify, or delete audit records.
- **Minimal Codebase Disruption:** Retains direct client-to-Firestore writes where they already exist by using Cloud Functions v2 Firestore triggers (`onDocumentWrittenWithAuthContext`) in `asia-southeast1`.
- **Data Privacy & Redaction:**
  - **Create / Delete:** Stores only an explicit allowlist of non-confidential key fields (`snapshot`).
  - **Update:** Stores a `{ from, to }` diff (`changes`) for allowlisted fields only, and records only the *field names* (`redactedChanges`) when non-allowlisted fields change—never their values.
  - **Noisy Update Filtering:** Skips writing an audit record when an update only modifies bookkeeping or automated fields (e.g., `updatedAt`, `createdAt`, `profile`, `general.rating`, `general.reviewCount`).
- **Idempotency:** Uses the Eventarc `event.id` as the document ID (`auditLogs/{event.id}`) so function retries overwrite the same document instead of creating duplicate entries.
- **Superadmin Access Control:** Only authenticated users with the custom claim `role == 'superadmin'` can read `auditLogs`.

### Target Collections Scope
- **Implemented (Phase 1–4):**
  - `trails/{trailId}`
- **Planned Next Rollouts:**
  - `users/{userId}`
  - `payments/{paymentId}`
  - `businesses/{businessId}`
  - `businesses/{businessId}/offers/{offerId}`
  - `businesses/{businessId}/cancellations/{cancellationId}`
  - `businesses/{businessId}/admins/{adminId}`
  - `businesses/{businessId}/reschedules/{rescheduleId}`
- **Intentionally Excluded:**
  - `reviews`, `messages`

---

## 2. Architecture & File Structure

All server-side audit logic lives under `functions/services/audit/` (CommonJS, Node 22, `firebase-functions` v7):

```text
functions/
 ├─ services/
 │   └─ audit/
 │       ├─ auditConfig.js     # Collection registry, allowedFields & ignoredFields
 │       ├─ auditDiff.js       # Value normalization, snapshot extraction, dot-path diffing
 │       ├─ actorResolver.js   # Actor resolution (_actor stamp -> Eventarc authId -> "system")
 │       ├─ writeAuditLog.js   # Idempotent Firestore writer & createAuditTrigger() factory
 │       ├─ trailsAudit.js     # Trails-specific trigger & metadata extractor
 │       └─ index.js           # Barrel export
 ├─ __tests__/
 │   └─ auditTrails.test.js    # Jest unit test suite for the audit engine & trails trigger
 └─ index.js                   # Exports `auditTrails` Cloud Function
```

---

## 3. Audit Log Document Schema (`auditLogs/{eventId}`)

Each document written to `auditLogs` has the following structure:

```json
{
  "operation": "create | update | delete",
  "collection": "trails",
  "docId": "trail_batulao",
  "path": "trails/trail_batulao",
  "actorId": "<uid> | system",
  "actorType": "user | system",
  "authSource": "document_stamp | auth_context | fallback",
  "rawAuthType": "unknown | api_key | service_account | system | unauthenticated | null",
  "rawAuthId": "<raw Eventarc authId or null>",
  "snapshot": {
    "general.name": "Mt. Batulao",
    "geography.masl": 811
  },
  "changes": {
    "general.name": {
      "from": "Mt. Batulao",
      "to": "Mt. Batulao (New Trail)"
    }
  },
  "redactedChanges": ["someConfidentialField"],
  "metadata": {
    "trailName": "Mt. Batulao (New Trail)",
    "province": ["Batangas"]
  },
  "eventTime": "2026-10-30T02:00:00Z",
  "timestamp": "<Firestore ServerTimestamp>"
}
```

- On **`create`** and **`delete`**: `snapshot` contains the allowlisted dot-path fields; `changes` is `null`.
- On **`update`**: `changes` contains `{ from, to }` for modified allowlisted fields; `snapshot` is `null`.

---

## 4. Step-by-Step Implementation Log

### Step 1: Reusable Audit Configuration (`functions/services/audit/auditConfig.js`)
1. Defined `AUDIT_COLLECTION = "auditLogs"` and `DEFAULT_AUDIT_REGION = "asia-southeast1"` (matching the Firestore database region in `firebase.json`).
2. Defined `GLOBAL_IGNORED_FIELDS = ["createdAt", "updatedAt", "_actor", "_actorAt"]`.
3. Created `AUDIT_CONFIG.trails` with dot-notation field paths matching `ITrailDB` (`src/core/models/Trail/interfaces/Trail.types.ts`):
   - **Allowed fields:** `id`, `general.*` (`active`, `name`, `address`, `province`, `mountain`, `description`, `critical_info`, `guidelines`, `safety_tips`, `lgu_rules`), `geography.*` (`masl`, `start`, `end`, `geoJsonPath`), `difficulty.*` (`classification`, `lascoRating`, `length`, `gain`, `slope`, `obstacles`, `hours`, `circularity`, `quality`, `difficulty_points`, `elevation`), `description.*`, `tourism.*`, `coverImage`, `routeMapImage`, `offlinePoints`.
   - **Ignored fields:** `createdAt`, `updatedAt`, `_actor`, `_actorAt`, `profile` (THARESYS batch normalization vector), `general.rating`, and `general.reviewCount` (automated review recalculations).

### Step 2: Snapshot & Diff Builder (`functions/services/audit/auditDiff.js`)
1. Built `normalizeValue(value)` to convert Firestore `Timestamp` instances to ISO strings and `GeoPoint` instances to `{ latitude, longitude }` objects, and to sort object keys deterministically.
2. Built `getByPath(obj, dotPath)` and `valuesEqual(a, b)` to read and compare nested fields using dot notation.
3. Built `extractAllowedSnapshot(data, allowedFields)` to pull only allowlisted fields on `create` and `delete`.
4. Built `buildDiff(beforeData, afterData, allowedFields, ignoredFields)`:
   - Computes `{ from, to }` entries in `changes` for allowlisted fields that changed.
   - Walks remaining fields to detect changes in non-allowlisted, non-ignored fields and records only their path names in `redactedChanges`.
   - Returns `hasMeaningfulChanges: false` when only `ignoredFields` changed so noisy updates are skipped.

### Step 3: Actor Resolution (`functions/services/audit/actorResolver.js`)
Implemented `resolveActor(event, operation, beforeData, afterData)` with a 3-tier priority order:
1. **Fresh Document Stamp (`_actor` / `_actorAt`):**
   - Used when a backend Cloud Function or webhook writes on behalf of an end user (or when stamped by the client and verified by security rules).
   - Trusted on `create`, or on `update` only when `_actor` or `_actorAt` changed in the same write (preventing a stale `_actor` from an earlier write from being misattributed).
2. **Eventarc Auth Context (`event.authType` & `event.authId`):**
   - Extracted from `onDocumentWrittenWithAuthContext`.
   - Filters out service accounts (`*.gserviceaccount.com`, `service_account`), `system`, and `unauthenticated` principals.
   - Records `rawAuthType` and `rawAuthId` on the audit document for observability.
3. **System Fallback:**
   - Defaults to `{ actorId: "system", actorType: "system", authSource: "fallback" }` for Admin SDK batch jobs, console edits, or unattributed writes.

### Step 4: Core Writer & Trigger Factory (`functions/services/audit/writeAuditLog.js`)
1. Implemented `writeAuditLog(auditRecord, dbInstance)` writing to `auditLogs/{event.id}`.
2. Implemented `processAuditEvent(event, configKey, options)` supporting optional hooks:
   - `options.shouldSkip(event, context)` — for collection-specific skip rules (such as skipping subcollection deletes when a parent `businesses/{businessId}` document is cascade-deleted).
   - `options.buildExtraMetadata(event, context)` — for attaching display metadata to the audit record.
3. Implemented `createAuditTrigger(configKey, options)` wrapping `onDocumentWrittenWithAuthContext` with `region: "asia-southeast1"` and `retry: true`.

### Step 5: Trails Audit Trigger (`functions/services/audit/trailsAudit.js` & `functions/index.js`)
1. Created `trailsAudit.js` using `createAuditTrigger("trails", { buildExtraMetadata: buildTrailAuditMetadata })`.
2. `buildTrailAuditMetadata` attaches `{ trailName, province }` from `afterData` (or `beforeData` on delete) so the SuperAdmin UI can always display which trail was changed.
3. Exported `exports.auditTrails = auditTrails` from `functions/index.js`.

### Step 6: Security Rules & Composite Indexes (`firestore.rules` & `firestore.indexes.json`)
1. Added `/auditLogs/{logId}` to `firestore.rules`:
   ```cel
   match /auditLogs/{logId} {
       allow read: if request.auth != null && request.auth.token.role == 'superadmin';
       allow write: if false;
   }
   ```
2. Added composite indexes in `firestore.indexes.json` for `auditLogs`:
   - `collection` (ASC) + `timestamp` (DESC)
   - `actorId` (ASC) + `timestamp` (DESC)
   - `operation` (ASC) + `timestamp` (DESC)
   - `collection` (ASC) + `docId` (ASC) + `timestamp` (DESC)

### Step 7: Automated Testing & Deployment (`functions/__tests__/auditTrails.test.js`)
1. Created unit tests covering `create`, `update`, noisy update skipping, `delete`, actor resolution (service account, fresh `_actor`, stale `_actor`), and retry idempotency.
2. Verified all tests pass via `npm --prefix functions test` and lint passes via `npx --prefix functions eslint functions/services/audit functions/__tests__/auditTrails.test.js`.
3. Deployed `auditTrails` to `asia-southeast1`:
   - Note: On the first 2nd-gen trigger deployment, Google Cloud provisions the Eventarc Service Agent (`service-<PROJECT_NUMBER>@gcp-sa-eventarc.iam.gserviceaccount.com`), which takes 2–5 minutes to propagate before `firebase deploy --only functions:auditTrails` succeeds.
   - Set the Artifact Registry container cleanup policy in `asia-southeast1` to `1` day.

---

## 5. How to Add the Next Audited Collection

Adding a new collection (e.g., `users`, `payments`, `businesses`, or `businesses/{businessId}/offers`) requires only 3 steps:

1. **Register the collection in `functions/services/audit/auditConfig.js`:**
   ```js
   offers: {
     collection: "businesses/offers",
     documentPath: "businesses/{businessId}/offers/{offerId}",
     docIdParam: "offerId",
     allowedFields: ["id", "date", "price", "slots", "status", "trail.id", "trail.name"],
     ignoredFields: [...GLOBAL_IGNORED_FIELDS],
   }
   ```
2. **Create or register the trigger using `createAuditTrigger("offers", options)`:**
   - For subcollections under `businesses/{businessId}`, pass a `shouldSkip` hook that checks if `businesses/{businessId}` still exists on `delete` so cascade deletes only log the parent business deletion.
3. **Export the trigger in `functions/index.js` and deploy:**
   ```powershell
   firebase deploy --only functions:<triggerName>
   ```

