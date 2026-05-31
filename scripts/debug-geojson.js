const fs = require("fs");
const path = require("path");

const GEOJSON_FILE = path.join(
  __dirname,
  "../src/assets/map_data/trails_3D_final_v2.geojson",
);

const TARGET_MOUNTAINS = [
  { id: "mt-tagapo", name: "Mount Tagapo", lat: 14.3392772, lon: 121.2325293 },
  { id: "mt-marami", name: "Mount Marami", lat: 14.1986108, lon: 120.6858334 },
  { id: "mt-batulao", name: "Mount Batulao", lat: 14.0399434, lon: 120.8023782 },
  { id: "mt-makiling", name: "Mount Makiling", lat: 14.1352241, lon: 121.1944517 },
  { id: "mt-maculot", name: "Mount Maculot", lat: 13.9208682, lon: 121.0516961 }
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getFeatureCoordinates(feature) {
  const coords = [];
  const geom = feature.geometry;
  if (!geom) return coords;
  if (geom.type === "Point") coords.push(geom.coordinates);
  else if (geom.type === "LineString") coords.push(...geom.coordinates);
  else if (geom.type === "Polygon") geom.coordinates.forEach((r) => coords.push(...r));
  else if (geom.type === "MultiLineString") geom.coordinates.forEach((l) => coords.push(...l));
  else if (geom.type === "MultiPolygon") geom.coordinates.forEach((p) => p.forEach((r) => coords.push(...r)));
  return coords;
}

try {
  const rawData = JSON.parse(fs.readFileSync(GEOJSON_FILE, "utf8"));
  const allFeatures = rawData.features || [];
  
  console.log(`Total features in GeoJSON: ${allFeatures.length}`);

  TARGET_MOUNTAINS.forEach(mountain => {
    const matchingFeatures = allFeatures.filter(f => 
      f.properties && f.properties.assigned_mountain === mountain.name
    );
    
    console.log(`\nMountain: "${mountain.name}"`);
    console.log(`- Total segments with matching name: ${matchingFeatures.length}`);
    
    if (matchingFeatures.length > 0) {
      let closeCount = 0;
      let minDistance = Infinity;
      let maxDistance = 0;
      let avgLat = 0;
      let avgLon = 0;
      let coordCount = 0;

      matchingFeatures.forEach(f => {
        const coords = getFeatureCoordinates(f);
        if (coords.length > 0) {
          const firstCoord = coords[0];
          const dist = getDistance(mountain.lat, mountain.lon, firstCoord[1], firstCoord[0]);
          if (dist < minDistance) minDistance = dist;
          if (dist > maxDistance) maxDistance = dist;
          if (dist < 6.0) closeCount++;

          coords.forEach(c => {
            avgLon += c[0];
            avgLat += c[1];
            coordCount++;
          });
        }
      });

      avgLat /= coordCount;
      avgLon /= coordCount;

      console.log(`- Segments within 6km: ${closeCount}`);
      console.log(`- Distance range: ${minDistance.toFixed(2)} km to ${maxDistance.toFixed(2)} km`);
      console.log(`- Center of features: lat: ${avgLat.toFixed(7)}, lon: ${avgLon.toFixed(7)}`);
      console.log(`- Center configured:  lat: ${mountain.lat}, lon: ${mountain.lon}`);
      console.log(`- Offset from configured center: ${getDistance(mountain.lat, mountain.lon, avgLat, avgLon).toFixed(2)} km`);
    }
  });

} catch (err) {
  console.error("Error running diagnostics:", err);
}
