/**
 * @file webDrawerLayoutRegistry.ts
 * @description Demand-driven in-memory layout registry that stores exact browser viewport coordinates
 * for each navigation item inside the Web HomePageNavBar sidebar drawer only when a tutorial is active.
 */

export interface DrawerItemLayout {
    y: number;
    height: number;
}

const registry = new Map<string, DrawerItemLayout>();
const listeners = new Set<() => void>();
const drawerMeasureCallbacks = new Set<() => void>();
let activeDrawerTarget: string | null = null;
const drawerScrollListeners = new Set<(itemId: string | null) => void>();

/**
 * Returns true only when an active CustomTutorialModal is visible and listening for drawer measurements.
 *
 * @returns {boolean} Whether drawer layout measurement is active
 */
export const isDrawerMeasurementActive = (): boolean => {
    return listeners.size > 0;
};

/**
 * Registers the live layout coordinates of a sidebar drawer item.
 *
 * @param id - The unique navigation item id (e.g., 'home', 'explore', 'business', etc.)
 * @param layout - The computed { y, height } relative to the viewport
 */
export const registerDrawerItemLayout = (id: string, layout: DrawerItemLayout): void => {
    const existing = registry.get(id);
    if (
        !existing ||
        Math.abs(existing.y - layout.y) > 1.5 ||
        Math.abs(existing.height - layout.height) > 1.5
    ) {
        registry.set(id, layout);
        if (listeners.size > 0) {
            listeners.forEach((listener) => {
                try {
                    listener();
                } catch {
                    // Ignore listener notification errors
                }
            });
        }
    }
};

/**
 * Retrieves the current live layout coordinates of a sidebar drawer item.
 *
 * @param id - The unique navigation item id
 * @returns The { y, height } coordinates or undefined if not yet measured
 */
export const getDrawerItemLayout = (id: string): DrawerItemLayout | undefined => {
    return registry.get(id);
};

/**
 * Registers a callback to measure all visible sidebar drawer items on demand.
 *
 * @param callback - Function that measures mounted drawer items
 * @returns Unsubscribe cleanup function
 */
export const registerDrawerMeasureCallback = (callback: () => void): (() => void) => {
    drawerMeasureCallbacks.add(callback);
    if (listeners.size > 0) {
        requestAnimationFrame(() => {
            try {
                callback();
            } catch {
                // Ignore errors
            }
        });
    }
    return () => {
        drawerMeasureCallbacks.delete(callback);
    };
};

/**
 * Requests an immediate and post-animation measurement of sidebar drawer items when a web_drawer_* step becomes active.
 */
export const requestDrawerMeasurements = (): void => {
    const runAll = () => {
        drawerMeasureCallbacks.forEach((cb) => {
            try {
                cb();
            } catch {
                // Ignore errors
            }
        });
    };
    requestAnimationFrame(runAll);
    setTimeout(runAll, 140);
    setTimeout(runAll, 280);
};

/**
 * Subscribes to layout updates emitted when drawer items are measured.
 *
 * @param listener - Callback invoked when an item layout updates
 * @returns Unsubscribe function
 */
export const subscribeDrawerItemLayouts = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/**
 * Sets the active sidebar drawer item targeted by the current tutorial step.
 * Automatically notifies registered drawer scroll listeners to adjust their scroll position.
 *
 * @param itemId - The navigation item id (e.g. 'personnel', 'business') or null when tour leaves drawer
 */
export const setActiveDrawerTarget = (itemId: string | null): void => {
    if (activeDrawerTarget !== itemId) {
        activeDrawerTarget = itemId;
        drawerScrollListeners.forEach((listener) => {
            try {
                listener(itemId);
            } catch {
                // Ignore listener notification errors
            }
        });
    }
};

/**
 * Retrieves the currently active drawer target item id.
 *
 * @returns {string | null}
 */
export const getActiveDrawerTarget = (): string | null => activeDrawerTarget;

/**
 * Subscribes to changes in the active drawer target to auto-scroll the drawer into view.
 *
 * @param listener - Callback invoked when the active drawer target changes
 * @returns Unsubscribe cleanup function
 */
export const subscribeDrawerScroll = (listener: (itemId: string | null) => void): (() => void) => {
    drawerScrollListeners.add(listener);
    if (activeDrawerTarget !== null) {
        try {
            listener(activeDrawerTarget);
        } catch {
            // Ignore error
        }
    }
    return () => {
        drawerScrollListeners.delete(listener);
    };
};
