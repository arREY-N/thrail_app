import { functions } from "@/src/core/config/Firebase";
import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";
import { useLocationStore } from "@/src/core/models/Location/stores/locationStore";
import { useMessageStore } from "@/src/core/models/Message/stores/messageStore";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { httpsCallable } from "firebase/functions";

export interface RemoveUserFromGroupPayload {
    groupId: string;
    userId: string;
    bookingId?: string;
}

/**
 * Calls the Cloud Function to remove a user from the group chat when they cancel a 'for-reservation' booking
 * and thoroughly cleans up all active listeners and listener-related data for that specific group.
 */
export async function removeUserFromGroupOnCancellation({
    groupId,
    userId,
    bookingId,
}: RemoveUserFromGroupPayload): Promise<void> {
    try {
        // 1. Immediately unsubscribe and clear all listener-related data for this specific group across local stores
        useGroupStore.getState().unsubscribeFromGroup(groupId);
        useMessageStore.getState().unsubscribeFromGroupMessages(groupId);
        useMessageStore.getState().clearMessages(groupId);
        useLocationStore.getState().unsubscribeFromGroupLocations(groupId);

        const hikeListeners = useHikeStore.getState().activeListeners;
        if (hikeListeners?.[groupId]) {
            try {
                hikeListeners[groupId]();
            } catch (err) {
                console.warn(`[removeUserFromGroupOnCancellation] Error unsubscribing hike listener for ${groupId}:`, err);
            }
            useHikeStore.setState((state) => {
                const newListeners = { ...state.activeListeners };
                delete newListeners[groupId];
                const newLocations = { ...state.locationByGroup };
                delete newLocations[groupId];
                return {
                    activeListeners: newListeners,
                    locationByGroup: newLocations,
                };
            });
        }

        // 2. Invoke Cloud Function to remove user from Firestore group chat document and live locations
        const removeMemberFn = httpsCallable(functions, "removeUserFromGroupOnCancellation");
        await removeMemberFn({
            groupId,
            userId,
            bookingId,
        });
    } catch (error) {
        console.warn("[removeUserFromGroupOnCancellation] Failed to remove user from group chat:", error);
    }
}
