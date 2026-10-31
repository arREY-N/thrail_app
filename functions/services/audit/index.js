/**
 * Barrel export for the reusable Firestore audit trail library.
 */

const {
  AUDIT_COLLECTION,
  DEFAULT_AUDIT_REGION,
  GLOBAL_IGNORED_FIELDS,
  AUDIT_CONFIG,
  getAuditConfig,
} = require("./auditConfig");
const {
  normalizeValue,
  getByPath,
  valuesEqual,
  extractAllowedSnapshot,
  buildDiff,
} = require("./auditDiff");
const {
  resolveActor,
  isSystemOrServicePrincipal,
  extractUidFromAuthId,
  getFreshDocumentActor,
} = require("./actorResolver");
const {
  detectOperation,
  writeAuditLog,
  processAuditEvent,
  createAuditTrigger,
} = require("./writeAuditLog");
const {
  auditTrails,
  buildTrailAuditMetadata,
} = require("./trailsAudit");

module.exports = {
  AUDIT_COLLECTION,
  DEFAULT_AUDIT_REGION,
  GLOBAL_IGNORED_FIELDS,
  AUDIT_CONFIG,
  getAuditConfig,
  normalizeValue,
  getByPath,
  valuesEqual,
  extractAllowedSnapshot,
  buildDiff,
  resolveActor,
  isSystemOrServicePrincipal,
  extractUidFromAuthId,
  getFreshDocumentActor,
  detectOperation,
  writeAuditLog,
  processAuditEvent,
  createAuditTrigger,
  auditTrails,
  buildTrailAuditMetadata,
};

