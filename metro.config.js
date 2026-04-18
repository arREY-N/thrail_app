// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Tell Metro to treat .pmtiles and .geojson as valid asset files
config.resolver.assetExts.push("pmtiles", "geojson");

config.resolver.assetExts.push("pbf");

module.exports = config;
