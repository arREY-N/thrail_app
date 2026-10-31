/**
 * Resolves the actor (`actorId` and `actorType`) responsible for a Firestore
 * write event.
 *
 * Resolution priority:
 *  1. Document-level `_actor` stamp (for Cloud Functions / webhooks writing on
 *     behalf of an end user). Trusted on `create`, or on `update` when
 *     `_actorAt` or `_actor` changed in the same write.
 *  2. Eventarc / Cloud Functions v2 `authId` when the principal is an
 *     authenticated end user (not a service account or system principal).
 *  3. Fallback to `{ actorId: "system", actorType: "system" }`.
 */

const { valuesEqual } = require("./auditDiff");

/**
 * Checks whether an `authId` / `authType` pair represents a service account or
 * internal system principal rather than an end user.
 *
 * @param {string|undefined} authType
 * @param {string|undefined} authId
 * @return {boolean}
 */
function isSystemOrServicePrincipal(authType, authId) {
  if (
    authType === "service_account" ||
    authType === "system" ||
    authType === "unauthenticated"
  ) {
    return true;
  }

  if (!authId || typeof authId !== "string") {
    return true;
  }

  const normalized = authId.trim().toLowerCase();
  if (
    normalized === "" ||
    normalized === "system" ||
    normalized === "unknown" ||
    normalized === "unauthenticated" ||
    normalized.endsWith(".gserviceaccount.com") ||
    normalized.startsWith("serviceaccount:") ||
    normalized.startsWith("system:") ||
      normalized.startsWith("api_key:")
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts a clean Firebase Auth UID from `event.authId` if formatted as a URI
 * or principal string, or returns the raw UID.
 *
 * @param {string} authId
 * @return {string}
 */
function extractUidFromAuthId(authId) {
  const trimmed = authId.trim();
  // Handle possible formats like "uid=abc" or ".../users/abc"
  const uidMatch = trimmed.match(/(?:^|[/=])users\/([^/]+)$/);
  if (uidMatch && uidMatch[1]) {
    return uidMatch[1];
  }
  return trimmed;
}

/**
 * Determines whether the `_actor` field on `afterData` was freshly stamped in
 * the current write operation.
 *
 * @param {"create"|"update"|"delete"} operation
 * @param {object|null} beforeData
 * @param {object|null} afterData
 * @return {string|null}
 */
function getFreshDocumentActor(operation, beforeData, afterData) {
  if (operation === "delete") {
    return null;
  }

  const candidate = afterData && afterData._actor;
  if (typeof candidate !== "string" || candidate.trim() === "") {
    return null;
  }

  const actor = candidate.trim();
  if (operation === "create") {
    return actor;
  }

  const beforeActor = beforeData ? beforeData._actor : undefined;
  const beforeActorAt = beforeData ? beforeData._actorAt : undefined;
  const afterActorAt = afterData ? afterData._actorAt : undefined;

  const actorChanged = beforeActor !== actor;
  const actorTimestampChanged =
    afterActorAt !== undefined && !valuesEqual(beforeActorAt, afterActorAt);

  if (actorChanged || actorTimestampChanged) {
    return actor;
  }

  return null;
}

/**
 * Resolves the actor for a Firestore write event.
 *
 * @param {object} event - Cloud Functions v2 FirestoreAuthEvent
 * @param {"create"|"update"|"delete"} operation
 * @param {object|null} beforeData
 * @param {object|null} afterData
 * @return {{
 *   actorId: string,
 *   actorType: "user"|"system",
 *   authSource: "document_stamp"|"auth_context"|"fallback"
 * }}
 */
function resolveActor(event, operation, beforeData, afterData) {
  // 1. Check for a fresh `_actor` stamp from a server-side function/webhook.
  const stampedActor = getFreshDocumentActor(operation, beforeData, afterData);
  if (stampedActor) {
    const isSystemStamp = stampedActor === "system" ||
      stampedActor.startsWith("system:");
    return {
      actorId: stampedActor,
      actorType: isSystemStamp ? "system" : "user",
      authSource: "document_stamp",
    };
  }

  // 2. Check CloudEvent auth context (populated for direct client writes).
  const authType = event ? event.authType : undefined;
  const authId = event ? event.authId : undefined;

  if (!isSystemOrServicePrincipal(authType, authId)) {
    const uid = extractUidFromAuthId(authId);
    if (uid) {
      return {
        actorId: uid,
        actorType: "user",
        authSource: "auth_context",
      };
    }
  }

  // 3. Default fallback for Admin SDK, console, or unattributed writes.
  return {
    actorId: "system",
    actorType: "system",
    authSource: "fallback",
  };
}

module.exports = {
  resolveActor,
  isSystemOrServicePrincipal,
  extractUidFromAuthId,
  getFreshDocumentActor,
};

