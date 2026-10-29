/**
 * Snapshot extraction and diff utilities for Firestore audit logging.
 *
 * Supports dot-notation paths (e.g. "general.name", "difficulty.lascoRating"),
 * normalizes Firestore types (Timestamp, GeoPoint), and separates changes into:
 *  - `changes`:         Allowed fields that changed ({ from, to }).
 *  - `redactedChanges`: Disallowed/confidential fields that changed (field
 *                       names only, values omitted).
 *  - Ignored fields:    Bookkeeping or noisy fields that do not trigger an
 *                       audit entry on their own.
 */

/**
 * Checks whether a value is a Firestore Timestamp-like object.
 *
 * @param {*} value
 * @return {boolean}
 */
function isTimestampLike(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.toDate === "function" &&
      typeof value.toMillis === "function"
  );
}

/**
 * Checks whether a value is a Firestore GeoPoint-like object.
 *
 * @param {*} value
 * @return {boolean}
 */
function isGeoPointLike(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.latitude === "number" &&
      typeof value.longitude === "number" &&
      Object.keys(value).length <= 3
  );
}

/**
 * Normalizes Firestore values (Timestamps, GeoPoints, Arrays, nested Objects)
 * into serializable plain values suitable for storing in `auditLogs` and
 * deterministic equality comparison.
 *
 * @param {*} value
 * @return {*}
 */
function normalizeValue(value) {
  if (value === undefined) return null;
  if (value === null) return null;

  if (typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  if (isGeoPointLike(value)) {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  const normalized = {};
  const sortedKeys = Object.keys(value).sort();
  for (const key of sortedKeys) {
    if (value[key] !== undefined) {
      normalized[key] = normalizeValue(value[key]);
    }
  }
  return normalized;
}

/**
 * Reads a nested property from an object using a dot-separated path.
 *
 * @param {object|null|undefined} obj
 * @param {string} dotPath
 * @return {*}
 */
function getByPath(obj, dotPath) {
  if (!obj || typeof obj !== "object" || !dotPath) return undefined;
  const parts = dotPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Deep-compares two raw or normalized Firestore values.
 *
 * @param {*} a
 * @param {*} b
 * @return {boolean}
 */
function valuesEqual(a, b) {
  const normA = normalizeValue(a);
  const normB = normalizeValue(b);
  return JSON.stringify(normA) === JSON.stringify(normB);
}

/**
 * Checks whether `candidatePath` equals `rulePath` or is nested underneath it.
 *
 * @param {string} candidatePath
 * @param {string} rulePath
 * @return {boolean}
 */
function isPathMatchedOrChild(candidatePath, rulePath) {
  return (
    candidatePath === rulePath ||
    candidatePath.startsWith(`${rulePath}.`)
  );
}

/**
 * Checks whether a dot-path is covered by any entry in a list of paths.
 *
 * @param {string} path
 * @param {string[]} pathList
 * @return {boolean}
 */
function isPathInList(path, pathList) {
  return pathList.some((rulePath) => isPathMatchedOrChild(path, rulePath));
}

/**
 * Collects candidate dot-paths from an object up to configured stop-paths or
 * leaf values, so we can detect changes in fields that are NOT in
 * `allowedFields` or `ignoredFields`.
 *
 * @param {object} obj
 * @param {Set<string>} stopPaths
 * @param {string} [prefix]
 * @param {number} [depth]
 * @return {string[]}
 */
function collectCandidatePaths(obj, stopPaths, prefix = "", depth = 0) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  if (isTimestampLike(obj) || isGeoPointLike(obj) || obj instanceof Date) {
    return prefix ? [prefix] : [];
  }

  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return prefix ? [prefix] : [];
  }

  const results = [];
  for (const key of keys) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (
      stopPaths.has(nextPath) ||
      depth >= 1 ||
      val === null ||
      val === undefined ||
      typeof val !== "object" ||
      Array.isArray(val) ||
      isTimestampLike(val) ||
      isGeoPointLike(val) ||
      val instanceof Date
    ) {
      results.push(nextPath);
    } else {
      results.push(...collectCandidatePaths(val, stopPaths, nextPath, depth + 1));
    }
  }
  return results;
}

/**
 * Extracts a snapshot containing ONLY the configured `allowedFields` for
 * `create` and `delete` audit records.
 *
 * @param {object|null|undefined} data
 * @param {string[]} allowedFields
 * @return {object|null}
 */
function extractAllowedSnapshot(data, allowedFields = []) {
  if (!data || typeof data !== "object") return null;

  const snapshot = {};
  for (const fieldPath of allowedFields) {
    const rawVal = getByPath(data, fieldPath);
    if (rawVal !== undefined) {
      snapshot[fieldPath] = normalizeValue(rawVal);
    }
  }
  return snapshot;
}

/**
 * Computes the diff between `beforeData` and `afterData` according to
 * `allowedFields` and `ignoredFields`.
 *
 * @param {object|null|undefined} beforeData
 * @param {object|null|undefined} afterData
 * @param {string[]} allowedFields
 * @param {string[]} [ignoredFields]
 * @return {{
 *   changes: Object<string, {from: *, to: *}>,
 *   redactedChanges: string[],
 *   hasMeaningfulChanges: boolean
 * }}
 */
function buildDiff(
  beforeData,
  afterData,
  allowedFields = [],
  ignoredFields = []
) {
  const before = beforeData || {};
  const after = afterData || {};

  const changes = {};
  const redactedSet = new Set();

  // 1. Check all explicitly allowed fields first.
  for (const fieldPath of allowedFields) {
    if (isPathInList(fieldPath, ignoredFields)) {
      continue;
    }
    const beforeVal = getByPath(before, fieldPath);
    const afterVal = getByPath(after, fieldPath);
    if (!valuesEqual(beforeVal, afterVal)) {
      changes[fieldPath] = {
        from: normalizeValue(beforeVal),
        to: normalizeValue(afterVal),
      };
    }
  }

  // 2. Discover any other paths in `before` or `after` that changed.
  const stopPaths = new Set([...allowedFields, ...ignoredFields]);
  const candidatePaths = new Set([
    ...collectCandidatePaths(before, stopPaths),
    ...collectCandidatePaths(after, stopPaths),
  ]);

  for (const candidatePath of candidatePaths) {
    if (isPathInList(candidatePath, ignoredFields)) {
      continue;
    }
    if (isPathInList(candidatePath, allowedFields)) {
      continue;
    }
    // Also skip if candidatePath is a parent container of an allowed/ignored path
    // (those children are already evaluated individually).
    const isParentOfKnown = [...stopPaths].some((known) =>
      known.startsWith(`${candidatePath}.`)
    );
    if (isParentOfKnown) {
      continue;
    }

    const beforeVal = getByPath(before, candidatePath);
    const afterVal = getByPath(after, candidatePath);
    if (!valuesEqual(beforeVal, afterVal)) {
      redactedSet.add(candidatePath);
    }
  }

  const redactedChanges = Array.from(redactedSet).sort();
  const hasMeaningfulChanges =
    Object.keys(changes).length > 0 || redactedChanges.length > 0;

  return {
    changes,
    redactedChanges,
    hasMeaningfulChanges,
  };
}

module.exports = {
  normalizeValue,
  getByPath,
  valuesEqual,
  extractAllowedSnapshot,
  buildDiff,
};

