import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createThrottledJSONStorage,
    flushAllPendingWrites,
    _resetThrottledStorageForTesting,
} from '../createThrottledAsyncStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

describe('createThrottledJSONStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        _resetThrottledStorageForTesting();
    });

    afterEach(() => {
        _resetThrottledStorageForTesting();
        jest.useRealTimers();
    });

    it('batches multiple setItem calls within the throttle window and only writes the last value', async () => {
        const storage = createThrottledJSONStorage(500);

        storage.setItem('test-key', { state: { count: 1 }, version: 0 });
        storage.setItem('test-key', { state: { count: 2 }, version: 0 });
        storage.setItem('test-key', { state: { count: 3 }, version: 0 });

        // Before timer expires, AsyncStorage.setItem should NOT have been called
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();

        // Advance timers by throttle duration
        jest.advanceTimersByTime(500);

        // Allow microtasks / async flush to complete
        await Promise.resolve();

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'test-key',
            JSON.stringify({ state: { count: 3 }, version: 0 })
        );
    });

    it('skips writing if the serialized value is identical to the last written string', async () => {
        const storage = createThrottledJSONStorage(500);

        // First write
        storage.setItem('test-key', { state: { data: 'hello' }, version: 0 });
        jest.advanceTimersByTime(500);
        await Promise.resolve();

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);

        // Second write with identical payload
        storage.setItem('test-key', { state: { data: 'hello' }, version: 0 });
        jest.advanceTimersByTime(500);
        await Promise.resolve();

        // Should still only have been called once
        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('cancels pending write when removeItem is called', async () => {
        const storage = createThrottledJSONStorage(500);

        storage.setItem('test-key', { state: { count: 99 }, version: 0 });

        // Remove item before throttle expires
        await storage.removeItem('test-key');

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');

        // Advance timers past window
        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        // AsyncStorage.setItem must never be called for cancelled write
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('returns buffered unflushed value on getItem', async () => {
        const storage = createThrottledJSONStorage(500);

        const pendingValue = { state: { count: 42 }, version: 1 };
        storage.setItem('buffered-key', pendingValue);

        // getItem should read buffered memory directly without waiting or hitting AsyncStorage
        const result = await storage.getItem('buffered-key');
        expect(result).toEqual(pendingValue);
        expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('immediately flushes all pending writes on flushAllPendingWrites', async () => {
        const storage = createThrottledJSONStorage(500);

        storage.setItem('key-a', { state: { a: 1 }, version: 0 });
        storage.setItem('key-b', { state: { b: 2 }, version: 0 });

        expect(AsyncStorage.setItem).not.toHaveBeenCalled();

        await flushAllPendingWrites();

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'key-a',
            JSON.stringify({ state: { a: 1 }, version: 0 })
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'key-b',
            JSON.stringify({ state: { b: 2 }, version: 0 })
        );
    });
});
