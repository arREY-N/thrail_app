import { parseCurrentSessionCSV } from "../parseCSV.js";
import assert from "assert";

console.log("Running parseCurrentSessionCSV tests...");

// Test 1: Empty string
assert.deepStrictEqual(parseCurrentSessionCSV(""), []);

// Test 2: Valid coordinates
const csvData1 = `timestamp,latitude,longitude,altitude
2024-03-10T10:00:00.000Z,10.0,20.0,100
2024-03-10T10:01:00.000Z,10.1,20.1,105`;
assert.deepStrictEqual(parseCurrentSessionCSV(csvData1), [
  [20.0, 10.0],
  [20.1, 10.1],
]);

// Test 3: Session splitting
const csvData2 = `timestamp,latitude,longitude,altitude
2024-03-10T08:00:00.000Z,10.0,20.0,100
2024-03-10T08:01:00.000Z,10.1,20.1,105
2024-03-10T10:00:00.000Z,11.0,21.0,110
2024-03-10T10:01:00.000Z,11.1,21.1,115`;
assert.deepStrictEqual(parseCurrentSessionCSV(csvData2, 60), [
  [21.0, 11.0],
  [21.1, 11.1],
]);

// Test 4: Ignore background/foreground events
const csvData3 = `timestamp,latitude,longitude,altitude
2024-03-10T10:00:00.000Z,10.0,20.0,100
APP_BACKGROUNDED,,,
2024-03-10T10:01:00.000Z,10.1,20.1,105
APP_RESUMED,,,
2024-03-10T10:02:00.000Z,10.2,20.2,110`;
assert.deepStrictEqual(parseCurrentSessionCSV(csvData3), [
  [20.0, 10.0],
  [20.1, 10.1],
  [20.2, 10.2],
]);

// Test 5: Single coordinate
const csvData4 = `timestamp,latitude,longitude,altitude
2024-03-10T10:00:00.000Z,10.0,20.0,100`;
assert.deepStrictEqual(parseCurrentSessionCSV(csvData4), [[20.0, 10.0]]);

console.log("All tests passed successfully!");
