import { Platform } from "react-native";
import { emitFilteredUserLocation, isForegroundGpsActive } from "@/src/core/flows/TrackHikerGPSFlow";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { newLocation } from "@/src/core/models/Location/Location";
import { sharedGpsKalmanFilter } from "@/src/core/utility/gpsKalmanFilter";
import * as TaskManager from "expo-task-manager";


export const LOCATION_TASK = "background-location-task";

interface LocationTaskPayload {
  locations?: {
    coords: {
      latitude: number;
      longitude: number;
      altitude?: number | null;
      accuracy?: number | null;
      speed?: number | null;
      heading?: number | null;
    };
    timestamp: number;
  }[];
}

// ✅ Background task defined strictly as a utility module (native only)
if (Platform.OS !== 'web') {
  TaskManager.defineTask<LocationTaskPayload>(
    LOCATION_TASK,
    async ({ data, error }: TaskManager.TaskManagerTaskBody<LocationTaskPayload>) => {
    if (error) {
      console.error('[locationTask] Background location task error:', error);
      return;
    }
    try {
      // When the app is active in the foreground and watchPositionAsync is already streaming
      // 1Hz BestForNavigation fixes, skip duplicate deferred batch processing to avoid
      // Kalman filter state contention.
      if (isForegroundGpsActive()) {
        return;
      }

      const rawLocations = data?.locations;
      if (!rawLocations || rawLocations.length === 0) return;

      // Ensure Zustand persistence rehydration has completed in headless mode
      if (useHikeStore.persist && !useHikeStore.persist.hasHydrated()) {
        await useHikeStore.persist.rehydrate();
      }

      const { active, currentHike } = useHikeStore.getState();
      if (!active || !currentHike || (currentHike.status !== 'started' && currentHike.status !== 'paused')) {
        return;
      }

      const addCoordinate = useHikeStore.getState().addCoordinate;

      // Sort batch ascending by timestamp to preserve temporal continuity
      const sortedLocations = [...rawLocations].sort((a, b) => a.timestamp - b.timestamp);

      for (const location of sortedLocations) {
        const filtered = sharedGpsKalmanFilter.process({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
          timestamp: location.timestamp,
        });

        if (!filtered) {
          continue;
        }

        // Keep global UI dot state synchronized with background fixes
        emitFilteredUserLocation(filtered.longitude, filtered.latitude);

        const timestamp = new Date(filtered.timestamp).toISOString();

        await addCoordinate(newLocation({
          latitude: filtered.latitude,
          longitude: filtered.longitude,
          altitude: filtered.altitude,
          accuracy: filtered.accuracy,
          speed: filtered.speed,
          timestamp: new Date(timestamp),
          status: 'APP_BACKGROUNDED',
        }));
      }
    } catch (err) {
      console.error('[locationTask] Failed to log background coordinates batch:', err);
    }
  });
}
