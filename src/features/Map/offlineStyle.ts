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
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    // 1. BASE BACKGROUND & EARTH
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F2EFE9" },
    },
    {
      id: "earth",
      type: "fill",
      source: "protomaps",
      "source-layer": "earth",
      paint: { "fill-color": "#EAE6DB" },
    },

    // 2. DETAILED LANDUSE & NATURAL (Forests, Scrub, Sand, Parks)
    {
      id: "natural-wood",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["in", "pmap:kind", "wood", "forest", "scrub"],
      paint: { "fill-color": "#C1D5A5", "fill-opacity": 0.7 },
    },
    {
      id: "landuse-park",
      type: "fill",
      source: "protomaps",
      "source-layer": "landuse",
      filter: ["in", "pmap:kind", "park", "nature_reserve", "pitch"],
      paint: { "fill-color": "#D3E4BE" },
    },
    {
      id: "natural-sand",
      type: "fill",
      source: "protomaps",
      "source-layer": "natural",
      filter: ["==", "pmap:kind", "beach"],
      paint: { "fill-color": "#F1EEDB" },
    },

    // 3. WATER FEATURES
    {
      id: "water",
      type: "fill",
      source: "protomaps",
      "source-layer": "water",
      paint: { "fill-color": "#8AB4F8" }, // Richer MapTiler blue
    },
    {
      id: "waterway",
      type: "line",
      source: "protomaps",
      "source-layer": "waterway",
      paint: { "line-color": "#8AB4F8", "line-width": 1.5 },
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
      paint: { "fill-color": "#D6D1C7", "fill-opacity": 0.6 },
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
      paint: { "line-color": "#FEF0C2", "line-width": 2 },
    },
    // Fourth: Thick bright orange inner line for highways
    {
      id: "roads-highway-inner",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: { "line-color": "#FAD47A", "line-width": 2.5 },
    },
    // Fifth: The brown dashed lines for hiking trails and footpaths
    {
      id: "roads-tracks-paths",
      type: "line",
      source: "protomaps",
      "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway", "pedestrian"],
      paint: {
        "line-color": "#9E7B5A",
        "line-width": 2,
        "line-dasharray": [2, 2],
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
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.5],
      },
      paint: {
        "text-color": "#4A6B2A", // Forest green text for outdoor POIs
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 1.5,
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
