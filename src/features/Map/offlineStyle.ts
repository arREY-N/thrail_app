export const buildOfflineStyle = (
  offlineTileUrl: string,
  maptilerKey: string,
) => ({
  version: 8 as const,
  glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${maptilerKey}`,
  sources: {
    protomaps: {
      type: "vector",
      url: offlineTileUrl,
      maxzoom: 14,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    // 1. BASE BACKGROUND & EARTH
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F8F4F0" },
    },
    {
      id: "earth",
      type: "fill",
      source: "protomaps",
      "source-layer": "earth",
      paint: { "fill-color": "#F2EBE5" },
    },

    // 2. DETAILED LANDUSE & NATURAL (Forests, Scrub, Sand, Parks)
    {
      id: "natural-wood",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "wood", "forest", "scrub"],
      paint: { "fill-color": "#C3E6C4", "fill-opacity": 0.8 },
    },
    {
      id: "landuse-park",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "park", "nature_reserve", "pitch"],
      paint: { "fill-color": "#D8F1B9" },
    },
    {
      id: "natural-sand",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["==", "pmap:kind", "beach"],
      paint: { "fill-color": "#F6E9CD" },
    },

    // 3. WATER FEATURES
    {
      id: "water",
      type: "fill",
      source: "protomaps",
      "source-layer": "water",
      filter: [
        "all",
        ["!in", "pmap:kind", "wetland", "basin", "ditch", "drain", "playa", "playa_lake", "puddle"],
        ["!in", "natural", "wetland", "marsh", "mud", "bog", "swamp"],
        ["!in", "water", "fish_pond", "salt_pond", "basin", "wetland", "marsh", "wastewater", "aquaculture"],
        ["!in", "landuse", "aquaculture", "basin", "salt_pond"]
      ],
      paint: { "fill-color": "#A0C8F0" }, 
    },
    {
      id: "waterway",
      type: "line",
      source: "protomaps",
      "source-layer": "waterway",
      filter: ["!in", "pmap:kind", "ditch", "drain"],
      paint: { "line-color": "#A0C8F0", "line-width": 1.5 },
    },

    // 4. BOUNDARIES
    {
      id: "boundaries",
      type: "line",
      source: "protomaps",
      "source-layer": "boundaries",
      paint: {
        "line-color": "#A09E9B",
        "line-width": 1,
        "line-dasharray": [3, 3],
      },
    },

    // 5. BUILDINGS
    {
      id: "buildings",
      type: "fill",
      source: "protomaps",
      "source-layer": "buildings",
      paint: { "fill-color": "#E5E1D8", "fill-opacity": 0.8 },
    },

    // 6. DETAILED ROADS & TRAILS
    {
      id: "roads-casing",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      // We exclude hiking paths so they don't get a grey outline
      filter: ["!in", "pmap:kind", "path", "track", "footway", "pedestrian"],
      paint: { "line-color": "#C9C4B5", "line-width": 3.5 },
    },
    // Second: White inner line for standard minor roads and residential streets
    {
      id: "roads-minor-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: [
        "!in",
        "pmap:kind",
        "path",
        "track",
        "footway",
        "pedestrian",
        "highway",
        "major_road",
        "medium_road",
      ],
      paint: { "line-color": "#FFFFFF", "line-width": 1.5 },
    },
    // Third: Pale yellow inner line for medium/major roads
    {
      id: "roads-major-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "medium_road"],
      paint: { "line-color": "#FDE293", "line-width": 2 },
    },
    // Fourth: Thick bright orange inner line for highways
    {
      id: "roads-highway-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: { "line-color": "#F7A85C", "line-width": 2.5 },
    },
    // Fifth: The brown dashed lines for hiking trails and footpaths
    {
      id: "roads-tracks-paths",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway", "pedestrian"],
      paint: {
        "line-color": "#8D5A30",
        "line-width": 2.5,
        "line-dasharray": [2, 1.5],
      },
    },

    // 7. ROAD LABELS
    {
      id: "roads-labels",
      type: "symbol",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "highway", "minor_road"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "symbol-placement": "line",
      },
      paint: {
        "text-color": "#555555",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 2,
      },
    },

    // 8. POINTS OF INTEREST (Peaks, Campsites, Parks)
    {
      id: "pois-outdoor",
      type: "symbol",
      source: "protomaps",
      "source-layer": "pois",
      filter: ["in", "pmap:kind", "peak", "camp_site", "park"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Bold"],
        "text-size": 11,
        "text-anchor": "top",
        "text-offset": [0, 0.5],
      },
      paint: {
        "text-color": "#2F4F2F", // Forest green text for outdoor POIs
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 2,
      },
    },

    // 9. PLACE LABELS (Cities, Towns, Villages)
    {
      id: "places-labels",
      type: "symbol",
      source: "protomaps",
      "source-layer": "places",
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 12, 14, 18],
      },
      paint: {
        "text-color": "#222222",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 2,
      },
    },
  ],
});
