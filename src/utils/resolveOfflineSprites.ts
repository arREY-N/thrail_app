// utils/resolveOfflineSprites.ts
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

import lightJson from "../assets/sprites/light.json";
import light2xJson from "../assets/sprites/light_2x.json";
import lightPngAsset from "../assets/sprites/light.png";
import light2xPngAsset from "../assets/sprites/light_2x.png";

let spritesResolvedCache: string | null = null;

/**
 * Resolves and bundles offline sprites from the local assets directory to the app's document directory.
 * MapLibre requires a base URI (e.g. file:///.../sprites/light) and automatically appends .json and .png.
 *
 * @returns {Promise<string>} The base sprite URI (e.g. file:///.../sprites/light).
 */
export async function resolveOfflineSprites(): Promise<string> {
  const spriteDir = `${FileSystem.documentDirectory}sprites/`;
  const baseUri = `${spriteDir}light`;

  if (spritesResolvedCache) {
    return spritesResolvedCache;
  }

  try {
    const dirInfo = await FileSystem.getInfoAsync(spriteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(spriteDir, { intermediates: true });
    }

    // 1. Write JSON files if they don't already exist
    const jsonFiles = [
      { path: `${spriteDir}light.json`, content: JSON.stringify(lightJson) },
      { path: `${spriteDir}light@2x.json`, content: JSON.stringify(light2xJson) },
    ];

    await Promise.all(
      jsonFiles.map(async ({ path, content }) => {
        try {
          const info = await FileSystem.getInfoAsync(path);
          if (!info.exists) {
            await FileSystem.writeAsStringAsync(path, content);
          }
        } catch (err) {
          console.warn(`Error writing sprite JSON ${path}:`, err);
        }
      })
    );

    // 2. Resolve and copy PNG assets (handles both dev HTTP via Metro and release APK asset:// / file://)
    const pngAssets = [
      { module: lightPngAsset, destPath: `${spriteDir}light.png` },
      { module: light2xPngAsset, destPath: `${spriteDir}light@2x.png` },
    ];

    await Promise.all(
      pngAssets.map(async ({ module, destPath }) => {
        try {
          const info = await FileSystem.getInfoAsync(destPath);
          if (info.exists && info.size && info.size > 0) return;

          const [asset] = await Asset.loadAsync(module);
          if (!asset) {
            console.warn(`Unable to load sprite asset from module for ${destPath}`);
            return;
          }

          const sourceUri = asset.localUri || asset.uri;
          if (!sourceUri) {
            console.warn(`Sprite asset source URI could not be resolved for ${destPath}`);
            return;
          }

          if (sourceUri.startsWith("http://") || sourceUri.startsWith("https://")) {
            await FileSystem.downloadAsync(sourceUri, destPath);
          } else {
            await FileSystem.copyAsync({ from: sourceUri, to: destPath });
          }
          console.log(`✅ Sprite copied to: ${destPath}`);
        } catch (err) {
          console.warn(`Failed copying sprite image to ${destPath}:`, err);
        }
      })
    );

    spritesResolvedCache = baseUri;
    return baseUri;
  } catch (error) {
    console.error("Error resolving offline sprites:", error);
    return "https://protomaps.github.io/basemaps-assets/sprites/v4/light";
  }
}
