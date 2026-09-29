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
      const locations = data?.locations;
      if (!locations || locations.length === 0) return;

      const addCoordinate = useHikeStore.getState().addCoordinate;

      for (const location of locations) {
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const alt = location.coords.altitude ?? 0;

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

        const timestamp = new Date(location.timestamp).toISOString();

        await addCoordinate(newLocation({
          latitude: lat,
          longitude: lon,
          altitude: alt,
          timestamp: new Date(timestamp),
          status: 'APP_BACKGROUNDED',
        }));
      }
    } catch (err) {
      console.error('[locationTask] Failed to log background coordinates batch:', err);
    }
  });
}
