import * as FileSystem from "expo-file-system/legacy";
import { collection, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { Platform } from "react-native";

import { db, storage } from "@/src/core/config/Firebase";

export type SupportedMountainId = string;
export type LegacyMountainId =
  | "batulao"
  | "kulis"
  | "daraitan"
  | "tagapo"
  | "sembrano";

export interface IGeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][] | number[][][];
  };
}

export interface IGeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: IGeoJSONFeature[];
}

export interface IMountainTrailManifest {
  mountainId: SupportedMountainId;
  displayName: string;
  center: [number, number]; // [lon, lat]
  allFile: string;
  trails: {
    id: string;
    name: string;
    fileName: string;
  }[];
}

/**
 * Registry of the 5 supported mountains and their individual + combined GeoJSON files
 * hosted in Firebase Storage under `trail_routes/<mountainId>/<fileName>`.
 */
export const MOUNTAIN_TRAIL_REGISTRY: Record<
  SupportedMountainId,
  IMountainTrailManifest
> = {
  batulao: {
    mountainId: "batulao",
    displayName: "Mt. Batulao",
    center: [120.8022, 14.0408],
    allFile: "batulao-all.geojson",
    trails: [
      { id: "batulao-old", name: "Old Trail", fileName: "batulao-old.geojson" },
      { id: "batulao-new", name: "New Trail", fileName: "batulao-new.geojson" },
    ],
  },
  kulis: {
    mountainId: "kulis",
    displayName: "Mt. Kulis",
    center: [121.3372, 14.5762],
    allFile: "kulis-all.geojson",
    trails: [
      {
        id: "kulis-summit",
        name: "Mt. Kulis Summit Trail",
        fileName: "kulis-summit.geojson",
      },
      {
        id: "kulis-sambong",
        name: "Sambong Peak Trail",
        fileName: "kulis-sambong.geojson",
      },
    ],
  },
  daraitan: {
    mountainId: "daraitan",
    displayName: "Mt. Daraitan",
    center: [121.4384, 14.6135],
    allFile: "daraitan-all.geojson",
    trails: [
      {
        id: "daraitan-summit",
        name: "Daraitan Village to Summit Trail",
        fileName: "daraitan-summit.geojson",
      },
      {
        id: "daraitan-tinipak",
        name: "Tinipak River Trail",
        fileName: "daraitan-tinipak.geojson",
      },
      {
        id: "daraitan-traverse",
        name: "Summit to Tinipak Traverse Trail",
        fileName: "daraitan-traverse.geojson",
      },
    ],
  },
  tagapo: {
    mountainId: "tagapo",
    displayName: "Mt. Tagapo",
    center: [121.2335, 14.3228],
    allFile: "tagapo-all.geojson",
    trails: [
      {
        id: "tagapo-janosa",
        name: "Brgy. Janosa Trail (Main Jump-off)",
        fileName: "tagapo-janosa.geojson",
      },
      {
        id: "tagapo-janosa-west",
        name: "Brgy. Janosa West Trail",
        fileName: "tagapo-janosa-west.geojson",
      },
    ],
  },
  sembrano: {
    mountainId: "sembrano",
    displayName: "Mt. Sembrano",
    center: [121.3672, 14.3849],
    allFile: "sembrano-all.geojson",
    trails: [
      {
        id: "sembrano-malaya",
        name: "Brgy. Malaya Trail (via Manggahan)",
        fileName: "sembrano-malaya.geojson",
      },
      {
        id: "sembrano-manggahan",
        name: "Manggahan to Summit Trail",
        fileName: "sembrano-manggahan.geojson",
      },
    ],
  },
};

const OFFLINE_TRAILS_DIR = `${FileSystem.documentDirectory ?? ""}offline_trails`;

/**
 * Resolves any mountain name or ID (e.g. "Mount Batulao", "Mt. Kulis", "daraitan")
 * to one of the 5 supported mountain folder IDs.
 */
export function resolveMountainId(
  nameOrId?: string | null,
): SupportedMountainId | null {
  if (!nameOrId) return null;
  const normalized = nameOrId.toLowerCase().trim();
  for (const id of Object.keys(MOUNTAIN_TRAIL_REGISTRY)) {
    if (normalized.includes(id)) {
      return id;
    }
  }
  // Dynamic fallback: strip 'mount' or 'mt.' prefixes and sanitize to alphanumeric slug
  const slug = normalized
    .replace(/^(mount|mt\.?)\s+/i, "")
    .trim()
    .replace(/[^a-z0-9_-]/g, "_");
  return slug.length > 0 ? slug : null;
}

/**
 * Resolves the closest supported mountain within ~16.5km of the given coordinates.
 */
export function resolveMountainIdByCoords(
  lat?: number,
  lon?: number,
): SupportedMountainId | null {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    isNaN(lat) ||
    isNaN(lon)
  ) {
    return null;
  }

  let closest: SupportedMountainId | null = null;
  let minSqDist = Infinity;

  for (const manifest of Object.values(MOUNTAIN_TRAIL_REGISTRY)) {
    const [mLon, mLat] = manifest.center;
    const dLat = lat - mLat;
    const dLon = lon - mLon;
    const sqDist = dLat * dLat + dLon * dLon;
    if (sqDist < 0.15 * 0.15 && sqDist < minSqDist) {
      minSqDist = sqDist;
      closest = manifest.mountainId;
    }
  }

  return closest;
}

/**
 * Reads a GeoJSON file from either a local `file://` URI (native) or an `https://` URL (web).
 */
export async function readGeoJsonFromUri(
  uri: string,
): Promise<IGeoJSONFeatureCollection> {
  if (Platform.OS === "web" || uri.startsWith("http://") || uri.startsWith("https://")) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching GeoJSON from ${uri}`);
    }
    return (await response.json()) as IGeoJSONFeatureCollection;
  }
  const raw = await FileSystem.readAsStringAsync(uri);
  return JSON.parse(raw) as IGeoJSONFeatureCollection;
}

const webBlobCache = new Map<string, string>();
let activeWebAllMountainsBlobUrl: string | null = null;

/**
 * Clears and revokes all active blob URLs created for web GeoJSON caching.
 */
export function clearWebBlobCache(): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    webBlobCache.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("Failed revoking blob URL:", e);
      }
    });
    if (activeWebAllMountainsBlobUrl) {
      try {
        URL.revokeObjectURL(activeWebAllMountainsBlobUrl);
      } catch (e) {
        console.warn("Failed revoking all-mountains blob URL:", e);
      }
      activeWebAllMountainsBlobUrl = null;
    }
  }
  webBlobCache.clear();
  webAllMountainsPromise = null;
}

/**
 * Returns a local `file://` URI (or remote URL on web) for a mountain's GeoJSON trail file.
 *
 * Pure Firebase + Offline Flow (No bundled `require()` assets):
 * 1. Checks `FileSystem.documentDirectory/offline_trails/<mountainId>/<fileName>` first.
 *    If already downloaded, returns immediately with zero network usage (works in Airplane Mode).
 * 2. If not cached locally, downloads from Firebase Cloud Storage (`trail_routes/<mountainId>/<fileName>`)
 *    into a temporary `.tmp` file and moves it atomically into persistent storage.
 */
export async function getOrDownloadTrailGeoJson(
  mountainIdOrPath: SupportedMountainId,
  fileName?: string,
  forceRefresh = false,
): Promise<string> {
  let storagePath: string;
  let mountainFolder: string;
  let targetFile: string;

  if (mountainIdOrPath.includes("/")) {
    // Direct path provided: e.g. "trail_routes/pulag/pulag-all.geojson" or "pulag/pulag-all.geojson"
    storagePath = mountainIdOrPath.startsWith("trail_routes/")
      ? mountainIdOrPath
      : `trail_routes/${mountainIdOrPath.replace(/^\/+/, "")}`;
    const parts = storagePath.split("/");
    mountainFolder = parts.length > 2 ? parts[1] : "custom";
    targetFile = parts[parts.length - 1];
  } else {
    mountainFolder = mountainIdOrPath;
    targetFile = fileName || `${mountainIdOrPath}-all.geojson`;
    storagePath = `trail_routes/${mountainFolder}/${targetFile}`;
  }

  // Web fallback: expo-file-system documentDirectory is unavailable on web.
  // We fetch via the main thread and convert to a local blob URL so MapLibre's Web Worker
  // has zero CORS issues and 100% reliable local rendering for all dynamic trails.
  if (Platform.OS === "web" || !FileSystem.documentDirectory) {
    if (!forceRefresh && webBlobCache.has(storagePath)) {
      return webBlobCache.get(storagePath)!;
    }
    const fileRef = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(fileRef);
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${storagePath}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const existingUrl = webBlobCache.get(storagePath);
    if (existingUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      try {
        URL.revokeObjectURL(existingUrl);
      } catch (revokeErr) {
        console.warn("Failed to revoke previous blob URL:", revokeErr);
      }
    }
    webBlobCache.set(storagePath, blobUrl);
    return blobUrl;
  }

  const mountainDir = `${OFFLINE_TRAILS_DIR}/${mountainFolder}`;
  const localUri = `${mountainDir}/${targetFile}`;

  const dirInfo = await FileSystem.getInfoAsync(mountainDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(mountainDir, { intermediates: true });
  }

  if (!forceRefresh) {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists && fileInfo.size > 0) {
      console.log(
        `📂 [TrailOfflineManager] Loaded from OFFLINE cache: ${mountainFolder}/${targetFile}`,
      );
      return localUri;
    }
  }

  try {
    console.log(
      `☁️ [TrailOfflineManager] Downloading from Firebase Storage: ${storagePath}...`,
    );
    const fileRef = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(fileRef);

    const tempUri = `${localUri}.tmp`;
    // Clean up any stale temp file before downloading
    await FileSystem.deleteAsync(tempUri, { idempotent: true });

    const result = await FileSystem.downloadAsync(downloadUrl, tempUri);

    if (result.status !== 200) {
      await FileSystem.deleteAsync(tempUri, { idempotent: true });
      throw new Error(`HTTP ${result.status} downloading ${storagePath}`);
    }

    // Ensure target path is clear before moving on Android
    await FileSystem.deleteAsync(localUri, { idempotent: true });
    await FileSystem.moveAsync({ from: tempUri, to: localUri });

    console.log(
      `✅ [TrailOfflineManager] Saved for offline use: ${mountainFolder}/${targetFile}`,
    );
    return localUri;
  } catch (cloudError) {
    // If a cached copy already exists on disk when forceRefresh fails, return it
    const existingInfo = await FileSystem.getInfoAsync(localUri);
    if (existingInfo.exists && existingInfo.size > 0) {
      return localUri;
    }
    throw cloudError;
  }
}

let webAllMountainsPromise: Promise<string> | null = null;

/**
 * Queries all dynamic trail GeoJSON paths registered across trails in Firestore.
 */
export async function getDynamicTrailGeoJsonPaths(): Promise<string[]> {
  try {
    const snap = await getDocs(collection(db, "trails"));
    if (snap.empty) return [];
    const paths = new Set<string>();
    snap.forEach((doc) => {
      const geoPath = doc.data()?.geography?.geoJsonPath;
      if (typeof geoPath === "string" && geoPath.trim().length > 0) {
        paths.add(geoPath.trim());
      }
    });
    return Array.from(paths);
  } catch (err) {
    console.warn("Could not query dynamic trail GeoJSON paths from Firestore:", err);
    return [];
  }
}

async function buildWebAllMountainsUrl(forceRefresh: boolean): Promise<string> {
  const mountainIds = Object.keys(
    MOUNTAIN_TRAIL_REGISTRY,
  ) as SupportedMountainId[];

  const dynamicPaths = await getDynamicTrailGeoJsonPaths();
  const registeredFilePaths = new Set(
    mountainIds.map(
      (id) =>
        `trail_routes/${id}/${
          MOUNTAIN_TRAIL_REGISTRY[id as keyof typeof MOUNTAIN_TRAIL_REGISTRY].allFile
        }`,
    ),
  );
  const uniqueDynamicPaths = dynamicPaths.filter((path) => {
    const fullPath = path.startsWith("trail_routes/")
      ? path
      : `trail_routes/${path.replace(/^\/+/, "")}`;
    return !registeredFilePaths.has(fullPath);
  });

  const fetchTasks = [
    ...mountainIds.map(async (mountainId) => {
      const url = await getOrDownloadTrailGeoJson(
        mountainId,
        MOUNTAIN_TRAIL_REGISTRY[mountainId as keyof typeof MOUNTAIN_TRAIL_REGISTRY].allFile,
        forceRefresh,
      );
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${mountainId}`);
      return (await res.json()) as { features?: IGeoJSONFeature[] };
    }),
    ...uniqueDynamicPaths.map(async (path) => {
      const url = await getOrDownloadTrailGeoJson(path, undefined, forceRefresh);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
      return (await res.json()) as { features?: IGeoJSONFeature[] };
    }),
  ];

  const results = await Promise.allSettled(fetchTasks);

  const allFeatures: IGeoJSONFeature[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value?.features)) {
      allFeatures.push(...res.value.features);
    } else if (res.status === "rejected") {
      console.warn("Skipping a mountain GeoJSON on web:", res.reason);
    }
  }

  if (allFeatures.length === 0) {
    throw new Error("No mountain GeoJSON could be loaded on web.");
  }

  if (activeWebAllMountainsBlobUrl && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    try {
      URL.revokeObjectURL(activeWebAllMountainsBlobUrl);
    } catch (revokeErr) {
      console.warn("Failed to revoke previous all-mountains blob URL:", revokeErr);
    }
  }

  const blob = new Blob(
    [JSON.stringify({ type: "FeatureCollection", features: allFeatures })],
    { type: "application/geo+json" },
  );
  activeWebAllMountainsBlobUrl = URL.createObjectURL(blob);
  return activeWebAllMountainsBlobUrl;
}

/**
 * Downloads (or returns from offline cache) a combined GeoJSON containing all 5 mountains
 * (`batulao`, `kulis`, `daraitan`, `tagapo`, `sembrano`) from Firebase `trail_routes/`.
 * Fetches all 5 mountains in parallel for fast initial load.
 */
export async function getOrDownloadAllMountainsGeoJson(
  forceRefresh = false,
): Promise<string> {
  if (Platform.OS === "web") {
    if (forceRefresh || !webAllMountainsPromise) {
      webAllMountainsPromise = buildWebAllMountainsUrl(forceRefresh).catch(err => {
        webAllMountainsPromise = null; // allow retry after a failure
        throw err;
      });
    }
    return webAllMountainsPromise;
  }

  if (!FileSystem.documentDirectory) {
    return getOrDownloadTrailGeoJson("batulao", undefined, forceRefresh);
  }

  const dirInfo = await FileSystem.getInfoAsync(OFFLINE_TRAILS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OFFLINE_TRAILS_DIR, {
      intermediates: true,
    });
  }

  const combinedUri = `${OFFLINE_TRAILS_DIR}/all_mountains_combined.geojson`;

  if (!forceRefresh) {
    const info = await FileSystem.getInfoAsync(combinedUri);
    if (info.exists && info.size > 0) {
      console.log(
        "📂 [TrailOfflineManager] Loaded combined mountains from OFFLINE cache",
      );
      return combinedUri;
    }
  }

  const mountainIds = Object.keys(
    MOUNTAIN_TRAIL_REGISTRY,
  ) as SupportedMountainId[];

  const dynamicPaths = await getDynamicTrailGeoJsonPaths();
  const registeredFilePaths = new Set(
    mountainIds.map(
      (id) =>
        `trail_routes/${id}/${
          MOUNTAIN_TRAIL_REGISTRY[id as keyof typeof MOUNTAIN_TRAIL_REGISTRY].allFile
        }`,
    ),
  );
  const uniqueDynamicPaths = dynamicPaths.filter((path) => {
    const fullPath = path.startsWith("trail_routes/")
      ? path
      : `trail_routes/${path.replace(/^\/+/, "")}`;
    return !registeredFilePaths.has(fullPath);
  });

  const fetchTasks = [
    ...mountainIds.map(async (mountainId) => {
      const uri = await getOrDownloadTrailGeoJson(
        mountainId,
        MOUNTAIN_TRAIL_REGISTRY[mountainId as keyof typeof MOUNTAIN_TRAIL_REGISTRY].allFile,
        forceRefresh,
      );
      return readGeoJsonFromUri(uri);
    }),
    ...uniqueDynamicPaths.map(async (path) => {
      const uri = await getOrDownloadTrailGeoJson(path, undefined, forceRefresh);
      return readGeoJsonFromUri(uri);
    }),
  ];

  const results = await Promise.allSettled(fetchTasks);

  const allFeatures: IGeoJSONFeature[] = [];
  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value?.features)) {
      allFeatures.push(...res.value.features);
    }
  }

  if (allFeatures.length === 0) {
    const existingInfo = await FileSystem.getInfoAsync(combinedUri);
    if (existingInfo.exists && existingInfo.size > 0) {
      return combinedUri;
    }
    throw new Error(
      "No mountain GeoJSON files available offline or from Firebase trail_routes/.",
    );
  }

  const collection = {
    type: "FeatureCollection",
    features: allFeatures,
  };

  await FileSystem.writeAsStringAsync(combinedUri, JSON.stringify(collection));
  return combinedUri;
}

/**
 * Downloads all individual and combined trail GeoJSON files for a mountain
 * so the hiker can use them 100% offline in the mountains.
 */
export async function downloadMountainForOffline(
  mountainId: SupportedMountainId,
  forceRefresh = false,
): Promise<string[]> {
  const manifest = MOUNTAIN_TRAIL_REGISTRY[mountainId];
  if (!manifest) {
    throw new Error(`Unknown mountainId: ${mountainId}`);
  }

  const filesToDownload = [
    manifest.allFile,
    ...manifest.trails.map(t => t.fileName),
  ];

  return Promise.all(
    filesToDownload.map(file =>
      getOrDownloadTrailGeoJson(mountainId, file, forceRefresh),
    ),
  );
}

/**
 * Checks whether a mountain's GeoJSON package is already saved in local offline storage.
 */
export async function isMountainDownloadedOffline(
  mountainId: SupportedMountainId,
): Promise<boolean> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return false;

  const manifest = MOUNTAIN_TRAIL_REGISTRY[mountainId];
  if (!manifest) return false;

  const localUri = `${OFFLINE_TRAILS_DIR}/${mountainId}/${manifest.allFile}`;
  const info = await FileSystem.getInfoAsync(localUri);
  return Boolean(info.exists && info.size > 0);
}

/**
 * Deletes cached offline trail files for a specific mountain to free up storage.
 */
export async function deleteOfflineMountain(
  mountainId: SupportedMountainId,
): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;

  const mountainDir = `${OFFLINE_TRAILS_DIR}/${mountainId}`;
  const info = await FileSystem.getInfoAsync(mountainDir);
  if (info.exists) {
    await FileSystem.deleteAsync(mountainDir, { idempotent: true });
  }
}
