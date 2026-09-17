import { Platform } from "react-native";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { newLocation } from "@/src/core/models/Location/Location";
import * as TaskManager from "expo-task-manager";


export const LOCATION_TASK = "background-location-task";

// ✅ Background task defined strictly as a utility module (native only)
if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
      console.error('[locationTask] Background location task error:', error);
      return;
    }
    try {
      const { locations } = data;
      if (!locations || locations.length === 0) return;
      const location = locations[0];

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      const alt = location.coords.altitude ?? 0;
      const timestamp = new Date(location.timestamp).toISOString();

      const addCoordinate = useHikeStore.getState().addCoordinate;
      await addCoordinate(newLocation({
        latitude: lat,
        longitude: lon,
        altitude: alt,
        timestamp: new Date(timestamp),
        status: 'APP_BACKGROUNDED',
      }));
    } catch (err) {
      console.error('[locationTask] Failed to log background coordinate:', err);
    }
  });
}
