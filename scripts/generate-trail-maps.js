const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// Configurations
const GEOJSON_FILE = path.join(
  __dirname,
  "../src/assets/map_data/trails_3D_final_v2.geojson",
);
const OUTPUT_DIR = path.join(__dirname, "../src/assets/trail-maps");
const TEMPLATE_PATH = path.join(__dirname, "snapshot-template.html");

const TARGET_MOUNTAINS = [
  { id: "mt-tagapo", name: "Mount Tagapo", lat: 14.3392772, lon: 121.2325293 },
  { id: "mt-marami", name: "Mount Marami", lat: 14.1986108, lon: 120.6858334 },
  { id: "mt-batulao", name: "Mount Batulao", lat: 14.0399434, lon: 120.8023782 },
  { id: "mt-makiling", name: "Mount Makiling", lat: 14.1352241, lon: 121.1944517 },
  { id: "mt-maculot", name: "Mount Maculot", lat: 13.9208682, lon: 121.0516961 },
  { id: "mt-daraitan", name: "Mount Daraitan", lat: 14.6137107, lon: 121.4357452 },
  { id: "mt-kulis", name: "Mount Kulis", lat: 14.6107765, lon: 121.3627674 }
];

// Helper: Read MapTiler API key from .env file
function getMapTilerKey() {
  try {
    const envPath = path.join(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/EXPO_PUBLIC_MAPTILER_KEY\s*=\s*(.*)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.warn("Could not read .env file for MapTiler key:", err);
  }
  return null;
}

// Helper: Calculate distance in kilometers between two points using Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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

// Helper: Extract coordinates from a Feature's geometry
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

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load the MapTiler key
  const maptilerKey = getMapTilerKey();
  if (maptilerKey) {
    console.log(`🔑 Loaded MapTiler Key from .env: ${maptilerKey.substring(0, 4)}...`);
  } else {
    console.warn("⚠️ No MapTiler key found in .env, fallback to OpenFreeMap styles.");
  }

  // Load the full GeoJSON data containing all CALABARZON trails
  console.log(`📖 Loading CALABARZON GeoJSON data from ${GEOJSON_FILE}...`);
  const rawData = JSON.parse(fs.readFileSync(GEOJSON_FILE, "utf8"));
  const allFeatures = rawData.features || [];

  console.log(`🚀 Starting visual snapshot generation with browser logging...`);

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const htmlTemplate = fs.readFileSync(TEMPLATE_PATH, "utf8");

  for (let i = 0; i < TARGET_MOUNTAINS.length; i++) {
    const mountain = TARGET_MOUNTAINS[i];
    const outputPath = path.join(OUTPUT_DIR, `${mountain.id}.png`);

    console.log(
      `\n[${i + 1}/${TARGET_MOUNTAINS.length}] Filtering trails for: "${mountain.name}"...`,
    );

    // Filter features assigned to this mountain AND within 6 km of the peak
    const filteredFeatures = allFeatures.filter((f) => {
      if (!f.properties || f.properties.assigned_mountain !== mountain.name) {
        return false;
      }

      const coords = getFeatureCoordinates(f);
      if (coords.length === 0) return false;

      // Use the first coordinate of the segment to measure distance
      const firstCoord = coords[0]; // [lon, lat]
      const distance = getDistance(mountain.lat, mountain.lon, firstCoord[1], firstCoord[0]);

      // Only include segments within 6 kilometers of the mountain center
      return distance < 6.0;
    });

    if (filteredFeatures.length === 0) {
      console.warn(
        `⚠️ No trail features found for "${mountain.name}" within 6km radius! Skipping...`,
      );
      continue;
    }

    const filteredGeoJson = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 600 });

      // Pipe all browser console events directly to Node console
      page.on("console", (msg) => {
        console.log(`   [Browser] ${msg.text()}`);
      });

      page.on("pageerror", (err) => {
        console.error(`   [Browser Error]`, err.message);
      });

      // Set the page template content
      await page.setContent(htmlTemplate);

      // Run MapLibre rendering, passing the MapTiler key
      await page.evaluate((dataStr, key) => {
        window.renderTrail(dataStr, key);
      }, JSON.stringify(filteredGeoJson), maptilerKey);

      // Wait for rendering to complete (Tiles load & map is idle)
      await page.waitForFunction("window.mapReady === true", {
        timeout: 45000, // Generous timeout for premium vector tile loading
      });

      // Capture drawing canvas as Base64 PNG
      const dataUrl = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        return canvas.toDataURL("image/png");
      });

      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(outputPath, base64Data, "base64");

      // Duplicate mt-tagapo.png to placeholder-map.png so we have a fallback asset
      if (mountain.id === "mt-tagapo") {
        fs.writeFileSync(
          path.join(OUTPUT_DIR, "placeholder-map.png"),
          base64Data,
          "base64",
        );
      }

      console.log(`✅ Saved map image: ${outputPath}`);
      await page.close();
      await new Promise((r) => setTimeout(r, 2000)); // Delay to prevent rate limits
    } catch (err) {
      console.error(`❌ Failed to render ${mountain.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("\n🎉 Static map generation completed!");
}

run();
