import { MaterialIcons } from "@expo/vector-icons";
import * as maplibregl from "maplibre-gl";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  getOrDownloadAllMountainsGeoJson,
  getOrDownloadTrailGeoJson,
  MOUNTAIN_TRAIL_REGISTRY,
  resolveMountainId,
  resolveMountainIdByCoords,
} from "./services/TrailOfflineManager";
import { FREE_OFFLINE_STYLE, onlineStyle } from "./styles/onlineStyle";

/* -------------------------------------------------------------------------- */
/*  Types (keep identical to TrailMap.native.tsx so callers don't change)      */
/* -------------------------------------------------------------------------- */

export interface HikerLocation {
  id: string;
  latitude: number;
  longitude: number;
  hikerName?: string;
  timestamp?: Date | string | number;
  altitude?: number | null;
  status?: string;
}

export interface TrailMapProps {
  initialLon?: number | string | (number | string)[];
  initialLat?: number | string | (number | string)[];
  mountainId?: string;
  trailFileName?: string;
  geoJsonPath?: string;
  showControls?: boolean;
  showRecenter?: boolean;
  bottomInset?: number;
  compassPosition?: unknown;
  attributionPosition?: unknown;
  hikerLocations?: HikerLocation[];
  currentUserId?: string;
  isOffline?: boolean;
}

export interface TrailMapRef {
  centerOnUser: () => void;
  centerOnCoordinate: (lon: number, lat: number) => void;
  flyTo?: (options: { center: [number, number]; zoom?: number; duration?: number }) => void;
  toggleOffline: () => void;
  exportHikeData: () => void;
  startBackgroundTracking: () => Promise<void>;
  stopBackgroundTracking: () => Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*  Helpers (TODO: move to a shared file used by both native and web)          */
/* -------------------------------------------------------------------------- */

const LKL_MINUTES = 2;
const GHOST_TTL_MS = 24 * 60 * 60 * 1000;

function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (!isFinite(lat) || !isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function toMs(timestamp?: Date | string | number): number {
  if (!timestamp) return 0;
  const ms = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
  return isNaN(ms) ? 0 : ms;
}

function getElapsedMinutes(timestamp?: Date | string | number, now = Date.now()): number {
  const ms = toMs(timestamp);
  if (!ms) return 0;
  return Math.floor(Math.max(0, now - ms) / 60000);
}

function formatTimeAgo(timestamp?: Date | string | number, now = Date.now()): string {
  const mins = getElapsedMinutes(timestamp, now);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

function formatRecordedTime(timestamp?: Date | string | number): string {
  const ms = toMs(timestamp);
  if (!ms) return "Unknown";
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/** Walks any GeoJSON and extends bounds with every coordinate pair found. */
function computeBounds(geojson: unknown): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  let found = false;
  const walk = (node: unknown) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      bounds.extend([node[0], node[1]]);
      found = true;
      return;
    }
    node.forEach(walk);
  };
  const g = geojson as {
    type?: string;
    features?: { geometry?: { coordinates?: unknown } }[];
    geometry?: { coordinates?: unknown };
    coordinates?: unknown;
  };
  if (g?.features) g.features.forEach((f) => walk(f.geometry?.coordinates));
  else if (g?.geometry) walk(g.geometry.coordinates);
  else walk(g?.coordinates);
  return found ? bounds : null;
}

function getFirstSymbolLayerId(map: maplibregl.Map): string | undefined {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") {
      return layer.id;
    }
  }
  return undefined;
}

function ensureMapLibreCss() {
  const id = "maplibre-gl-css";
  if (typeof document === "undefined") return;
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl.css`;
    document.head.appendChild(link);
  }
  const customStyleId = "maplibre-custom-css";
  if (!document.getElementById(customStyleId)) {
    const style = document.createElement("style");
    style.id = customStyleId;
    style.textContent = `
      .hide-maplibre-controls .maplibregl-ctrl-top-right,
      .hide-maplibre-controls .maplibregl-ctrl-bottom-left,
      .hide-maplibre-controls .maplibregl-ctrl-top-left,
      .hide-maplibre-controls .maplibregl-ctrl-bottom-right {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function ensureMapLibreWorker() {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

/* -------------------------------------------------------------------------- */
/*  DOM marker construction (maplibre-gl markers are plain HTMLElements)       */
/* -------------------------------------------------------------------------- */

interface HikerEntry {
  marker: maplibregl.Marker;
  circle: HTMLDivElement;
  initials: HTMLSpanElement;
  badge: HTMLDivElement;
  label: HTMLDivElement;
  hiker: HikerLocation;
  current: [number, number];
  raf: number | null;
}

function buildHikerEntry(hiker: HikerLocation, onClick: (h: HikerLocation) => void): HikerEntry {
  const root = document.createElement("div");
  Object.assign(root.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
  });

  const circle = document.createElement("div");
  Object.assign(circle.style, {
    position: "relative",
    width: "32px",
    height: "32px",
    borderRadius: "16px",
    border: "2px solid #FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  });

  const initials = document.createElement("span");
  Object.assign(initials.style, { color: "#fff", fontSize: "11px", fontWeight: "700", fontFamily: "sans-serif" });
  circle.appendChild(initials);

  const badge = document.createElement("div");
  badge.textContent = "!";
  Object.assign(badge.style, {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    width: "14px",
    height: "14px",
    borderRadius: "7px",
    background: "#B45309",
    border: "1.5px solid #fff",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "700",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  });
  circle.appendChild(badge);

  const label = document.createElement("div");
  Object.assign(label.style, {
    marginTop: "4px",
    padding: "3px 8px",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "700",
    fontFamily: "sans-serif",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  });

  root.appendChild(circle);
  root.appendChild(label);

  const entry: HikerEntry = {
    marker: new maplibregl.Marker({ element: root, anchor: "center" }),
    circle,
    initials,
    badge,
    label,
    hiker,
    current: [hiker.longitude, hiker.latitude],
    raf: null,
  };

  root.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(entry.hiker);
  });

  return entry;
}

function refreshHikerEntry(entry: HikerEntry, now: number) {
  const { hiker } = entry;
  const isLkl = getElapsedMinutes(hiker.timestamp, now) >= LKL_MINUTES;
  entry.initials.textContent = getInitials(hiker.hikerName); // textContent: safe against XSS
  entry.circle.style.background = isLkl ? "#D97706" : "#E65100";
  entry.circle.style.borderColor = isLkl ? "#FEF3C7" : "#FFFFFF";
  entry.badge.style.display = isLkl ? "flex" : "none";
  entry.label.style.background = isLkl ? "rgba(180,83,9,0.95)" : "rgba(15,23,42,0.85)";
  entry.label.textContent = isLkl
    ? `Signal Lost \u2022 ${formatTimeAgo(hiker.timestamp, now)}`
    : hiker.hikerName || "Hiker";
}

function animateEntryTo(entry: HikerEntry, target: [number, number]) {
  if (entry.raf !== null) cancelAnimationFrame(entry.raf);
  const start = entry.current;
  const dLon = target[0] - start[0];
  const dLat = target[1] - start[1];
  const distSq = dLon * dLon + dLat * dLat;

  // Same snap rules as native: negligible move or huge warp => no animation
  if (distSq < 1e-9 || distSq > 0.0025) {
    entry.current = target;
    entry.marker.setLngLat(target);
    entry.raf = null;
    return;
  }

  const duration = 1200;
  const t0 = performance.now();
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / duration);
    const eased = 1 - (1 - p) * (1 - p); // easeOutQuad
    entry.current = [start[0] + dLon * eased, start[1] + dLat * eased];
    entry.marker.setLngLat(entry.current);
    entry.raf = p < 1 ? requestAnimationFrame(step) : null;
  };
  entry.raf = requestAnimationFrame(step);
}

let sharedMap: maplibregl.Map | null = null;
let sharedContainer: HTMLDivElement | null = null;
let sharedLoaded = false;
let sharedContextUrl: string | null = null;
let sharedActiveUrl: string | null = null;

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

const CONTEXT_TRAIL_SOURCE = "context-trail-source";
const CONTEXT_TRAIL_CASING = "context-trail-casing";
const CONTEXT_TRAIL_MAIN = "context-trail-main";

const ACTIVE_TRAIL_SOURCE = "active-trail-source";
const ACTIVE_TRAIL_CASING = "active-trail-casing";
const ACTIVE_TRAIL_MAIN = "active-trail-main";
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

const TrailMap = memo(
  forwardRef<TrailMapRef, TrailMapProps>(
    ({ initialLon, initialLat, mountainId, trailFileName, geoJsonPath, showControls = true, bottomInset = 24, hikerLocations = [], currentUserId, isOffline: isOfflineProp }, ref) => {
      const containerRef = useRef<HTMLDivElement | null>(null);
      const mapRef = useRef<maplibregl.Map | null>(null);
      const hikerEntriesRef = useRef<Map<string, HikerEntry>>(new Map());
      const userMarkerRef = useRef<maplibregl.Marker | null>(null);
      const userCoordsRef = useRef<[number, number] | null>(null);
      const geoWatchRef = useRef<number | null>(null);
      const isFollowingRef = useRef(false);

      const [isOffline, setIsOffline] = useState(isOfflineProp ?? true);
      const isOfflineRef = useRef(isOffline);
      const currentAppliedStyleRef = useRef<string | null>(null);
      const [styleVersion, setStyleVersion] = useState(0);

      useEffect(() => {
        if (isOfflineProp !== undefined && isOfflineProp !== isOfflineRef.current) {
          isOfflineRef.current = isOfflineProp;
          setIsOffline(isOfflineProp);
        }
      }, [isOfflineProp]);

      const [mapReady, setMapReady] = useState(() => sharedLoaded);
      const [contextGeoJsonUrl, setContextGeoJsonUrl] = useState<string | null>(null);
      const [activeGeoJsonUrl, setActiveGeoJsonUrl] = useState<string | null>(null);
      const [selectedHiker, setSelectedHiker] = useState<HikerLocation | null>(null);
      const [notice, setNotice] = useState<string | null>(null);
      const [, forceTick] = useState(0);

      const lonStr = Array.isArray(initialLon) ? initialLon[0] : initialLon;
      const latStr = Array.isArray(initialLat) ? initialLat[0] : initialLat;
      const parsedLon = Number(lonStr);
      const parsedLat = Number(latStr);
      const hasInitialCoords = !!(lonStr && latStr && !isNaN(parsedLon) && !isNaN(parsedLat));
      const hasInitialCoordsRef = useRef(hasInitialCoords);
      const centeredOnUserRef = useRef(false);
      const trailBoundsRef = useRef<maplibregl.LngLatBounds | null>(null);

      useEffect(() => {
        hasInitialCoordsRef.current = hasInitialCoords;
      }, [hasInitialCoords]);

      const showNotice = useCallback((msg: string) => {
        setNotice(msg);
        setTimeout(() => setNotice(null), 3500);
      }, []);

      /* ---------------------------- Map lifecycle --------------------------- */
      useEffect(() => {
        const host = containerRef.current;
        if (!host) return;
        ensureMapLibreCss();
        ensureMapLibreWorker();

        let map = sharedMap;
        const initialStyle = (isOffline ? FREE_OFFLINE_STYLE : onlineStyle) as unknown as maplibregl.StyleSpecification | string;
        if (!map || !sharedContainer) {
          sharedContainer = document.createElement("div");
          sharedContainer.style.cssText = "width:100%;height:100%;position:absolute;inset:0";
          host.appendChild(sharedContainer);

          map = new maplibregl.Map({
            container: sharedContainer,
            style: initialStyle,
            center: hasInitialCoords ? [parsedLon, parsedLat] : [120.9842, 14.5995],
            zoom: hasInitialCoords ? 12 : 14,
            minZoom: 10,
            maxZoom: 20,
            attributionControl: { compact: true },
          });
          currentAppliedStyleRef.current = isOffline ? FREE_OFFLINE_STYLE : onlineStyle;
          map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
          map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
          map.once("load", () => {
            sharedLoaded = true;
          });
          sharedMap = map;
        } else {
          host.appendChild(sharedContainer);
          map.resize();
        }

        mapRef.current = map;

        // Per-mount listeners, removed on unmount so they never point at a dead component
        const onLoad = () => setMapReady(true);
        const onStyleLoad = () => {
          sharedContextUrl = null;
          sharedActiveUrl = null;
          setStyleVersion((v) => v + 1);
        };
        const onDragStart = () => {
          isFollowingRef.current = false;
        };
        if (!sharedLoaded) {
          if (map.loaded()) requestAnimationFrame(onLoad); // setState happens in a callback
          else map.once("load", onLoad);
        } else {
          map.once("load", onLoad);
        }
        map.on("style.load", onStyleLoad);
        map.on("dragstart", onDragStart);

        const ro = new ResizeObserver(() => map.resize());
        ro.observe(host);

        const hikerEntries = hikerEntriesRef.current;
        return () => {
          ro.disconnect();
          map.off("load", onLoad);
          map.off("style.load", onStyleLoad);
          map.off("dragstart", onDragStart);
          hikerEntries.forEach((e) => {
            if (e.raf !== null) cancelAnimationFrame(e.raf);
            e.marker.remove();
          });
          hikerEntries.clear();
          if (geoWatchRef.current !== null) navigator.geolocation?.clearWatch(geoWatchRef.current);
          geoWatchRef.current = null;
          userMarkerRef.current?.remove();
          userMarkerRef.current = null;

          // Detach, but do NOT call map.remove(): the map survives for the next mount
          if (sharedContainer && sharedContainer.parentNode === host) host.removeChild(sharedContainer);
          mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      /* ----------------------------- Basemap style swap --------------------- */
      useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const targetStyle = isOffline ? FREE_OFFLINE_STYLE : onlineStyle;
        if (currentAppliedStyleRef.current === targetStyle) return;

        currentAppliedStyleRef.current = targetStyle;
        sharedContextUrl = null;
        sharedActiveUrl = null;
        map.setStyle(targetStyle as unknown as maplibregl.StyleSpecification | string);
      }, [isOffline, mapReady]);

      /* --------------------------- Resolve trail URLs ------------------------ */
      useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const hasExplicitTrail = !!(
              (geoJsonPath && typeof geoJsonPath === "string" && geoJsonPath.trim().length > 0) ||
              trailFileName
            );

            const targetMountain =
              resolveMountainId(mountainId) ||
              (hasInitialCoords ? resolveMountainIdByCoords(parsedLat, parsedLon) : null);

            let activeUrl: string | null = null;
            let contextUrl: string | null = null;

            if (hasExplicitTrail) {
              // 1. Resolve Active Selected Trail
              if (geoJsonPath && typeof geoJsonPath === "string" && geoJsonPath.trim().length > 0) {
                activeUrl = await getOrDownloadTrailGeoJson(geoJsonPath.trim());
              } else if (targetMountain && trailFileName) {
                activeUrl = await getOrDownloadTrailGeoJson(targetMountain, trailFileName);
              }

              // 2. Resolve Context Trail Network (e.g. Mountain network or All Mountains)
              if (targetMountain && MOUNTAIN_TRAIL_REGISTRY[targetMountain]?.allFile) {
                contextUrl = await getOrDownloadTrailGeoJson(
                  targetMountain,
                  MOUNTAIN_TRAIL_REGISTRY[targetMountain].allFile
                );
              }
              if (!contextUrl) {
                contextUrl = await getOrDownloadAllMountainsGeoJson();
              }
            } else {
              // Overview mode: no specific trail selected
              activeUrl = null;
              if (targetMountain && MOUNTAIN_TRAIL_REGISTRY[targetMountain]?.allFile) {
                contextUrl = await getOrDownloadTrailGeoJson(
                  targetMountain,
                  MOUNTAIN_TRAIL_REGISTRY[targetMountain].allFile
                );
              }
              if (!contextUrl) {
                contextUrl = await getOrDownloadAllMountainsGeoJson();
              }
            }

            // If active and context point to the exact same file, treat as single-layer overview
            if (activeUrl && activeUrl === contextUrl) {
              activeUrl = null;
            }

            if (!cancelled) {
              setActiveGeoJsonUrl(activeUrl);
              setContextGeoJsonUrl(contextUrl);
            }
          } catch (err) {
            console.warn("Failed to resolve trail GeoJSON layers:", err);
          }
        })();
        return () => {
          cancelled = true;
        };
      }, [geoJsonPath, mountainId, trailFileName, hasInitialCoords, parsedLat, parsedLon]);

      /* ----------------------------- Trail layers --------------------------- */
      useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady || !map.isStyleLoaded()) return;

        const beforeLayerId = getFirstSymbolLayerId(map);

        // 1. Context Trail Source & Layers (Surrounding trail network)
        if (contextGeoJsonUrl) {
          const existingContext = map.getSource(CONTEXT_TRAIL_SOURCE) as maplibregl.GeoJSONSource | undefined;
          if (existingContext) {
            if (sharedContextUrl !== contextGeoJsonUrl) {
              existingContext.setData(contextGeoJsonUrl);
              sharedContextUrl = contextGeoJsonUrl;
            }
          } else {
            map.addSource(CONTEXT_TRAIL_SOURCE, { type: "geojson", data: contextGeoJsonUrl });
            map.addLayer(
              {
                id: CONTEXT_TRAIL_CASING,
                type: "line",
                source: CONTEXT_TRAIL_SOURCE,
                layout: { "line-cap": "round", "line-join": "round" },
                paint: {
                  "line-color": "#FFFFFF",
                  "line-width": activeGeoJsonUrl ? 4 : 6,
                  "line-opacity": activeGeoJsonUrl ? 0.2 : 0.55,
                },
              },
              beforeLayerId
            );
            map.addLayer(
              {
                id: CONTEXT_TRAIL_MAIN,
                type: "line",
                source: CONTEXT_TRAIL_SOURCE,
                layout: { "line-cap": "round", "line-join": "round" },
                paint: {
                  "line-color": activeGeoJsonUrl ? "#94A3B8" : "#16A34A",
                  "line-width": activeGeoJsonUrl ? 2.5 : 4,
                  "line-opacity": activeGeoJsonUrl ? 0.55 : 0.88,
                },
              },
              beforeLayerId
            );
            sharedContextUrl = contextGeoJsonUrl;
          }

          // Dynamically adjust context layer styling based on whether an active trail is selected
          if (map.getLayer(CONTEXT_TRAIL_MAIN)) {
            map.setPaintProperty(CONTEXT_TRAIL_MAIN, "line-color", activeGeoJsonUrl ? "#94A3B8" : "#16A34A");
            map.setPaintProperty(CONTEXT_TRAIL_MAIN, "line-width", activeGeoJsonUrl ? 2.5 : 4);
            map.setPaintProperty(CONTEXT_TRAIL_MAIN, "line-opacity", activeGeoJsonUrl ? 0.55 : 0.88);
          }
          if (map.getLayer(CONTEXT_TRAIL_CASING)) {
            map.setPaintProperty(CONTEXT_TRAIL_CASING, "line-width", activeGeoJsonUrl ? 4 : 6);
            map.setPaintProperty(CONTEXT_TRAIL_CASING, "line-opacity", activeGeoJsonUrl ? 0.2 : 0.55);
          }
        }

        // 2. Active Highlight Trail Source & Layers (Foreground selected route)
        const existingActive = map.getSource(ACTIVE_TRAIL_SOURCE) as maplibregl.GeoJSONSource | undefined;
        const activeData = activeGeoJsonUrl || EMPTY_GEOJSON;
        if (existingActive) {
          if (sharedActiveUrl !== activeGeoJsonUrl) {
            existingActive.setData(activeData);
            sharedActiveUrl = activeGeoJsonUrl;
          }
        } else {
          map.addSource(ACTIVE_TRAIL_SOURCE, { type: "geojson", data: activeData });
          map.addLayer(
            {
              id: ACTIVE_TRAIL_CASING,
              type: "line",
              source: ACTIVE_TRAIL_SOURCE,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#FFFFFF", "line-width": 8, "line-opacity": 0.9 },
            },
            beforeLayerId
          );
          map.addLayer(
            {
              id: ACTIVE_TRAIL_MAIN,
              type: "line",
              source: ACTIVE_TRAIL_SOURCE,
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": "#16A34A", "line-width": 5.5, "line-opacity": 1.0 },
            },
            beforeLayerId
          );
          sharedActiveUrl = activeGeoJsonUrl;
        }

        // Ensure layer ordering: keep trails below all symbol/label layers
        if (beforeLayerId) {
          if (map.getLayer(CONTEXT_TRAIL_CASING)) map.moveLayer(CONTEXT_TRAIL_CASING, beforeLayerId);
          if (map.getLayer(CONTEXT_TRAIL_MAIN)) map.moveLayer(CONTEXT_TRAIL_MAIN, beforeLayerId);
          if (map.getLayer(ACTIVE_TRAIL_CASING)) map.moveLayer(ACTIVE_TRAIL_CASING, beforeLayerId);
          if (map.getLayer(ACTIVE_TRAIL_MAIN)) map.moveLayer(ACTIVE_TRAIL_MAIN, beforeLayerId);
        }

        // Ensure active layer color is updated if layer already exists
        if (map.getLayer(ACTIVE_TRAIL_MAIN)) {
          map.setPaintProperty(ACTIVE_TRAIL_MAIN, "line-color", "#16A34A");
          map.setPaintProperty(ACTIVE_TRAIL_MAIN, "line-width", 5.5);
          map.setPaintProperty(ACTIVE_TRAIL_MAIN, "line-opacity", 1.0);
        }
        if (map.getLayer(ACTIVE_TRAIL_CASING)) {
          map.setPaintProperty(ACTIVE_TRAIL_CASING, "line-width", 8.5);
          map.setPaintProperty(ACTIVE_TRAIL_CASING, "line-opacity", 0.95);
        }

        // Fit bounds to active trail (or context trail network) when no explicit initial coordinates
        const fitTarget = activeGeoJsonUrl || contextGeoJsonUrl;
        if (!hasInitialCoords && fitTarget) {
          fetch(fitTarget)
            .then((r) => r.json())
            .then((json) => {
              trailBoundsRef.current = computeBounds(json);
            })
            .catch((err) => {
              console.warn("Trail fetch failed (check Firebase Storage CORS):", err);
            });
        }
      }, [mapReady, contextGeoJsonUrl, activeGeoJsonUrl, styleVersion, hasInitialCoords, showNotice]);

      /* --------------------------- Initial fly-to --------------------------- */
      useEffect(() => {
        if (!mapReady || !hasInitialCoords) return;
        isFollowingRef.current = false;
        mapRef.current?.flyTo({ center: [parsedLon, parsedLat], zoom: 14, duration: 800 });
      }, [mapReady, hasInitialCoords, parsedLon, parsedLat]);

      /* ------------------------ Browser geolocation dot --------------------- */
      const ensureGeolocation = useCallback(() => {
        if (geoWatchRef.current !== null || !("geolocation" in navigator)) return;
        geoWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            if (!isValidCoordinate(latitude, longitude)) return;
            const lngLat: [number, number] = [longitude, latitude];
            userCoordsRef.current = lngLat;

            const map = mapRef.current;
            if (!map) return;
            if (!userMarkerRef.current) {
              const el = document.createElement("div");
              Object.assign(el.style, {
                width: "16px",
                height: "16px",
                borderRadius: "8px",
                background: "#2563EB",
                border: "2.5px solid #fff",
                boxShadow: "0 0 0 8px rgba(37,99,235,0.2), 0 2px 3px rgba(0,0,0,0.35)",
                pointerEvents: "none",
              });
              userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
            } else {
              userMarkerRef.current.setLngLat(lngLat);
            }
            if (!centeredOnUserRef.current && !hasInitialCoordsRef.current) {
              // First fix: zoom to the user once, then keep following (same as native)
              centeredOnUserRef.current = true;
              isFollowingRef.current = true;
              map.flyTo({ center: lngLat, zoom: 16, duration: 800 });
            } else if (isFollowingRef.current) {
              map.easeTo({ center: lngLat, duration: 500 });
            }
          },
          (err) => {
            console.warn("Geolocation error:", err.message);
            showNotice("Location unavailable. Allow location access (HTTPS required).");
            if (!centeredOnUserRef.current && !hasInitialCoordsRef.current && trailBoundsRef.current) {
              mapRef.current?.fitBounds(trailBoundsRef.current, { padding: 60, duration: 800 });
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        );
      }, [showNotice]);

      useEffect(() => {
        if (mapReady) ensureGeolocation();
      }, [mapReady, ensureGeolocation]);

      /* --------------------------- Hiker markers ---------------------------- */
      const handleHikerPress = useCallback((h: HikerLocation) => setSelectedHiker(h), []);

      useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapReady) return;
        const entries = hikerEntriesRef.current;
        const now = Date.now();
        const seen = new Set<string>();

        hikerLocations.forEach((hiker) => {
          if (!hiker || !isValidCoordinate(hiker.latitude, hiker.longitude)) return;
          if (currentUserId && hiker.id === currentUserId) return;
          const ts = toMs(hiker.timestamp);
          if (ts > 0 && now - ts > GHOST_TTL_MS) return; // 24h ghost-pin TTL

          seen.add(hiker.id);
          const target: [number, number] = [hiker.longitude, hiker.latitude];
          let entry = entries.get(hiker.id);
          if (!entry) {
            entry = buildHikerEntry(hiker, handleHikerPress);
            entry.marker.setLngLat(target).addTo(map);
            entries.set(hiker.id, entry);
          } else {
            entry.hiker = hiker;
            animateEntryTo(entry, target);
          }
          refreshHikerEntry(entry, now);
        });

        // Remove markers for hikers that are gone / expired
        entries.forEach((entry, id) => {
          if (!seen.has(id)) {
            if (entry.raf !== null) cancelAnimationFrame(entry.raf);
            entry.marker.remove();
            entries.delete(id);
          }
        });
      }, [hikerLocations, currentUserId, mapReady, handleHikerPress]);

      // 10s ticker so LKL state flips even if no new pings arrive
      useEffect(() => {
        const id = setInterval(() => {
          const now = Date.now();
          hikerEntriesRef.current.forEach((e) => refreshHikerEntry(e, now));
          forceTick((n) => n + 1);
        }, 10000);
        return () => clearInterval(id);
      }, []);

      const liveSelectedHiker = useMemo(() => {
        if (!selectedHiker) return null;
        return hikerLocations.find((h) => h.id === selectedHiker.id) || selectedHiker;
      }, [selectedHiker, hikerLocations]);

      const isSelectedLkl = liveSelectedHiker
        ? getElapsedMinutes(liveSelectedHiker.timestamp) >= LKL_MINUTES
        : false;

      /* ---------------------------- Imperative API -------------------------- */
      useImperativeHandle(ref, () => ({
        centerOnUser: () => {
          ensureGeolocation();
          isFollowingRef.current = true;
          const c = userCoordsRef.current;
          const map = mapRef.current;
          if (c && map) {
            map.easeTo({ center: c, zoom: Math.max(map.getZoom(), 16.5), bearing: 0, pitch: 0, duration: 500 });
          } else {
            // First fix hasn't arrived yet; the watch callback will follow once it does
            showNotice("Finding your location…");
          }
        },
        centerOnCoordinate: (lon, lat) => {
          isFollowingRef.current = false;
          mapRef.current?.flyTo({ center: [lon, lat], zoom: 14, duration: 800 });
        },
        flyTo: (o) => {
          isFollowingRef.current = false;
          mapRef.current?.flyTo({ center: o.center, zoom: o.zoom ?? 17, duration: o.duration ?? 800 });
        },
        toggleOffline: () => {
          setIsOffline((prev) => {
            const next = !prev;
            isOfflineRef.current = next;
            return next;
          });
        },
        exportHikeData: () => showNotice("Hike export is only available in the mobile app."),
        startBackgroundTracking: async () => {
          showNotice("Recording hikes requires the mobile app.");
        },
        stopBackgroundTracking: async () => { },
      }));

      /* ------------------------------ Rescue actions ------------------------ */
      const dispatchCoordinates = useCallback(async () => {
        if (!liveSelectedHiker) return;
        const name = liveSelectedHiker.hikerName || "Hiker";
        const lat = liveSelectedHiker.latitude.toFixed(6);
        const lon = liveSelectedHiker.longitude.toFixed(6);
        const time = formatRecordedTime(liveSelectedHiker.timestamp);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        const message = `[THRAIL SEARCH & RESCUE]\nHiker: ${name}\nStatus: ${isSelectedLkl ? "LAST KNOWN LOCATION (Signal Lost)" : "LIVE SIGNAL"
          }\nCoordinates: ${lat}, ${lon}\nRecorded: ${time}\nMap: ${mapUrl}`;

        try {
          if (typeof navigator.share === "function") {
            await navigator.share({ title: `Emergency Rescue Coordinates: ${name}`, text: message });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(message);
            showNotice("Rescue info copied to clipboard.");
          } else {
            window.open(mapUrl, "_blank", "noopener");
          }
        } catch {
          /* user cancelled the share sheet */
        }
      }, [liveSelectedHiker, isSelectedLkl, showNotice]);

      const focusSelected = useCallback(() => {
        if (!liveSelectedHiker) return;
        isFollowingRef.current = false;
        mapRef.current?.easeTo({
          center: [liveSelectedHiker.longitude, liveSelectedHiker.latitude],
          zoom: 16.5,
          duration: 700,
        });
      }, [liveSelectedHiker]);

      /* --------------------------------- UI --------------------------------- */
      return (
        <View style={styles.page}>
          {/* Plain DOM node: maplibre-gl needs a real HTMLElement (valid because this file is web-only) */}
          <div
            ref={containerRef}
            className={!showControls ? "hide-maplibre-controls" : undefined}
            style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
          />

          {notice && (
            <View style={styles.notice} pointerEvents="none">
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {liveSelectedHiker && (
            <View style={[styles.rescueCardContainer, { bottom: bottomInset }]} pointerEvents="box-none">
              <View style={styles.rescueCard}>
                <View style={styles.rescueCardHeader}>
                  <View style={styles.rescueCardTitleGroup}>
                    <View style={[styles.indicator, { backgroundColor: isSelectedLkl ? "#F59E0B" : "#10B981" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hikerName} numberOfLines={1}>
                        {liveSelectedHiker.hikerName || "Group Hiker"}
                      </Text>
                      <Text style={styles.statusSub}>
                        {isSelectedLkl
                          ? `⚠️ Last Known Location • ${formatTimeAgo(liveSelectedHiker.timestamp)}`
                          : "🟢 Live Signal • Active"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedHiker(null)} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                  <GridCell label="LATITUDE" value={liveSelectedHiker.latitude.toFixed(6)} />
                  <GridCell label="LONGITUDE" value={liveSelectedHiker.longitude.toFixed(6)} />
                  <GridCell
                    label="ALTITUDE"
                    value={liveSelectedHiker.altitude != null ? `${Math.round(liveSelectedHiker.altitude)} m` : "—"}
                  />
                  <GridCell label="RECORDED" value={formatRecordedTime(liveSelectedHiker.timestamp)} />
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.shareBtn} onPress={dispatchCoordinates}>
                    <MaterialIcons name="share" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.shareBtnText}>Dispatch Coordinates</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.focusBtn} onPress={focusSelected}>
                    <MaterialIcons name="my-location" size={16} color="#1E293B" style={{ marginRight: 4 }} />
                    <Text style={styles.focusBtnText}>Focus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      );
    },
  ),
);

const GridCell = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.gridCol}>
    <Text style={styles.gridLabel}>{label}</Text>
    <Text style={styles.gridValue}>{value}</Text>
  </View>
);

TrailMap.displayName = "TrailMap";

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", height: "100%", position: "relative", overflow: "hidden" },
  notice: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    zIndex: 1000,
  },
  noticeText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  rescueCardContainer: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 999 },
  rescueCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(15,23,42,0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  rescueCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rescueCardTitleGroup: { flexDirection: "row", alignItems: "center", flex: 1 },
  indicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  hikerName: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  statusSub: { color: "#94A3B8", fontSize: 11, fontWeight: "500", marginTop: 1 },
  closeBtn: { padding: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12 },
  grid: {
    flexDirection: "row",
    backgroundColor: "rgba(30,41,59,0.8)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  gridCol: { alignItems: "center", flex: 1 },
  gridLabel: { color: "#64748B", fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  gridValue: { color: "#F8FAFC", fontSize: 11, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  shareBtn: {
    flex: 1,
    backgroundColor: "#E65100",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  focusBtn: {
    backgroundColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  focusBtnText: { color: "#0F172A", fontSize: 12, fontWeight: "700" },
});

export default TrailMap;
