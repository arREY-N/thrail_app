/**
 * @file offlineStyle.ts
 * @description Generates a MapLibre Style JSON for offline map rendering using Protomaps PMTiles.
 * This style is optimized for trail navigation and outdoor use, featuring a robust layer
 * stacking strategy to handle flood-prone water polygons and high-visibility terrain.
 *
 * Layer Order Logic:
 * 1. Background (Ocean)
 * 2. Earth (Base Land)
 * 3. Landuse (Urban/Parks/Forests)
 * 4. Natural (Mountains/Terrain)
 * 5. Water (Lakes/Rivers - rendered after land to allow masking)
 * 6. Buildings (Rendered after water to cover urban flood zones)
 * 7. Roads & Trails
 * 8. Labels
 */

/**
 * Builds a MapLibre-compatible style object for offline use.
 *
 * @param offlineTileUrl - The local pmtiles:// URI for the offline tileset.
 * @param fontBaseDir - The base directory where PBF glyphs are stored on the device.
 * @returns A MapLibre Style object (version 8).
 */
export const buildOfflineStyle = (
  offlineTileUrl: string,
  fontBaseDir: string,
) => ({
  version: 8 as const,

  /**
   * Font glyphs are resolved from the local device filesystem.
   * Spaces in the path are URL-encoded to ensure compatibility with MapLibre's fetcher.
   */
  glyphs: `${fontBaseDir.replace(/ /g, "%20")}{fontstack}/{range}.pbf`,

  sources: {
    /**
     * The primary vector source using Protomaps PMTiles.
     * The 'pmtiles://' protocol is handled by the MapLibre PMTiles plugin.
     */
    protomaps: {
      type: "vector",
      url: offlineTileUrl,
      maxzoom: 14,
      attribution: "© OpenStreetMap, Protomaps",
    },
  },

  layers: [
    // ─── BACKGROUND (ocean/sea base) ────────────────────────────
    /** Renders the base ocean color. Visible where no 'earth' polygons exist. */
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#C4DFF0" },
    },

    // ─── EARTH ──────────────────────────────────────────────────
    /** Renders the base land mass. */
    {
      id: "earth",
      type: "fill",
      source: "protomaps",
      "source-layer": "earth",
      paint: { "fill-color": "#EFE9E1" },
    },

    // ─── LANDUSE ────────────────────────────────────────────────
    /** Urban and environmental land use categories. High opacity ensures masking of underlying water. */
    {
      id: "landuse-park",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: [
        "in", "pmap:kind",
        "national_park", "park", "protected_area",
        "nature_reserve", "golf_course",
      ],
      paint: { "fill-color": "#5DAA40", "fill-opacity": 0.75 },
    },
    {
      id: "landuse-forest",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "forest", "wood"],
      paint: { "fill-color": "#2E8B32", "fill-opacity": 0.85 },
    },
    {
      id: "landuse-scrub-grass",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "scrub", "grassland", "grass"],
      paint: { "fill-color": "#6BAF4E", "fill-opacity": 0.7 },
    },
    {
      id: "landuse-cemetery",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["==", "pmap:kind", "cemetery"],
      paint: { "fill-color": "#B8C9A0", "fill-opacity": 0.8 },
    },
    {
      id: "landuse-urban-green",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "allotments", "village_green", "playground"],
      paint: { "fill-color": "#9cd3b4", "fill-opacity": 0.7 },
    },
    {
      id: "landuse-hospital",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["==", "pmap:kind", "hospital"],
      paint: { "fill-color": "#e4dad9" },
    },
    {
      id: "landuse-industrial",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["==", "pmap:kind", "industrial"],
      paint: { "fill-color": "#d1dde1" },
    },
    {
      id: "landuse-school",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "school", "university", "college"],
      paint: { "fill-color": "#e4ded7" },
    },
    {
      id: "landuse-beach",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["==", "pmap:kind", "beach"],
      paint: { "fill-color": "#e8e4d0" },
    },
    {
      id: "landuse-residential",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "residential", "commercial", "retail"],
      paint: { "fill-color": "#E4DBC8", "fill-opacity": 1.0 },
    },
    {
      id: "landuse-farmland",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "farmland", "farm", "orchard", "vineyard"],
      paint: { "fill-color": "#D6CCA0", "fill-opacity": 1.0 },
    },
    {
      id: "landuse-pedestrian",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "pedestrian", "dam"],
      paint: { "fill-color": "#e3e0d4" },
    },
    /** Catch-all for unnamed landuse features to ensure terrain visibility. */
    {
      id: "landuse-catchall",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["!", ["has", "pmap:kind"]],
      paint: { "fill-color": "#81C784", "fill-opacity": 0.65 },
    },

    // ─── NATURAL (mountain/forest terrain — distinct from base) ──
    /** Natural features like forests and scrub. Saturated greens for high terrain contrast. */
    {
      id: "natural-wood",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "wood", "forest"],
      paint: { "fill-color": "#1B5E20", "fill-opacity": 0.85 },
    },
    {
      id: "natural-scrub",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["==", "pmap:kind", "scrub"],
      paint: { "fill-color": "#33691E", "fill-opacity": 0.8 },
    },
    {
      id: "natural-grassland",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "grassland", "heath"],
      paint: { "fill-color": "#7CB342", "fill-opacity": 0.75 },
    },
    {
      id: "natural-sand",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "beach", "sand"],
      paint: { "fill-color": "#F0DFA0" },
    },
    {
      id: "natural-rock",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "bare_rock", "scree", "rock"],
      paint: { "fill-color": "#8D7B6A", "fill-opacity": 0.9 },
    },
    {
      id: "natural-wetland",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "wetland", "marsh", "swamp"],
      paint: { "fill-color": "#81C784", "fill-opacity": 0.6 },
    },
    /** Catch-all for unnamed natural features (often mountains). */
    {
      id: "natural-catchall",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["!", ["has", "pmap:kind"]],
      paint: { "fill-color": "#66BB6A", "fill-opacity": 0.65 },
    },

    // ─── WATER (after landuse/natural, before buildings) ────────
    /** Renders lakes, ponds, and wide rivers. Rendered after land to allow masking of urban flood zones. */
    {
      id: "water",
      type: "fill",
      source: "protomaps",
      "source-layer": "water",
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": "#80deea" },
    },
    {
      id: "water-river-line",
      type: "line",
      source: "protomaps",
      "source-layer": "water",
      minzoom: 9,
      filter: ["in", "pmap:kind", "river"],
      paint: {
        "line-color": "#80deea",
        "line-width": ["interpolate", ["exponential", 1.6], ["zoom"],
          9, 0, 9.5, 1, 18, 12,
        ],
      },
    },
    {
      id: "water-stream-line",
      type: "line",
      source: "protomaps",
      "source-layer": "water",
      minzoom: 14,
      filter: ["in", "pmap:kind", "stream"],
      paint: {
        "line-color": "#80deea",
        "line-width": 0.5,
      },
    },

    // ─── BUILDINGS (covers water in urban areas) ────────────────
    /** Renders 2D building footprints. Placed after water to hide unwanted flood polygons in cities. */
    {
      id: "buildings",
      type: "fill",
      source: "protomaps",
      "source-layer": "buildings",
      paint: {
        "fill-color": "#C8C0B0",
        "fill-outline-color": "#B0A898",
        "fill-opacity": 0.9,
      },
    },

    // ─── BOUNDARIES ─────────────────────────────────────────────
    {
      id: "boundaries-country",
      type: "line",
      source: "protomaps",
      "source-layer": "boundaries",
      filter: ["==", "pmap:kind", "country"],
      paint: { "line-color": "#8A7060", "line-width": 1.5, "line-dasharray": [4, 3] },
    },
    {
      id: "boundaries-region",
      type: "line",
      source: "protomaps",
      "source-layer": "boundaries",
      filter: ["==", "pmap:kind", "region"],
      paint: { "line-color": "#B0A090", "line-width": 1, "line-dasharray": [3, 3] },
    },

    // ─── ROADS — highway ────────────────────────────────────────
    {
      id: "roads-highway-casing",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: {
        "line-color": "#C07820",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 6, 14, 10],
        "line-cap": "round",
        "line-join": "round",
      },
    },
    {
      id: "roads-highway-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: {
        "line-color": "#F7BC5C",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3, 14, 6],
        "line-cap": "round",
        "line-join": "round",
      },
    },

    // ─── ROADS — major ──────────────────────────────────────────
    {
      id: "roads-major-casing",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "medium_road"],
      paint: {
        "line-color": "#B8B0A0",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4, 14, 7],
        "line-cap": "round",
        "line-join": "round",
      },
    },
    {
      id: "roads-major-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "medium_road"],
      paint: {
        "line-color": "#FAF0D0",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 14, 4],
        "line-cap": "round",
        "line-join": "round",
      },
    },

    // ─── ROADS — minor ──────────────────────────────────────────
    {
      id: "roads-minor-casing",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["!in", "pmap:kind",
        "path", "track", "footway", "pedestrian",
        "highway", "major_road", "medium_road",
      ],
      paint: {
        "line-color": "#C4BCAC",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 2, 14, 4],
        "line-cap": "round",
        "line-join": "round",
      },
    },
    {
      id: "roads-minor-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["!in", "pmap:kind",
        "path", "track", "footway", "pedestrian",
        "highway", "major_road", "medium_road",
      ],
      paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 14, 2.5],
        "line-cap": "round",
        "line-join": "round",
      },
    },

    // ─── TRAILS ─────────────────────────────────────────────────
    /** High-visibility styling for hiking paths and tracks. */
    {
      id: "trails-casing",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway"],
      paint: {
        "line-color": "#C4A882",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 14, 5],
        "line-cap": "round",
        "line-join": "round",
      },
    },
    {
      id: "trails-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway"],
      paint: {
        "line-color": "#8B5E3C",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.5, 14, 3],
        "line-dasharray": [3, 2],
        "line-cap": "round",
      },
    },

    // ─── ROAD LABELS ────────────────────────────────────────────
    {
      id: "roads-labels",
      type: "symbol",
      source: "protomaps",
      "source-layer": "roads",
      minzoom: 12,
      layout: {
        "text-field": ["coalesce", ["get", "name"], ""],
        "text-font": ["NotoSansRegular"],
        "text-size": 11,
        "symbol-placement": "line",
        "text-max-angle": 30,
        "text-padding": 10,
      },
      paint: {
        "text-color": "#5A4A3A",
        "text-halo-color": "rgba(255,255,255,0.85)",
        "text-halo-width": 2,
      },
    },

    // ─── POIS ───────────────────────────────────────────────────
    {
      id: "pois-labels",
      type: "symbol",
      source: "protomaps",
      "source-layer": "pois",
      minzoom: 10,
      layout: {
        "text-field": ["coalesce", ["get", "name"], ""],
        "text-font": ["NotoSansMedium"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#2A4020",
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 2.5,
      },
    },

    // ─── PLACE LABELS ───────────────────────────────────────────
    {
      id: "places-labels",
      type: "symbol",
      source: "protomaps",
      "source-layer": "places",
      minzoom: 5,
      layout: {
        "text-field": ["coalesce", ["get", "name"], ""],
        "text-font": ["NotoSansMedium"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 5, 12, 14, 16],
        "text-max-width": 10,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#1A1A1A",
        "text-halo-color": "rgba(255,255,255,0.85)",
        "text-halo-width": 2,
      },
    },
  ],
});