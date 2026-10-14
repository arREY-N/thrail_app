import { Platform } from "react-native";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { newLocation } from "@/src/core/models/Location/Location";
import * as TaskManager from "expo-task-manager";


export const LOCATION_TASK = "background-location-task";

interface LocationTaskPayload {
  locations?: {
    coords: {
      latitude: number;
      longitude: number;
      altitude?: number | null;
      accuracy?: number | null;
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
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const alt = location.coords.altitude;
        const accuracy = location.coords.accuracy;

        // Strictly validate coordinates and reject Null Island / corrupted fixes
        if (
          typeof lat !== 'number' ||
          typeof lon !== 'number' ||
          isNaN(lat) ||
          isNaN(lon) ||
          (lat === 0 && lon === 0) ||
          lat < -90 || lat > 90 ||
          lon < -180 || lon > 180
        ) {
          continue;
        }

        // Apply quality filter: reject zero, negative, or wild scatter fixes > 25m
        if (accuracy == null || accuracy <= 0 || accuracy > 25) {
          continue;
        }

        const timestamp = new Date(location.timestamp).toISOString();

        await addCoordinate(newLocation({
          latitude: lat,
          longitude: lon,
          altitude: alt ?? undefined,
          timestamp: new Date(timestamp),
          status: 'APP_BACKGROUNDED',
        }));
      }
    } catch (err) {
      console.error('[locationTask] Failed to log background coordinates batch:', err);
    }
  });
}
