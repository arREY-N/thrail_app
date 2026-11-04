/**
 * @file onlineStyle.ts
 * @description OpenFreeMap online vector tile style URL resolver.
 * 100% open-source, unmetered, and requires no API key.
 */

export const OPENFREEMAP_LIBERTY_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Kept for backward compatibility across existing imports
export const FREE_OFFLINE_STYLE = OPENFREEMAP_LIBERTY_STYLE;

export const onlineStyle = OPENFREEMAP_LIBERTY_STYLE;
