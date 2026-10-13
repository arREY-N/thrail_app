const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Tell Metro to treat .pmtiles and .geojson as valid asset files
config.resolver.assetExts.push("pmtiles", "geojson");

config.resolver.assetExts.push("pbf");

module.exports = config;