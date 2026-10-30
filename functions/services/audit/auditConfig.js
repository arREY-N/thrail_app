/**
 * Central configuration registry for Firestore collections audited by the
 * server-side audit trail module.
 *
 * Each entry defines:
 *  - collection:    Logical collection identifier stored in `auditLogs`.
 *  - documentPath:  Firestore trigger pattern (used by v2 triggers).
 *  - docIdParam:    Wildcard parameter name for the target document ID.
 *  - allowedFields: Dot-notation field paths safe to store in `snapshot`
 *                   (for create/delete) and `changes` (for update).
 *  - ignoredFields: Dot-notation field paths that are noisy/bookkeeping
 *                   (e.g. `updatedAt`, `profile`, `general.rating`). If an
 *                   update only modifies ignored fields, no audit log is
 *                   written.
 */

const AUDIT_COLLECTION = "auditLogs";
const DEFAULT_AUDIT_REGION = "asia-southeast1";

const GLOBAL_IGNORED_FIELDS = [
  "createdAt",
  "updatedAt",
  "_actor",
  "_actorAt",
];

const AUDIT_CONFIG = {
  trails: {
    collection: "trails",
    documentPath: "trails/{trailId}",
    docIdParam: "trailId",
    allowedFields: [
      "id",
      // General section
      "general.active",
      "general.name",
      "general.address",
      "general.province",
      "general.mountain",
      "general.description",
      "general.critical_info",
      "general.guidelines",
      "general.safety_tips",
      "general.lgu_rules",
      // Geography section
      "geography.masl",
      "geography.start",
      "geography.end",
      "geography.geoJsonPath",
      // Difficulty section
      "difficulty.classification",
      "difficulty.lascoRating",
      "difficulty.length",
      "difficulty.gain",
      "difficulty.slope",
      "difficulty.obstacles",
      "difficulty.hours",
      "difficulty.circularity",
      "difficulty.quality",
      "difficulty.difficulty_points",
      "difficulty.elevation",
      // Description section
      "description.classificationDescription",
      "description.lascoRatingDescription",
      // Tourism section
      "tourism.shelter",
      "tourism.resting",
      "tourism.information_board",
      "tourism.clean_water",
      "tourism.river",
      "tourism.lake",
      "tourism.waterfall",
      "tourism.monument",
      "tourism.community",
      "tourism.viewpoint",
      "tourism.network_connection",
      // Media & map pins
      "coverImage",
      "routeMapImage",
      "offlinePoints",
    ],
    ignoredFields: [
      ...GLOBAL_IGNORED_FIELDS,
      "profile",
      "general.rating",
      "general.reviewCount",
    ],
  },
};

/**
 * Retrieves the audit configuration for a given collection key.
 *
 * @param {string} configKey
 * @return {object}
 */
function getAuditConfig(configKey) {
  const config = AUDIT_CONFIG[configKey];
  if (!config) {
    throw new Error(`[AuditConfig] Unknown audit config key: "${configKey}"`);
  }
  return config;
}

module.exports = {
  AUDIT_COLLECTION,
  DEFAULT_AUDIT_REGION,
  GLOBAL_IGNORED_FIELDS,
  AUDIT_CONFIG,
  getAuditConfig,
};

