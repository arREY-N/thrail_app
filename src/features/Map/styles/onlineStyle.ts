/**
 * @file onlineStyle.ts
 * @description MapTiler outdoor online vector tile style URL resolver.
 */

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;

export const onlineStyle = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
