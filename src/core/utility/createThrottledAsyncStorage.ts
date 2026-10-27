import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

// Global in-memory state tracking pending writes across stores
const pendingWrites = new Map<string, StorageValue<unknown>>();
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();
const lastWrittenStrings = new Map<string, string>();

/**
 * Flush a single pending key to AsyncStorage immediately.
 */
async function flushKey(name: string): Promise<void> {
    if (!pendingWrites.has(name)) {
        return;
    }

    const value = pendingWrites.get(name);
    pendingWrites.delete(name);

    if (writeTimers.has(name)) {
        clearTimeout(writeTimers.get(name)!);
        writeTimers.delete(name);
    }

    try {
        const serialized = JSON.stringify(value);
        if (serialized === lastWrittenStrings.get(name)) {
            return;
        }
        lastWrittenStrings.set(name, serialized);
        await AsyncStorage.setItem(name, serialized);
    } catch (error) {
        console.error(`[throttledStorage] Error writing ${name} to AsyncStorage:`, error);
    }
}

/**
 * Immediately flushes all pending writes to AsyncStorage.
 * Useful when the app is moving to the background or during tests.
 */
export async function flushAllPendingWrites(): Promise<void> {
    const keys = Array.from(pendingWrites.keys());
    await Promise.all(keys.map(key => flushKey(key)));
}

/**
 * Helper to reset in-memory state during unit tests.
 */
export function _resetThrottledStorageForTesting(): void {
    writeTimers.forEach(timer => clearTimeout(timer));
    writeTimers.clear();
    pendingWrites.clear();
    lastWrittenStrings.clear();
}

// Automatically flush pending writes when the app enters the background or becomes inactive
if (typeof AppState?.addEventListener === 'function') {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
            flushAllPendingWrites().catch((err) => {
                console.error('[throttledStorage] Error flushing writes on background:', err);
            });
        }
    });
}

/**
 * Creates a Zustand PersistStorage adapter backed by AsyncStorage with
 * trailing write throttling, deduping against duplicate JSON payloads,
 * and background-flush guarantees.
 *
 * @param throttleMs - Trailing debounce delay in milliseconds (default 500ms)
 */
export function createThrottledJSONStorage<S = unknown>(
    throttleMs: number = 500
): PersistStorage<S> {
    return {
        getItem: async (name: string): Promise<StorageValue<S> | null> => {
            // If there is an unflushed in-memory write, return it directly for immediate consistency
            if (pendingWrites.has(name)) {
                return pendingWrites.get(name) as StorageValue<S>;
            }

            try {
                const str = await AsyncStorage.getItem(name);
                if (str === null) {
                    return null;
                }
                lastWrittenStrings.set(name, str);
                return JSON.parse(str) as StorageValue<S>;
            } catch (error) {
                console.error(`[throttledStorage] Error reading ${name} from AsyncStorage:`, error);
                return null;
            }
        },

        setItem: (name: string, value: StorageValue<S>): void => {
            // Buffer the latest value in-memory without synchronous stringify
            pendingWrites.set(name, value as StorageValue<unknown>);

            // Clear any existing trailing timer for this store key
            if (writeTimers.has(name)) {
                clearTimeout(writeTimers.get(name)!);
            }

            // Schedule a trailing write
            const timer = setTimeout(() => {
                writeTimers.delete(name);
                flushKey(name).catch((err) => {
                    console.error(`[throttledStorage] Error flushing ${name}:`, err);
                });
            }, throttleMs);

            writeTimers.set(name, timer);
        },

        removeItem: async (name: string): Promise<void> => {
            if (writeTimers.has(name)) {
                clearTimeout(writeTimers.get(name)!);
                writeTimers.delete(name);
            }
            pendingWrites.delete(name);
            lastWrittenStrings.delete(name);

            try {
                await AsyncStorage.removeItem(name);
            } catch (error) {
                console.error(`[throttledStorage] Error removing ${name} from AsyncStorage:`, error);
            }
        },
    };
}
