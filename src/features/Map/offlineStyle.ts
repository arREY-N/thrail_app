/**
 * Generates a MapLibre Style JSON object configured for offline use with local vector tiles and fonts.
 * 
 * @param offlineTileUrl - The local path or URL to the .pmtiles / vector tile source.
 * @param fontBaseDir - The directory path in the local filesystem where glyphs are located.
 * @returns A MapLibre compatible style object.
 */
export const buildOfflineStyle = (
  offlineTileUrl: string,
  fontBaseDir: string, 
  // maptilerKey no longer needed for fonts if you bundle them
) => ({
  version: 8 as const,

  // ✅ Use local bundled fonts
  glyphs: `${fontBaseDir}{fontstack}/{range}.pbf`,

  // ✅ Use local sprites (optional but recommended)
  // sprite: "asset://sprites/sprite",

  sources: {
    protomaps: {
      type: "vector",
      url: offlineTileUrl,
      maxzoom: 14,
      attribution: "© OpenStreetMap contributors",
    },
  },

  layers: [
    // BACKGROUND
    { id: "background", type: "background", paint: { "background-color": "#EFE9E1" } },
    { id: "earth", type: "fill", source: "protomaps", "source-layer": "earth",
      paint: { "fill-color": "#E8E0D5" } },

    // LANDUSE — added farmland, grass, cemetery
    { id: "landuse-farmland", type: "fill", source: "protomaps", "source-layer": "landuse",
      filter: ["in", "pmap:kind", "farmland", "farm", "orchard", "vineyard"],
      paint: { "fill-color": "#EAE0C8", "fill-opacity": 0.7 } },

    { id: "landuse-grass", type: "fill", source: "protomaps", "source-layer": "landuse",
      filter: ["in", "pmap:kind", "grass", "meadow", "village_green"],
      paint: { "fill-color": "#D4EDAA", "fill-opacity": 0.8 } },

    { id: "landuse-park", type: "fill", source: "protomaps", "source-layer": "landuse",
      filter: ["in", "pmap:kind", "park", "nature_reserve", "national_park", "protected_area"],
      paint: { "fill-color": "#C9E8A0", "fill-opacity": 0.85 } },

    { id: "landuse-cemetery", type: "fill", source: "protomaps", "source-layer": "landuse",
      filter: ["==", "pmap:kind", "cemetery"],
      paint: { "fill-color": "#D6D9C5", "fill-opacity": 0.8 } },

    // NATURAL
    { id: "natural-wood", type: "fill", source: "protomaps", "source-layer": "natural",
      filter: ["in", "pmap:kind", "wood", "forest"],
      paint: { "fill-color": "#A8D48A", "fill-opacity": 0.75 } },

    { id: "natural-scrub", type: "fill", source: "protomaps", "source-layer": "natural",
      filter: ["==", "pmap:kind", "scrub"],
      paint: { "fill-color": "#BDD9A0", "fill-opacity": 0.6 } },

    { id: "natural-sand", type: "fill", source: "protomaps", "source-layer": "natural",
      filter: ["in", "pmap:kind", "beach", "sand"],
      paint: { "fill-color": "#F5E6C0" } },

    { id: "natural-rock", type: "fill", source: "protomaps", "source-layer": "natural",
      filter: ["in", "pmap:kind", "bare_rock", "scree", "rock"],
      paint: { "fill-color": "#D0C8BC", "fill-opacity": 0.8 } },

    // WATER
    { id: "water", type: "fill", source: "protomaps", "source-layer": "water",
      filter: ["!in", "pmap:kind", "wetland", "basin", "ditch", "drain", "playa"],
      paint: { "fill-color": "#8BBFDF" } },

    { id: "waterway-major", type: "line", source: "protomaps", "source-layer": "waterway",
      filter: ["in", "pmap:kind", "river", "canal"],
      paint: { "line-color": "#8BBFDF", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 14, 4] } },

    { id: "waterway-minor", type: "line", source: "protomaps", "source-layer": "waterway",
      filter: ["in", "pmap:kind", "stream", "drain"],
      paint: { "line-color": "#8BBFDF", "line-width": 1 } },

    // BOUNDARIES
    { id: "boundaries", type: "line", source: "protomaps", "source-layer": "boundaries",
      paint: { "line-color": "#B0A090", "line-width": 1, "line-dasharray": [4, 3] } },

    // BUILDINGS
    { id: "buildings", type: "fill", source: "protomaps", "source-layer": "buildings",
      paint: { "fill-color": "#DDD8CB", "fill-outline-color": "#C8C2B4", "fill-opacity": 0.9 } },

    // ROADS — highway
    { id: "roads-highway-casing", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: { "line-color": "#D4872A", "line-width": 8 } },
    { id: "roads-highway-inner", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["==", "pmap:kind", "highway"],
      paint: { "line-color": "#F7BC5C", "line-width": 5 } },

    // ROADS — major
    { id: "roads-major-casing", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "medium_road"],
      paint: { "line-color": "#C8C0A8", "line-width": 5 } },
    { id: "roads-major-inner", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "medium_road"],
      paint: { "line-color": "#FAECC0", "line-width": 3 } },

    // ROADS — minor
    { id: "roads-minor-casing", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["!in", "pmap:kind", "path", "track", "footway", "pedestrian", "highway", "major_road", "medium_road"],
      paint: { "line-color": "#C4BCAC", "line-width": 3 } },
    { id: "roads-minor-inner", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["!in", "pmap:kind", "path", "track", "footway", "pedestrian", "highway", "major_road", "medium_road"],
      paint: { "line-color": "#FFFFFF", "line-width": 1.5 } },

    // TRAILS — two-pass for clean look ✅
    { id: "trails-casing", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway"],
      paint: { "line-color": "#C4A882", "line-width": 4 } },
    { id: "trails-inner", type: "line", source: "protomaps", "source-layer": "roads",
      filter: ["in", "pmap:kind", "path", "track", "footway"],
      paint: {
        "line-color": "#8B5E3C",
        "line-width": 2,
        "line-dasharray": [3, 2],
      } },

    // ROAD LABELS
    { id: "roads-labels", type: "symbol", source: "protomaps", "source-layer": "roads",
      filter: ["in", "pmap:kind", "major_road", "highway", "medium_road"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "symbol-placement": "line",
        "text-max-angle": 30,
      },
      paint: { "text-color": "#5A4A3A", "text-halo-color": "rgba(255, 255, 255, 0.8)", "text-halo-width": 2 } },

    // POIS
    { id: "pois-outdoor", type: "symbol", source: "protomaps", "source-layer": "pois",
      filter: ["in", "pmap:kind", "peak", "camp_site", "park", "viewpoint"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Medium"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 10, 10, 14, 13],
        "text-anchor": "top",
        "text-offset": [0, 0.6],
        "text-max-width": 8,
      },
      paint: { "text-color": "#2A4A2A", "text-halo-color": "rgba(255, 255, 255, 0.86)", "text-halo-width": 2 } },

    // PLACE LABELS
    { id: "places-labels", type: "symbol", source: "protomaps", "source-layer": "places",
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Medium"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 6, 10, 10, 13, 14, 18],
        "text-max-width": 10,
      },
      paint: { "text-color": "#1A1A1A", "text-halo-color": "rgba(255, 255, 255, 0.8)", "text-halo-width": 2 } },
  ],
});