import * as TaskManager from "expo-task-manager";
import { saveToCSV } from "./hikeStorage";

export const LOCATION_TASK = "background-location-task";

// ✅ Background task defined strictly as a utility module
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const { locations } = data;
  const location = locations[0];

  const lat = location.coords.latitude;
  const lon = location.coords.longitude;
  const alt = location.coords.altitude ?? 0;
  const timestamp = new Date(location.timestamp).toISOString();

  await saveToCSV(lat, lon, alt, timestamp);
});
