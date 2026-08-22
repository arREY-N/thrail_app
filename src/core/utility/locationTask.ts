import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import * as TaskManager from "expo-task-manager";


export const LOCATION_TASK = "background-location-task";

// ✅ Background task defined strictly as a utility module
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  const addCoordinate = useHikeStore.getInitialState().addCoordinate;

  if (error) return;
  const { locations } = data;
  const location = locations[0];

  const lat = location.coords.latitude;
  const lon = location.coords.longitude;
  const alt = location.coords.altitude ?? 0;
  const timestamp = new Date(location.timestamp).toISOString();

  // await saveToCSV(lat, lon, alt, timestamp);
  addCoordinate(new Location({
    latitude: lat,
    longitude: lon,
    altitude: alt,
    timestamp: new Date(timestamp),
    status: 'APP_BACKGROUNDED',
  }));
});
