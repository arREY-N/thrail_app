/**
 * @file tutorialLayoutRegistry.ts
 * @description Demand-driven in-memory layout registry storing exact 2D viewport coordinates
 * (x, y, width, height) measured via measureInWindow() across Web and Native ONLY when a tutorial is active.
 */

export interface TargetElementLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

const CANONICAL_KEY_ALIASES: Record<string, string> = {
    booking_offers_footer: 'booking_footer',
    booking_status_primary: 'booking_footer',
    admin_offer_add_btn: 'booking_footer',
    booking_offers_calendar: 'booking_calendar',
    booking_offers: 'booking_offers_card',
    booking_status_card: 'booking_status_timeline',
};

const resolveCanonicalKey = (id: string): string => {
    return CANONICAL_KEY_ALIASES[id] || id;
};

const registry = new Map<string, TargetElementLayout>();
const listeners = new Set<() => void>();
const measureCallbacks = new Map<string, Set<() => void>>();
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

/**
 * Returns true ONLY when an active CustomTutorialModal is currently visible and listening for layout updates.
 * Components use this guard to skip expensive `measureInWindow()` bridge calls during normal app usage.
 *
 * @returns {boolean} Whether tutorial layout measurement is currently active
 */
export const isTutorialMeasurementActive = (): boolean => {
    return listeners.size > 0;
};

/**
 * Registers the live runtime window layout coordinates of a target element.
 *
 * @param id - The spotlight target identifier (e.g., 'booking_calendar', 'booking_offers_card', 'booking_footer')
 * @param layout - The computed { x, y, width, height } relative to the viewport window
 */
export const registerTutorialLayout = (id: string, layout: TargetElementLayout): void => {
    const key = resolveCanonicalKey(id);
    const existing = registry.get(key);
    if (
        !existing ||
        Math.abs(existing.x - layout.x) > 1.5 ||
        Math.abs(existing.y - layout.y) > 1.5 ||
        Math.abs(existing.width - layout.width) > 1.5 ||
        Math.abs(existing.height - layout.height) > 1.5
    ) {
        registry.set(key, layout);
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
 * Retrieves the current live layout coordinates of a spotlight target.
 *
 * @param id - The unique target identifier
 * @returns The { x, y, width, height } coordinates or undefined if not yet measured
 */
export const getTutorialLayout = (id: string): TargetElementLayout | undefined => {
    return registry.get(resolveCanonicalKey(id));
};

/**
 * Registers an on-demand measurement callback for a specific spotlight target ID.
 * When the tutorial opens or steps onto `id`, `requestTargetMeasurement(id)` invokes this callback.
 *
 * @param id - Target spotlight identifier
 * @param callback - Function that triggers `measureInWindow` for the target element
 * @returns Unregister cleanup function
 */
export const registerMeasureCallback = (id: string, callback: () => void): (() => void) => {
    const key = resolveCanonicalKey(id);
    let set = measureCallbacks.get(key);
    if (!set) {
        set = new Set<() => void>();
        measureCallbacks.set(key, set);
    }
    set.add(callback);

    if (listeners.size > 0) {
        requestAnimationFrame(() => {
            try {
                callback();
            } catch {
                // Ignore measurement callback errors
            }
        });
    }

    return () => {
        const currentSet = measureCallbacks.get(key);
        if (currentSet) {
            currentSet.delete(callback);
            if (currentSet.size === 0) {
                measureCallbacks.delete(key);
            }
        }
    };
};

/**
 * Triggers an on-demand `measureInWindow` for the specified target ID if a callback is registered,
 * including post-scroll settle passes so animated ScrollView transitions lock onto the final coordinates.
 *
 * @param id - Target spotlight identifier to measure
 */
export const requestTargetMeasurement = (id: string): void => {
    const key = resolveCanonicalKey(id);
    const runCallbacks = () => {
        const set = measureCallbacks.get(key);
        if (!set) return;
        set.forEach((cb) => {
            try {
                cb();
            } catch {
                // Ignore measurement callback errors
            }
        });
    };

    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers.clear();

    requestAnimationFrame(runCallbacks);
    const t1 = setTimeout(runCallbacks, 160);
    const t2 = setTimeout(runCallbacks, 340);
    pendingTimers.add(t1);
    pendingTimers.add(t2);
};

/**
 * Subscribes to layout updates emitted when target components are measured.
 *
 * @param listener - Callback invoked when an item layout updates
 * @returns Unsubscribe function
 */
export const subscribeTutorialLayouts = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
