/**
 * Unit tests for the reusable audit trail engine and `trails` collection audit
 * rules (`functions/services/audit/`).
 */

/* eslint-env jest */
const { describe, test, expect } = require("@jest/globals");
const {
  AUDIT_CONFIG,
  extractAllowedSnapshot,
  buildDiff,
  resolveActor,
  processAuditEvent,
  buildTrailAuditMetadata,
} = require("../services/audit");

/**
 * Creates a lightweight in-memory mock Firestore instance that records writes
 * to `auditLogs/{docId}`.
 *
 * @return {{db: object, store: Map<string, object>}}
 */
function createMockDb() {
  const store = new Map();
  let autoIdCounter = 0;

  const db = {
    collection: (collectionName) => ({
      doc: (docId) => {
        const resolvedId = docId || `auto_${++autoIdCounter}`;
        const key = `${collectionName}/${resolvedId}`;
        return {
          id: resolvedId,
          set: async (data) => {
            store.set(key, data);
          },
          get: async () => ({
            exists: store.has(key),
            data: () => store.get(key),
          }),
        };
      },
    }),
  };

  return { db, store };
}

/**
 * Helper to create a mock Firestore DocumentSnapshot.
 *
 * @param {string} id
 * @param {object|null} data
 * @return {object}
 */
function makeSnap(id, data) {
  if (!data) {
    return {
      id,
      exists: false,
      data: () => undefined,
    };
  }
  return {
    id,
    exists: true,
    data: () => data,
  };
}

/**
 * Sample trail document matching `ITrailDB` in Firestore.
 *
 * @param {object} [overrides]
 * @return {object}
 */
function makeSampleTrail(overrides = {}) {
  return {
    id: "trail_batulao",
    general: {
      active: true,
      name: "Mt. Batulao",
      address: "Nasugbu, Batangas",
      province: ["Batangas"],
      mountain: ["Mt. Batulao"],
      rating: 4.5,
      reviewCount: 12,
      description: "Scenic grassland ridges.",
      guidelines: ["Leave No Trace"],
      safety_tips: ["Bring sun protection"],
      lgu_rules: ["Register at barangay hall"],
      critical_info: "",
      ...(overrides.general || {}),
    },
    geography: {
      masl: 811,
      start: { latitude: 14.04, longitude: 120.8 },
      end: { latitude: 14.05, longitude: 120.81 },
      geoJsonPath: "trail_routes/batulao/batulao.geojson",
      ...(overrides.geography || {}),
    },
    difficulty: {
      lascoRating: 4,
      classification: "minor",
      length: 9.5,
      gain: 650,
      slope: 15,
      obstacles: 2,
      hours: 4,
      circularity: "Circular",
      quality: ["Grassland", "Exposed Ridges"],
      difficulty_points: ["Scrambling"],
      ...(overrides.difficulty || {}),
    },
    description: {
      classificationDescription: "Beginner friendly minor hike",
      lascoRatingDescription: "4/9 difficulty",
      ...(overrides.description || {}),
    },
    tourism: {
      shelter: true,
      resting: true,
      information_board: true,
      clean_water: false,
      river: false,
      lake: false,
      waterfall: false,
      monument: false,
      community: true,
      viewpoint: ["360 Panorama"],
      network_connection: true,
      ...(overrides.tourism || {}),
    },
    coverImage: "https://example.com/cover.jpg",
    routeMapImage: "https://example.com/map.jpg",
    offlinePoints: [
      {
        id: "pt_1",
        name: "Camp 1",
        type: "checkpoint",
        description: "Registration checkpoint",
        x: 25,
        y: 40,
      },
    ],
    profile: {
      metadata: { type: "trail", id: "trail_batulao", profile: "easy" },
      features: { length: 0.4, elevation: 0.3 },
    },
    createdAt: {
      toDate: () => new Date("2026-10-01T00:00:00.000Z"),
      toMillis: () => 1790812800000,
    },
    updatedAt: {
      toDate: () => new Date("2026-10-01T00:00:00.000Z"),
      toMillis: () => 1790812800000,
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        ([k]) =>
          ![
            "general",
            "geography",
            "difficulty",
            "description",
            "tourism",
          ].includes(k)
      )
    ),
  };
}

describe("Audit Trail Engine - Trails Collection", () => {
  test("CREATE: records allowed snapshot, omits ignored/confidential fields, and attaches trail metadata", async () => {
    const { db, store } = createMockDb();
    const afterTrail = makeSampleTrail({
      internalSecretNote: "confidential-value",
    });

    const event = {
      id: "evt_create_1",
      time: "2026-10-30T01:00:00Z",
      document: "trails/trail_batulao",
      params: { trailId: "trail_batulao" },
      authType: "unknown",
      authId: "superadmin_uid_1",
      data: {
        before: makeSnap("trail_batulao", null),
        after: makeSnap("trail_batulao", afterTrail),
      },
    };

    const result = await processAuditEvent(event, "trails", {
      db,
      buildExtraMetadata: buildTrailAuditMetadata,
    });

    expect(result.written).toBe(true);
    const saved = store.get("auditLogs/evt_create_1");
    expect(saved).toBeDefined();
    expect(saved.operation).toBe("create");
    expect(saved.collection).toBe("trails");
    expect(saved.docId).toBe("trail_batulao");
    expect(saved.actorId).toBe("superadmin_uid_1");
    expect(saved.actorType).toBe("user");
    expect(saved.metadata).toEqual({
      trailName: "Mt. Batulao",
      province: ["Batangas"],
    });

    // Allowed fields are present in snapshot
    expect(saved.snapshot["general.name"]).toBe("Mt. Batulao");
    expect(saved.snapshot["geography.masl"]).toBe(811);
    expect(saved.snapshot["geography.start"]).toEqual({
      latitude: 14.04,
      longitude: 120.8,
    });
    expect(saved.snapshot["difficulty.lascoRating"]).toBe(4);

    // Confidential and ignored fields are NOT in snapshot
    expect(saved.snapshot.internalSecretNote).toBeUndefined();
    expect(saved.snapshot.profile).toBeUndefined();
    expect(saved.snapshot["general.rating"]).toBeUndefined();
    expect(saved.snapshot.updatedAt).toBeUndefined();
  });

  test("UPDATE: records only changed allowed fields in `changes` and lists confidential field names in `redactedChanges`", async () => {
    const { db, store } = createMockDb();
    const beforeTrail = makeSampleTrail({
      secretToken: "old_secret",
    });
    const afterTrail = makeSampleTrail({
      general: {
        name: "Mt. Batulao (New Trail)",
        critical_info: "Trail closed due to typhoon warning",
      },
      difficulty: {
        lascoRating: 5,
      },
      secretToken: "new_secret",
      updatedAt: {
        toDate: () => new Date("2026-10-30T02:00:00.000Z"),
        toMillis: () => 1793325600000,
      },
    });

    const event = {
      id: "evt_update_1",
      time: "2026-10-30T02:00:00Z",
      document: "trails/trail_batulao",
      params: { trailId: "trail_batulao" },
      authType: "unknown",
      authId: "admin_uid_99",
      data: {
        before: makeSnap("trail_batulao", beforeTrail),
        after: makeSnap("trail_batulao", afterTrail),
      },
    };

    const result = await processAuditEvent(event, "trails", {
      db,
      buildExtraMetadata: buildTrailAuditMetadata,
    });

    expect(result.written).toBe(true);
    const saved = store.get("auditLogs/evt_update_1");
    expect(saved.operation).toBe("update");
    expect(saved.snapshot).toBeNull();
    expect(saved.changes).toEqual({
      "general.name": {
        from: "Mt. Batulao",
        to: "Mt. Batulao (New Trail)",
      },
      "general.critical_info": {
        from: "",
        to: "Trail closed due to typhoon warning",
      },
      "difficulty.lascoRating": {
        from: 4,
        to: 5,
      },
    });
    // Confidential field name is listed, but its value is never stored
    expect(saved.redactedChanges).toEqual(["secretToken"]);
    expect(JSON.stringify(saved)).not.toContain("old_secret");
    expect(JSON.stringify(saved)).not.toContain("new_secret");
  });

  test("NOISY UPDATE SKIP: skips writing audit log when only `profile`, `general.rating`, `general.reviewCount`, or `updatedAt` change", async () => {
    const { db, store } = createMockDb();
    const beforeTrail = makeSampleTrail();
    const afterTrail = makeSampleTrail({
      general: {
        rating: 4.8,
        reviewCount: 13,
      },
      profile: {
        metadata: { type: "trail", id: "trail_batulao", profile: "easy" },
        features: { length: 0.45, elevation: 0.35 },
      },
      updatedAt: {
        toDate: () => new Date("2026-10-30T03:00:00.000Z"),
        toMillis: () => 1793329200000,
      },
    });

    const event = {
      id: "evt_noisy_1",
      time: "2026-10-30T03:00:00Z",
      document: "trails/trail_batulao",
      params: { trailId: "trail_batulao" },
      authType: "unknown",
      authId: "hiker_uid_1",
      data: {
        before: makeSnap("trail_batulao", beforeTrail),
        after: makeSnap("trail_batulao", afterTrail),
      },
    };

    const result = await processAuditEvent(event, "trails", {
      db,
      buildExtraMetadata: buildTrailAuditMetadata,
    });

    expect(result.written).toBe(false);
    expect(result.reason).toBe("only_ignored_fields_changed");
    expect(store.size).toBe(0);
  });

  test("DELETE: captures allowed pre-deletion snapshot and metadata", async () => {
    const { db, store } = createMockDb();
    const beforeTrail = makeSampleTrail();

    const event = {
      id: "evt_delete_1",
      time: "2026-10-30T04:00:00Z",
      document: "trails/trail_batulao",
      params: { trailId: "trail_batulao" },
      authType: "unknown",
      authId: "superadmin_uid_1",
      data: {
        before: makeSnap("trail_batulao", beforeTrail),
        after: makeSnap("trail_batulao", null),
      },
    };

    const result = await processAuditEvent(event, "trails", {
      db,
      buildExtraMetadata: buildTrailAuditMetadata,
    });

    expect(result.written).toBe(true);
    const saved = store.get("auditLogs/evt_delete_1");
    expect(saved.operation).toBe("delete");
    expect(saved.snapshot["general.name"]).toBe("Mt. Batulao");
    expect(saved.changes).toBeNull();
    expect(saved.metadata).toEqual({
      trailName: "Mt. Batulao",
      province: ["Batangas"],
    });
  });

  test("ACTOR RESOLUTION: handles service account fallback to `system` and fresh `_actor` stamps", () => {
    // 1. Service account without _actor -> "system"
    const saActor = resolveActor(
      {
        authType: "service_account",
        authId: "firebase-adminsdk@thrail.iam.gserviceaccount.com",
      },
      "update",
      {},
      {}
    );
    expect(saActor).toEqual({
      actorId: "system",
      actorType: "system",
      authSource: "fallback",
    });

    // 2. Service account with fresh _actor stamp -> credits the end user
    const stampedActor = resolveActor(
      {
        authType: "service_account",
        authId: "firebase-adminsdk@thrail.iam.gserviceaccount.com",
      },
      "update",
      { _actor: "user_old", _actorAt: 100 },
      { _actor: "user_123", _actorAt: 200 }
    );
    expect(stampedActor).toEqual({
      actorId: "user_123",
      actorType: "user",
      authSource: "document_stamp",
    });

    // 3. Stale _actor stamp from an earlier write (neither _actor nor _actorAt changed) -> ignored
    const staleStamp = resolveActor(
      {
        authType: "service_account",
        authId: "firebase-adminsdk@thrail.iam.gserviceaccount.com",
      },
      "update",
      { _actor: "user_old", _actorAt: 100 },
      { _actor: "user_old", _actorAt: 100 }
    );
    expect(staleStamp).toEqual({
      actorId: "system",
      actorType: "system",
      authSource: "fallback",
    });
  });

  test("IDEMPOTENCY: retrying the same eventId overwrites the same auditLogs document instead of duplicating", async () => {
    const { db, store } = createMockDb();
    const afterTrail = makeSampleTrail();
    const event = {
      id: "evt_retry_same_id",
      time: "2026-10-30T05:00:00Z",
      document: "trails/trail_batulao",
      params: { trailId: "trail_batulao" },
      authType: "unknown",
      authId: "superadmin_uid_1",
      data: {
        before: makeSnap("trail_batulao", null),
        after: makeSnap("trail_batulao", afterTrail),
      },
    };

    await processAuditEvent(event, "trails", { db });
    await processAuditEvent(event, "trails", { db });

    expect(store.size).toBe(1);
    expect(store.has("auditLogs/evt_retry_same_id")).toBe(true);
  });

  test("HELPER EXPORTS: extractAllowedSnapshot and buildDiff work directly with AUDIT_CONFIG.trails", () => {
    const trail = makeSampleTrail();
    const snap = extractAllowedSnapshot(
      trail,
      AUDIT_CONFIG.trails.allowedFields
    );
    expect(snap["general.name"]).toBe("Mt. Batulao");

    const diff = buildDiff(
      trail,
      makeSampleTrail({ geography: { masl: 815 } }),
      AUDIT_CONFIG.trails.allowedFields,
      AUDIT_CONFIG.trails.ignoredFields
    );
    expect(diff.hasMeaningfulChanges).toBe(true);
    expect(diff.changes).toEqual({
      "geography.masl": { from: 811, to: 815 },
    });
  });
});

