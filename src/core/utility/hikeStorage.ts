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

const CSV_HEADER = "timestamp,latitude,longitude,altitude\n";

let isHeaderInitialized = false;
let writeQueue: string[] = [];
let isFlushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const BATCH_FLUSH_THRESHOLD = 5; // Flush every 5 points (~5 seconds) or on timer
const FLUSH_DELAY_MS = 3000;      // Or at most 3 seconds idle

/**
 * Ensures any pending buffered GPS rows are flushed directly to disk.
 */
export const flushTrackBuffer = async (): Promise<void> => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (isFlushing || writeQueue.length === 0) return;
  isFlushing = true;

  const chunk = writeQueue.join("");
  writeQueue = [];

  try {
    if (!isHeaderInitialized) {
      const fileInfo = await getInfoAsync(CSV_FILE_URI);
      if (!fileInfo.exists) {
        await writeAsStringAsync(CSV_FILE_URI, CSV_HEADER, {
          encoding: "utf8",
        });
      }
      isHeaderInitialized = true;
    }

    // Direct O(1) append mode: zero prior reading required
    await writeAsStringAsync(CSV_FILE_URI, chunk, {
      encoding: "utf8",
      append: true,
    });
  } catch (error) {
    console.error("Error appending track point to CSV:", error);
  } finally {
    isFlushing = false;
  }
};

/**
 * Saves a new GPS coordinate row to local device storage.
 * Buffered streaming append prevents O(N^2) disk read/write thrashing during active hikes.
 */
export const saveLocalTrackPoint = async (
  lat: number | string,
  lon: number | string,
  alt: number | string,
  timestamp: string,
): Promise<void> => {
  const newRow = `${timestamp},${lat},${lon},${alt}\n`;
  writeQueue.push(newRow);

  if (writeQueue.length >= BATCH_FLUSH_THRESHOLD) {
    await flushTrackBuffer();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushTrackBuffer().catch(() => {});
    }, FLUSH_DELAY_MS);
  }
};

/** Backwards-compatibility alias */
export const saveToCSV = saveLocalTrackPoint;

/**
 * Clears and resets the local CSV track file for session reset / discard.
 */
export const clearLocalTrack = async (): Promise<void> => {
  try {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    writeQueue = [];
    isFlushing = false;

    await writeAsStringAsync(CSV_FILE_URI, CSV_HEADER, {
      encoding: "utf8",
    });
    isHeaderInitialized = true;
    console.log("🧹 [LocalTrack] Cleared local track CSV");
  } catch (error) {
    console.warn("Error clearing local track CSV:", error);
  }
};

/**
 * Loads and parses the latest continuous session recorded in the CSV.
 * Returns an array of [longitude, latitude] coordinates.
 */
export const loadWalkedPathCoords = async (): Promise<[number, number][]> => {
  try {
    await flushTrackBuffer();
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
    await flushTrackBuffer();
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
