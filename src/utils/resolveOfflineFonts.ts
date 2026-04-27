// utils/resolveOfflineFonts.ts
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

// Automatically require all .pbf files in assets/fonts/
// ensure babel.config.js or Expo has babel-plugin-inline-require-context enabled
// (Expo Router has it by default)
const ctx = require.context('../assets/fonts', true, /\.pbf$/);

/**
 * Resolves and bundles offline fonts from the local assets directory to the app's document directory.
 * This process ensures that glyphs are available for offline map rendering by MapLibre.
 * 
 * @returns {Promise<string>} The base directory path where fonts are stored (file:///.../).
 */
export async function resolveOfflineFonts(): Promise<string> {
  const fontBaseDir = `${FileSystem.documentDirectory}fonts/`;

  for (const key of ctx.keys()) {
    // key is typically like "./Noto Sans Regular/0-255.pbf"
    const dest = key.replace('./', '').replace(/ /g, '');
    const module = ctx(key);
    
    const destPath = `${fontBaseDir}${dest}`;
    const info = await FileSystem.getInfoAsync(destPath);
    if (info.exists) continue; // Already copied

    // Ensure directory exists
    const dir = destPath.substring(0, destPath.lastIndexOf("/"));
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

    const asset = Asset.fromModule(module);
    await asset.downloadAsync();
    if (asset.localUri) {
      await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
    }
  }

  return fontBaseDir;
}