// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Tell Metro to treat .pmtiles as a valid asset file
config.resolver.assetExts.push("pmtiles");

module.exports = config;
