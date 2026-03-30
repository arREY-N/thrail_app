import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { Alert } from "react-native";
import { parseCurrentSessionCSV } from "./parseCSV";

export const CSV_FILE_URI =
  (documentDirectory as string) + "thrail_current_hike.csv";

/**
 * Saves a new GPS coordinate row to the CSV file.
 * Used internally by the background location task.
 */
export const saveToCSV = async (
  lat: number | string,
  lon: number | string,
  alt: number | string,
  timestamp: string,
) => {
  const newRow = `${timestamp},${lat},${lon},${alt}\n`;

  try {
    const fileInfo = await getInfoAsync(CSV_FILE_URI);
    let currentContent = "";

    if (!fileInfo.exists) {
      currentContent = "timestamp,latitude,longitude,altitude\n";
    } else {
      currentContent = await readAsStringAsync(CSV_FILE_URI);
    }

    await writeAsStringAsync(CSV_FILE_URI, currentContent + newRow);
    console.log("💾 Saved to CSV:", newRow.trim());
  } catch (error) {
    console.log("Error saving to CSV:", error);
  }
};

/**
 * Loads and parses the latest continuous session recorded in the CSV.
 * Returns an array of [longitude, latitude] coordinates.
 */
export const loadWalkedPathCoords = async (): Promise<[number, number][]> => {
  try {
    const fileInfo = await getInfoAsync(CSV_FILE_URI);
    if (fileInfo.exists) {
      const content = await readAsStringAsync(CSV_FILE_URI);
      return parseCurrentSessionCSV(content);
    }
  } catch (e) {
    console.log("Error loading walked path:", e);
  }
  return [];
};

/**
 * Prompts the user to save the internal CSV file to their device storage.
 */
export const exportHikeData = async () => {
  try {
    const fileInfo = await getInfoAsync(CSV_FILE_URI);

    if (!fileInfo.exists) {
      Alert.alert("No Data", "You haven't recorded any hiking data yet!");
      return;
    }

    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permissions.granted) {
      const fileContent = await readAsStringAsync(CSV_FILE_URI);

      const newFileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        "thrail_hike_data.csv",
        "text/csv",
      );

      await writeAsStringAsync(newFileUri, fileContent);
      Alert.alert(
        "Success!",
        "CSV file saved directly to your phone storage!",
      );
    }
  } catch (error) {
    console.log("Error saving file to device:", error);
    Alert.alert("Error", "Could not save the file to your device.");
  }
};
