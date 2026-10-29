const admin = require('firebase-admin');
const { https } = require('firebase-functions/v2');
const { HttpsError } = require('firebase-functions/v2/https');
const functions = require('firebase-functions/v1');
const { FieldValue } = require('firebase-admin/firestore');

/**
 * Core helper to remove a user from a group chat's participantsIds and members arrays.
 * Handles edge cases such as when the user has multiple active bookings for the same offer.
 *
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} groupId - The offer / group ID.
 * @param {string} userId - The user ID to remove.
 * @param {string} [bookingId] - The specific booking ID being cancelled.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function executeRemoveUserFromGroup(db, groupId, userId, bookingId) {
    if (!groupId || !userId) {
        return { success: false, message: 'Missing groupId or userId.' };
    }

    const groupRef = db.collection('groups').doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
        return { success: true, message: 'Group not found.' };
    }

    const groupData = groupSnap.data() || {};

    // Check if the user has any other active bookings for this offer/group
    const otherBookingsSnap = await db.collection('users').doc(userId).collection('bookings')
        .where('offer.id', '==', groupId)
        .get();

    const hasOtherActiveBooking = otherBookingsSnap.docs.some(
        d => d.id !== bookingId && !['cancelled', 'refunded'].includes(d.data().status)
    );

    const updatedMembers = (groupData.members || []).filter(
        m => (hasOtherActiveBooking ? m.bookingId !== bookingId : m.id !== userId)
    );

    const updatePayload = {
        members: updatedMembers,
        updatedAt: FieldValue.serverTimestamp(),
    };

    if (!hasOtherActiveBooking) {
        updatePayload.participantsIds = admin.firestore.FieldValue.arrayRemove(userId);
    }

    await groupRef.update(updatePayload);
    console.log(`[GroupChatManager] Removed user ${userId} from group chat ${groupId}`);

    // Remove any live location listener data / pins for this user in this specific group
    try {
        await db.collection('groups').doc(groupId).collection('liveLocations').doc(userId).delete();
        console.log(`[GroupChatManager] Deleted liveLocation for user ${userId} in group ${groupId}`);
    } catch (locErr) {
        console.warn(`[GroupChatManager] Could not delete liveLocation for user ${userId} in group ${groupId}:`, locErr.message);
    }

    return { success: true, message: 'Successfully removed user from group chat.' };
}

/**
 * Callable Firebase Cloud Function.
 * Removes a user from a group chat when they cancel a 'for-reservation' booking.
 * Bypasses client Firestore security rules using Firebase Admin SDK.
 */
const removeUserFromGroupOnCancellation = https.onCall(async (request) => {
    const { groupId, userId, bookingId } = request.data || {};
    const caller = request.auth;

    if (!caller) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!groupId || !userId) {
        throw new HttpsError('invalid-argument', 'groupId and userId are required.');
    }

    // Only allow the user themselves or an admin to remove the member
    if (caller.uid !== userId && caller.token?.role !== 'admin') {
        throw new HttpsError('permission-denied', 'You are not authorized to perform this operation.');
    }

    const db = admin.firestore();
    return await executeRemoveUserFromGroup(db, groupId, userId, bookingId);
});

/**
 * Firestore background trigger.
 * Triggered whenever a booking document under /users/{userId}/bookings/{bookingId} is deleted.
 * When a user cancels a 'for-reservation' booking, the document is deleted by cancelPendingBooking.
 * This background trigger ensures that the user is cleaned up from the group chat even if
 * the direct callable call was interrupted or offline.
 */
const onDeleteBooking = functions.firestore
    .document('users/{userId}/bookings/{bookingId}')
    .onDelete(async (snapshot, context) => {
        const data = snapshot.data();
        if (!data) return null;

        const { userId, bookingId } = context.params;
        const offerId = data.offer?.id;

        if (!offerId) return null;

        try {
            const db = admin.firestore();
            await executeRemoveUserFromGroup(db, offerId, userId, bookingId);
        } catch (err) {
            console.error(`[onDeleteBooking] Error removing user ${userId} from group ${offerId}:`, err);
        }

        return null;
    });

module.exports = {
    removeUserFromGroupOnCancellation,
    onDeleteBooking,
    executeRemoveUserFromGroup,
};
