// utils/resolveOfflineFonts.ts
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

// Automatically require all .pbf files in assets/fonts/
// ensure babel.config.js or Expo has babel-plugin-inline-require-context enabled
// (Expo Router has it by default)
const ctx = require.context('../assets/fonts', true, /\.pbf$/);

let fontsResolvedCache = false;

/**
 * Resolves and bundles offline fonts from the local assets directory to the app's document directory.
 * This process ensures that glyphs are available for offline map rendering by MapLibre.
 * 
 * @returns {Promise<string>} The base directory path where fonts are stored (file:///.../).
 */
export async function resolveOfflineFonts(): Promise<string> {
  const fontBaseDir = `${FileSystem.documentDirectory}fonts/`;

  if (fontsResolvedCache) {
    return fontBaseDir;
  }

  // Gather directories to create and pending copy tasks in parallel
  const directories = new Set<string>();
  const tasks = ctx.keys().map(async (key) => {
    const dest = key.replace('./', '').replace(/ /g, '');
    const module = ctx(key);
    const destPath = `${fontBaseDir}${dest}`;

    try {
      const info = await FileSystem.getInfoAsync(destPath);
      if (info.exists) return null;

      const dir = destPath.substring(0, destPath.lastIndexOf("/"));
      directories.add(dir);
      return { module, destPath };
    } catch (e) {
      console.warn(`Error checking font asset: ${destPath}`, e);
      return null;
    }
  });

  const results = await Promise.all(tasks);
  const pendingCopies = results.filter((item): item is { module: any; destPath: string } => item !== null);

  if (pendingCopies.length > 0) {
    // Create all unique subdirectories in parallel
    await Promise.all(
      Array.from(directories).map((dir) =>
        FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch((e) => {
          console.warn(`Error creating directory ${dir}:`, e);
        })
      )
    );

    // Download and copy all pending assets concurrently
    await Promise.all(
      pendingCopies.map(async ({ module, destPath }) => {
        try {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          if (asset.localUri) {
            await FileSystem.copyAsync({ from: asset.localUri, to: destPath });
          }
        } catch (e) {
          console.error(`Failed to copy font asset: ${destPath}`, e);
        }
      })
    );
  }

  fontsResolvedCache = true;
  return fontBaseDir;
}