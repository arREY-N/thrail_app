import { deepEqual } from '../deepEqual';

describe('deepEqual helper', () => {
    it('handles primitives', () => {
        expect(deepEqual(1, 1)).toBe(true);
        expect(deepEqual(1, 2)).toBe(false);
        expect(deepEqual('test', 'test')).toBe(true);
        expect(deepEqual('test', 'other')).toBe(false);
        expect(deepEqual(true, true)).toBe(true);
        expect(deepEqual(true, false)).toBe(false);
        expect(deepEqual(null, null)).toBe(true);
        expect(deepEqual(undefined, undefined)).toBe(true);
        expect(deepEqual(null, undefined)).toBe(false);
    });

    it('handles Date objects', () => {
        const d1 = new Date('2026-01-01T00:00:00Z');
        const d2 = new Date('2026-01-01T00:00:00Z');
        const d3 = new Date('2026-01-02T00:00:00Z');

        expect(deepEqual(d1, d2)).toBe(true);
        expect(deepEqual(d1, d3)).toBe(false);
        expect(deepEqual(d1, '2026-01-01T00:00:00Z')).toBe(false);
    });

    it('handles Firestore Timestamp-like objects', () => {
        const ts1 = { seconds: 12345, nanoseconds: 678 };
        const ts2 = { seconds: 12345, nanoseconds: 678 };
        const ts3 = { seconds: 12345, nanoseconds: 999 };

        expect(deepEqual(ts1, ts2)).toBe(true);
        expect(deepEqual(ts1, ts3)).toBe(false);

        const withToMillis1 = { toMillis: () => 1000 };
        const withToMillis2 = { toMillis: () => 1000 };
        const withToMillis3 = { toMillis: () => 2000 };

        expect(deepEqual(withToMillis1, withToMillis2)).toBe(true);
        expect(deepEqual(withToMillis1, withToMillis3)).toBe(false);
    });

    it('handles NaN equality', () => {
        expect(deepEqual(NaN, NaN)).toBe(true);
        expect(deepEqual(NaN, 0)).toBe(false);
    });

    it('handles Date and Timestamp cross-comparisons', () => {
        const date = new Date('2026-01-01T00:00:00.000Z');
        const tsMillis = { toMillis: () => date.getTime() };
        const tsSecs = { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
        const tsToDate = { toDate: () => date };

        expect(deepEqual(date, tsMillis)).toBe(true);
        expect(deepEqual(date, tsSecs)).toBe(true);
        expect(deepEqual(date, tsToDate)).toBe(true);
        expect(deepEqual(tsMillis, tsSecs)).toBe(true);
        expect(deepEqual(tsMillis, tsToDate)).toBe(true);
    });

    it('handles RegExp comparison', () => {
        expect(deepEqual(/abc/g, /abc/g)).toBe(true);
        expect(deepEqual(/abc/g, /abc/i)).toBe(false);
        expect(deepEqual(/abc/g, {})).toBe(false);
    });

    it('handles nested objects and arrays', () => {
        const objA = {
            id: '123',
            docs: [{ name: 'A', valid: 'pending' }],
            meta: { reason: 'test' },
        };
        const objB = {
            id: '123',
            docs: [{ name: 'A', valid: 'pending' }],
            meta: { reason: 'test' },
        };
        const objC = {
            id: '123',
            docs: [{ name: 'A', valid: 'approved' }],
            meta: { reason: 'test' },
        };

        expect(deepEqual(objA, objB)).toBe(true);
        expect(deepEqual(objA, objC)).toBe(false);
    });
});
