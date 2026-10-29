/**
 * Core writer and trigger factory for Firestore audit logs.
 *
 * Writes normalized audit entries to `auditLogs/{eventId}` so retries are
 * idempotent, and provides `createAuditTrigger(configKey, options)` so each
 * audited collection only needs a small configuration and trigger registration.
 */

const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const {
  onDocumentWrittenWithAuthContext,
} = require("firebase-functions/v2/firestore");

const {
  AUDIT_COLLECTION,
  DEFAULT_AUDIT_REGION,
  getAuditConfig,
} = require("./auditConfig");
const { extractAllowedSnapshot, buildDiff } = require("./auditDiff");
const { resolveActor } = require("./actorResolver");

/**
 * Determines the CRUD operation type from before/after snapshots.
 *
 * @param {object|undefined} beforeSnap
 * @param {object|undefined} afterSnap
 * @return {"create"|"update"|"delete"|null}
 */
function detectOperation(beforeSnap, afterSnap) {
  const beforeExists = Boolean(beforeSnap && beforeSnap.exists);
  const afterExists = Boolean(afterSnap && afterSnap.exists);

  if (!beforeExists && afterExists) return "create";
  if (beforeExists && afterExists) return "update";
  if (beforeExists && !afterExists) return "delete";
  return null;
}

/**
 * Writes a single audit record to `auditLogs/{eventId}`.
 *
 * @param {object} auditRecord
 * @param {FirebaseFirestore.Firestore} [dbInstance]
 * @return {Promise<void>}
 */
async function writeAuditLog(auditRecord, dbInstance) {
  const db = dbInstance || admin.firestore();
  const { eventId, ...payload } = auditRecord;

  const docRef = eventId
    ? db.collection(AUDIT_COLLECTION).doc(String(eventId))
    : db.collection(AUDIT_COLLECTION).doc();

  await docRef.set({
    ...payload,
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Processes a raw Cloud Functions v2 `FirestoreAuthEvent` for a configured
 * collection and writes the resulting audit record if applicable.
 *
 * @param {object} event - v2 FirestoreAuthEvent
 * @param {string} configKey - Key in `AUDIT_CONFIG` (e.g. "trails")
 * @param {object} [options]
 * @param {FirebaseFirestore.Firestore} [options.db]
 * @param {function(object, object): Promise<boolean>|boolean} [options.shouldSkip]
 * @param {function(object, object): object} [options.buildExtraMetadata]
 * @return {Promise<{written: boolean, reason?: string, auditRecord?: object}>}
 */
async function processAuditEvent(event, configKey, options = {}) {
  const config = getAuditConfig(configKey);
  const change = event && event.data;
  if (!change) {
    return { written: false, reason: "missing_event_data" };
  }

  const beforeSnap = change.before;
  const afterSnap = change.after;
  const operation = detectOperation(beforeSnap, afterSnap);

  if (!operation) {
    return { written: false, reason: "noop_snapshot" };
  }

  const beforeData = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
  const afterData = afterSnap && afterSnap.exists ? afterSnap.data() : null;

  // Allow collection-specific skip logic (e.g. parent business cascade delete).
  if (typeof options.shouldSkip === "function") {
    const skip = await options.shouldSkip(event, {
      operation,
      beforeData,
      afterData,
      config,
    });
    if (skip) {
      return { written: false, reason: "custom_skip" };
    }
  }

  let snapshot = null;
  let changes = null;
  let redactedChanges = [];

  if (operation === "create") {
    snapshot = extractAllowedSnapshot(afterData, config.allowedFields);
  } else if (operation === "delete") {
    snapshot = extractAllowedSnapshot(beforeData, config.allowedFields);
  } else {
    const diffResult = buildDiff(
      beforeData,
      afterData,
      config.allowedFields,
      config.ignoredFields
    );

    if (!diffResult.hasMeaningfulChanges) {
      return { written: false, reason: "only_ignored_fields_changed" };
    }

    changes = diffResult.changes;
    redactedChanges = diffResult.redactedChanges;
  }

  const { actorId, actorType, authSource } = resolveActor(
    event,
    operation,
    beforeData,
    afterData
  );

  const params = (event && event.params) || {};
  const docId =
    (config.docIdParam && params[config.docIdParam]) ||
    (afterSnap && afterSnap.id) ||
    (beforeSnap && beforeSnap.id) ||
    "unknown";

  const documentPath =
    (event && event.document) ||
    `${config.collection}/${docId}`;

  const extraMetadata =
    typeof options.buildExtraMetadata === "function"
      ? options.buildExtraMetadata(event, {
          operation,
          beforeData,
          afterData,
          config,
        })
      : null;

  const auditRecord = {
    eventId: event && event.id ? String(event.id) : null,
    operation,
    collection: config.collection,
    docId: String(docId),
    path: documentPath,
    actorId,
    actorType,
    authSource,
    rawAuthType: (event && event.authType) || null,
    rawAuthId: (event && event.authId) || null,
    snapshot,
    changes,
    redactedChanges,
    eventTime: (event && event.time) || null,
    ...(params.businessId ? { businessId: String(params.businessId) } : {}),
    ...(extraMetadata ? { metadata: extraMetadata } : {}),
  };

  await writeAuditLog(auditRecord, options.db);

  return {
    written: true,
    auditRecord,
  };
}

/**
 * Factory that creates a Cloud Functions v2 `onDocumentWrittenWithAuthContext`
 * trigger for the specified `configKey`.
 *
 * @param {string} configKey - Key in `AUDIT_CONFIG`
 * @param {object} [options] - Optional trigger and processing overrides
 * @return {import("firebase-functions/v2").CloudFunction}
 */
function createAuditTrigger(configKey, options = {}) {
  const config = getAuditConfig(configKey);
  const triggerOptions = {
    document: config.documentPath,
    region: options.region || DEFAULT_AUDIT_REGION,
    retry: options.retry !== undefined ? options.retry : true,
  };

  return onDocumentWrittenWithAuthContext(triggerOptions, async (event) => {
    try {
      await processAuditEvent(event, configKey, options);
    } catch (error) {
      logger.error(
        `[AuditTrigger:${configKey}] Failed to write audit log for event ${
          event && event.id
        }:`,
        error
      );
      throw error;
    }
  });
}

module.exports = {
  detectOperation,
  writeAuditLog,
  processAuditEvent,
  createAuditTrigger,
};

