/**
 * Firestore v2 audit trigger specifically for the `trails` collection
 * (`trails/{trailId}`).
 *
 * Uses the shared audit engine (`createAuditTrigger`) configured via
 * `AUDIT_CONFIG.trails` and attaches trail-identifying metadata (`trailName`,
 * `province`) so the SuperAdmin UI can always display which trail was affected
 * even on partial updates or deletions.
 */

const { createAuditTrigger } = require("./writeAuditLog");
const { getByPath } = require("./auditDiff");

/**
 * Extracts lightweight display metadata for a trail write event.
 *
 * @param {object} _event
 * @param {object} context
 * @param {object|null} context.beforeData
 * @param {object|null} context.afterData
 * @return {object}
 */
function buildTrailAuditMetadata(_event, { beforeData, afterData }) {
  const trailName =
    getByPath(afterData, "general.name") ||
    getByPath(beforeData, "general.name") ||
    null;

  const province =
    getByPath(afterData, "general.province") ||
    getByPath(beforeData, "general.province") ||
    null;

  return {
    trailName,
    province: Array.isArray(province) ? province : null,
  };
}

const auditTrails = createAuditTrigger("trails", {
  buildExtraMetadata: buildTrailAuditMetadata,
});

module.exports = {
  auditTrails,
  buildTrailAuditMetadata,
};

