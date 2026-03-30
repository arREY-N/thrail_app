export const parseCurrentSessionCSV = (
  csvString: string,
  maxGapMinutes: number = 60,
): [number, number][] => {
  if (!csvString || csvString.trim() === "") return [];

  const lines = csvString.trim().split("\n");
  if (lines.length <= 1) return []; // Only header or empty

  const maxGapMs = maxGapMinutes * 60 * 1000;

  // We will build up sessions. A session is an array of [longitude, latitude]
  let currentSession: [number, number][] = [];
  const sessions: [number, number][][] = [];

  let lastTimestampMs: number | null = null;

  // Start from line 1 to skip the header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");

    // A valid row has 4 parts: timestamp, latitude, longitude, altitude
    // Although sometimes background events are logged like "APP_BACKGROUNDED,,,"
    if (parts.length < 3) continue;

    const timestampStr = parts[0];
    const latStr = parts[1];
    const lonStr = parts[2];

    // Skip non-coordinate events safely
    if (!latStr || !lonStr) continue;

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) continue;

    const currentTimestampMs = new Date(timestampStr).getTime();

    // If it's the first valid coordinates
    if (lastTimestampMs === null) {
      currentSession.push([lon, lat]);
    } else {
      const diffMs = Math.abs(currentTimestampMs - lastTimestampMs);

      // If the gap exceeds the maximum allowed, save the old session and start a new one
      if (diffMs > maxGapMs) {
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        currentSession = [[lon, lat]];
      } else {
        currentSession.push([lon, lat]);
      }
    }

    lastTimestampMs = currentTimestampMs;
  }

  // Push the final session
  if (currentSession.length > 0) {
    sessions.push(currentSession);
  }

  // Return the latest session, or an empty array if none exist
  return sessions.length > 0 ? sessions[sessions.length - 1] : [];
};
