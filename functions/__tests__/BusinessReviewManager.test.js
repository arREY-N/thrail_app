const {
  computeNextBusinessRatingMetrics,
  executeBusinessReviewMetricsUpdate,
} = require("../services/BusinessReviewManager");

const { describe, test, expect, beforeEach } = require("@jest/globals");

class MockFirestore {
  constructor() {
    this.data = new Map();
  }

  setDoc(path, data) {
    this.data.set(path, JSON.parse(JSON.stringify(data)));
  }

  getDoc(path) {
    return this.data.get(path);
  }

  collection(colName) {
    const self = this;
    return {
      doc(docId) {
        const docPath = `${colName}/${docId}`;
        return {
          id: docId,
          path: docPath,
          async get() {
            const exists = self.data.has(docPath);
            return {
              id: docId,
              exists,
              data: () =>
                exists ?
                  JSON.parse(JSON.stringify(self.data.get(docPath))) :
                  undefined,
            };
          },
        };
      },
    };
  }

  async runTransaction(fn) {
    const self = this;
    const transaction = {
      async get(ref) {
        return await ref.get();
      },
      update(ref, updates) {
        const current = self.data.get(ref.path) || {};
        self.data.set(ref.path, { ...current, ...updates });
      },
    };
    return await fn(transaction);
  }
}

describe("BusinessReviewManager", () => {
  describe("computeNextBusinessRatingMetrics", () => {
    test("computes first rating on create when reviewCount is 0", () => {
      const res = computeNextBusinessRatingMetrics({
        currentRating: 0,
        currentCount: 0,
        oldDocRating: null,
        newDocRating: 4,
      });

      expect(res).toEqual({
        rating: 4,
        reviewCount: 1,
        changed: true,
      });
    });

    test("computes incremental average on create with existing reviews", () => {
      // Existing: 2 reviews with average 4.0 (sum = 8) -> add 5 -> sum = 13 / 3
      const res = computeNextBusinessRatingMetrics({
        currentRating: 4.0,
        currentCount: 2,
        oldDocRating: null,
        newDocRating: 5,
      });

      expect(res.reviewCount).toBe(3);
      expect(res.rating).toBeCloseTo(13 / 3, 5);
      expect(res.changed).toBe(true);
    });

    test("recomputes average without changing reviewCount when user edits rating", () => {
      // Reviews were [3, 4, 5] -> count = 3, avg = 4.0
      // User changes 3 -> 5 -> new reviews [5, 4, 5] -> count = 3, avg = 14 / 3
      const res = computeNextBusinessRatingMetrics({
        currentRating: 4.0,
        currentCount: 3,
        oldDocRating: 3,
        newDocRating: 5,
      });

      expect(res.reviewCount).toBe(3);
      expect(res.rating).toBeCloseTo(14 / 3, 5);
      expect(res.changed).toBe(true);
    });

    test("returns changed=false when user edits review text but rating is unchanged", () => {
      const res = computeNextBusinessRatingMetrics({
        currentRating: 4.2,
        currentCount: 5,
        oldDocRating: 4,
        newDocRating: 4,
      });

      expect(res).toEqual({
        rating: 4.2,
        reviewCount: 5,
        changed: false,
      });
    });

    test("decrements reviewCount and adjusts average when review is deleted", () => {
      // Reviews [5, 4, 5] -> count = 3, avg = 14 / 3
      // Delete rating 5 -> remaining [4, 5] -> count = 2, avg = 4.5
      const res = computeNextBusinessRatingMetrics({
        currentRating: 14 / 3,
        currentCount: 3,
        oldDocRating: 5,
        newDocRating: null,
      });

      expect(res.reviewCount).toBe(2);
      expect(res.rating).toBeCloseTo(4.5, 5);
      expect(res.changed).toBe(true);
    });

    test("resets rating and reviewCount to 0 when the last review is deleted", () => {
      const res = computeNextBusinessRatingMetrics({
        currentRating: 5,
        currentCount: 1,
        oldDocRating: 5,
        newDocRating: null,
      });

      expect(res).toEqual({
        rating: 0,
        reviewCount: 0,
        changed: true,
      });
    });
  });

  describe("executeBusinessReviewMetricsUpdate", () => {
    let db;

    beforeEach(() => {
      db = new MockFirestore();
      db.setDoc("businesses/biz-1", {
        id: "biz-1",
        name: "Peak Adventures",
        rating: 0,
        reviewCount: 0,
      });
    });

    test("handles create -> update -> delete lifecycle accurately on business doc", async () => {
      // 1. User 1 submits rating 3
      await executeBusinessReviewMetricsUpdate(db, "biz-1", null, 3);
      expect(db.getDoc("businesses/biz-1").rating).toBeCloseTo(3, 5);
      expect(db.getDoc("businesses/biz-1").reviewCount).toBe(1);

      // 2. User 2 submits rating 5 -> avg = 4.0, count = 2
      await executeBusinessReviewMetricsUpdate(db, "biz-1", null, 5);
      expect(db.getDoc("businesses/biz-1").rating).toBeCloseTo(4, 5);
      expect(db.getDoc("businesses/biz-1").reviewCount).toBe(2);

      // 3. User 1 edits their rating from 3 -> 4 -> avg = 4.5, count = 2
      await executeBusinessReviewMetricsUpdate(db, "biz-1", 3, 4);
      expect(db.getDoc("businesses/biz-1").rating).toBeCloseTo(4.5, 5);
      expect(db.getDoc("businesses/biz-1").reviewCount).toBe(2);

      // 4. User 2 deletes their rating 5 -> avg = 4.0, count = 1
      await executeBusinessReviewMetricsUpdate(db, "biz-1", 5, null);
      expect(db.getDoc("businesses/biz-1").rating).toBeCloseTo(4, 5);
      expect(db.getDoc("businesses/biz-1").reviewCount).toBe(1);

      // 5. User 1 deletes their rating 4 -> avg = 0, count = 0
      await executeBusinessReviewMetricsUpdate(db, "biz-1", 4, null);
      expect(db.getDoc("businesses/biz-1").rating).toBe(0);
      expect(db.getDoc("businesses/biz-1").reviewCount).toBe(0);
    });
  });
});

