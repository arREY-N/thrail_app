/**
 * @file deepEqual.ts
 * @description Safe, dependency-free deep equality comparison helper
 * handling primitives, plain objects, arrays, Dates, RegExps, and Firestore Timestamps.
 */

function isTimestampLike(val: unknown): val is { seconds: number; nanoseconds: number } {
    return (
        typeof val === 'object' &&
        val !== null &&
        'seconds' in val &&
        'nanoseconds' in val &&
        typeof (val as { seconds: unknown }).seconds === 'number' &&
        typeof (val as { nanoseconds: unknown }).nanoseconds === 'number'
    );
}

function isExactTimestamp(val: unknown): val is { seconds: number; nanoseconds: number } {
    if (!isTimestampLike(val)) return false;
    const keys = Object.keys(val);
    return keys.length === 2 || 'toMillis' in val || 'toDate' in val;
}

function getEpochMillis(val: unknown): number | null {
    if (val instanceof Date) {
        return val.getTime();
    }
    if (typeof val === 'object' && val !== null) {
        if ('toMillis' in val && typeof (val as { toMillis: unknown }).toMillis === 'function') {
            try {
                return (val as { toMillis: () => number }).toMillis();
            } catch {
                return null;
            }
        }
        if ('toDate' in val && typeof (val as { toDate: unknown }).toDate === 'function') {
            try {
                const d = (val as { toDate: () => unknown }).toDate();
                if (d instanceof Date) return d.getTime();
            } catch {
                return null;
            }
        }
        if (isExactTimestamp(val)) {
            return val.seconds * 1000 + Math.floor(val.nanoseconds / 1000000);
        }
    }
    return null;
}

export function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a === null || a === undefined || b === null || b === undefined) {
        return a === b;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
        if (typeof a === 'number' && typeof b === 'number') {
            return Number.isNaN(a) && Number.isNaN(b);
        }
        return a === b;
    }

    // RegExps
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags;
    }
    if (a instanceof RegExp || b instanceof RegExp) {
        return false;
    }

    // Firestore Timestamps exact seconds & nanoseconds
    const aIsExactTs = isExactTimestamp(a);
    const bIsExactTs = isExactTimestamp(b);
    if (aIsExactTs && bIsExactTs) {
        return a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
    }

    // Dates & Timestamp millisecond equivalence
    const millisA = getEpochMillis(a);
    const millisB = getEpochMillis(b);
    if (millisA !== null && millisB !== null) {
        return millisA === millisB || (Number.isNaN(millisA) && Number.isNaN(millisB));
    }
    if (millisA !== null || millisB !== null) {
        return false;
    }

    // Arrays
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        return false;
    }

    // Plain objects
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
        if (!deepEqual(objA[key], objB[key])) {
            return false;
        }
    }

    return true;
}
