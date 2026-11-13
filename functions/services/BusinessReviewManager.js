const admin = require("firebase-admin");
const functions = require("firebase-functions/v1");
const {FieldValue} = require("firebase-admin/firestore");

/**
 * Computes the next aggregate rating and reviewCount for a business using
 * an O(1) incremental delta formula across create, update, and delete events.
 *
 * @param {Object} params
 * @param {number} params.currentRating - Current average rating on the business document.
 * @param {number} params.currentCount - Current total reviewCount on the business document.
 * @param {number|null} params.oldDocRating - Previous rating on the review doc (null on create).
 * @param {number|null} params.newDocRating - New rating on the review doc (null on delete).
 * @return {{ rating: number, reviewCount: number, changed: boolean }}
 */
function computeNextBusinessRatingMetrics({
  currentRating = 0,
  currentCount = 0,
  oldDocRating = null,
  newDocRating = null,
}) {
  const safeCount = Math.max(0, Number(currentCount) || 0);
  const safeRating = Math.max(0, Number(currentRating) || 0);

  const hasOld = oldDocRating !== null && oldDocRating !== undefined;
  const hasNew = newDocRating !== null && newDocRating !== undefined;

  // 1. Create
  if (!hasOld && hasNew) {
    const addedRating = Number(newDocRating) || 0;
    const nextCount = safeCount + 1;
    const rawRating = ((safeCount * safeRating) + addedRating) / nextCount;
    const nextRating = Math.min(5, Math.max(0, rawRating));

    return {
      rating: nextRating,
      reviewCount: nextCount,
      changed: true,
    };
  }

  // 2. Update
  if (hasOld && hasNew) {
    const prevRating = Number(oldDocRating) || 0;
    const updatedRating = Number(newDocRating) || 0;

    if (prevRating === updatedRating) {
      return {
        rating: safeRating,
        reviewCount: safeCount,
        changed: false,
      };
    }

    const nextCount = Math.max(1, safeCount);
    const rawRating =
      ((nextCount * safeRating) - prevRating + updatedRating) / nextCount;
    const nextRating = Math.min(5, Math.max(0, rawRating));

    return {
      rating: nextRating,
      reviewCount: nextCount,
      changed: true,
    };
  }

  // 3. Delete
  if (hasOld && !hasNew) {
    const removedRating = Number(oldDocRating) || 0;
    const nextCount = Math.max(0, safeCount - 1);

    if (nextCount === 0) {
      return {
        rating: 0,
        reviewCount: 0,
        changed: true,
      };
    }

    const rawRating = ((safeCount * safeRating) - removedRating) / nextCount;
    const nextRating = Math.min(5, Math.max(0, rawRating));

    return {
      rating: nextRating,
      reviewCount: nextCount,
      changed: true,
    };
  }

  return {
    rating: safeRating,
    reviewCount: safeCount,
    changed: false,
  };
}

/**
 * Runs an atomic Firestore transaction to update a business document's
 * rating and reviewCount based on a review write/delete delta.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} businessId
 * @param {number|null} oldDocRating
 * @param {number|null} newDocRating
 * @return {Promise<{ rating: number, reviewCount: number, changed: boolean }|null>}
 */
async function executeBusinessReviewMetricsUpdate(
    db,
    businessId,
    oldDocRating,
    newDocRating,
) {
  if (!businessId) return null;

  const businessRef = db.collection("businesses").doc(businessId);

  return await db.runTransaction(async (transaction) => {
    const businessSnap = await transaction.get(businessRef);
    if (!businessSnap.exists) {
      console.warn(
          `[BusinessReviewManager] Business ${businessId} not found.`,
      );
      return null;
    }

    const businessData = businessSnap.data() || {};
    const currentRating = Number(businessData.rating) || 0;
    const currentCount = Number(businessData.reviewCount) || 0;

    const result = computeNextBusinessRatingMetrics({
      currentRating,
      currentCount,
      oldDocRating,
      newDocRating,
    });

    if (!result.changed) {
      return result;
    }

    transaction.update(businessRef, {
      rating: result.rating,
      reviewCount: result.reviewCount,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return result;
  });
}

/**
 * Firestore trigger listening to writes on
 * businesses/{businessId}/reviews/{reviewId}.
 */
const onBusinessReviewWritten = functions.firestore
    .document("businesses/{businessId}/reviews/{reviewId}")
    .onWrite(async (change, context) => {
      const {businessId, reviewId} = context.params;

      const beforeExists = Boolean(change.before && change.before.exists);
      const afterExists = Boolean(change.after && change.after.exists);

      const oldDocRating = beforeExists ?
        Number(change.before.data().rating) :
        null;
      const newDocRating = afterExists ?
        Number(change.after.data().rating) :
        null;

      // Fast exit on update if rating did not change
      if (beforeExists && afterExists && oldDocRating === newDocRating) {
        return null;
      }

      try {
        const db = admin.firestore();
        const updated = await executeBusinessReviewMetricsUpdate(
            db,
            businessId,
            oldDocRating,
            newDocRating,
        );

        if (updated && updated.changed) {
          console.log(
              `[onBusinessReviewWritten] Updated business ${businessId} ` +
              `(review ${reviewId}): rating=${updated.rating.toFixed(2)}, ` +
              `reviewCount=${updated.reviewCount}`,
          );
        }
      } catch (err) {
        console.error(
            `[onBusinessReviewWritten] Error updating business ${businessId}:`,
            err,
        );
        throw err;
      }

      return null;
    });

module.exports = {
  computeNextBusinessRatingMetrics,
  executeBusinessReviewMetricsUpdate,
  onBusinessReviewWritten,
};

