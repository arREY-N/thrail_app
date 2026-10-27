/**
 * @file onlineStyle.ts
 * @description MapTiler outdoor online vector tile style URL resolver with OpenFreeMap fallback.
 */

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim();

export const FREE_OFFLINE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const onlineStyle =
  MAPTILER_KEY && MAPTILER_KEY !== "undefined"
    ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
    : FREE_OFFLINE_STYLE;


