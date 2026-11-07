import { HikeState, hikeStoreCreator } from "@/src/core/models/Hike/stores/hikeStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useHikeStore = create<HikeState>()(
    persist(
        immer(hikeStoreCreator),
        {
            name: "hike-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentHike: state.currentHike,
                elapsedTime: state.elapsedTime,
                timerStartTime: state.timerStartTime,
                totalDistance: state.totalDistance,
                totalElevationGain: state.totalElevationGain,
                totalElevationLoss: state.totalElevationLoss,
                elevationBaseline: state.elevationBaseline,
                active: state.active,
                profile: state.profile,
                activeGroupId: state.activeGroupId,
                shareLocationEnabled: state.shareLocationEnabled,
                live: state.live,
                walkedRoute: state.walkedRoute,
                coordinates: state.coordinates,
                events: state.events,
                isSegmentFirstPoint: state.isSegmentFirstPoint,
            }),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                // Auto-pause crash recovery: detect if an active session was abruptly killed by battery death / shutdown
                if (state.active && state.currentHike && state.currentHike.status === 'started') {
                    const now = Date.now();
                    const timerStart = state.timerStartTime || 0;
                    const elapsed = state.elapsedTime || 0;

                    let lastActivityTime = timerStart > 0 ? timerStart + elapsed : 0;
                    const lastCoord = state.coordinates && state.coordinates.length > 0
                        ? state.coordinates[state.coordinates.length - 1]
                        : null;

                    if (lastCoord?.timestamp) {
                        const coordTime = new Date(lastCoord.timestamp).getTime();
                        if (!isNaN(coordTime) && coordTime > 0) {
                            lastActivityTime = Math.max(lastActivityTime, coordTime);
                        }
                    }

                    const CRASH_GAP_THRESHOLD_MS = 120000; // 2 minutes
                    if (lastActivityTime > 0 && now - lastActivityTime > CRASH_GAP_THRESHOLD_MS) {
                        console.log(`[useHikeStore] Battery death / crash detected. Gap: ${((now - lastActivityTime) / 1000).toFixed(0)}s. Auto-pausing session.`);
                        const safeElapsed = Math.max(
                            elapsed,
                            timerStart > 0 && lastActivityTime > timerStart ? lastActivityTime - timerStart : elapsed
                        );
                        useHikeStore.setState((draft) => {
                            if (draft.currentHike) {
                                draft.currentHike.status = 'paused';
                            }
                            draft.elapsedTime = safeElapsed;
                            draft.timerStartTime = 0;
                            draft.isSegmentFirstPoint = true;
                        });
                        useHikeStore.getState().logHikeEvent('HIKE_PAUSED', lastCoord ? {
                            latitude: lastCoord.latitude,
                            longitude: lastCoord.longitude,
                            altitude: lastCoord.altitude ?? undefined,
                        } : undefined);
                    }
                }
            },
        }
    )
);

export const useHikesStore = useHikeStore;
