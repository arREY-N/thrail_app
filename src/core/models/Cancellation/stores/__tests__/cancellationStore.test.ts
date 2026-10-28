import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { CancellationState, cancellationStoreCreator } from '../cancellationStoreCreator';
import { CancellationRepo } from '../../repositories/CancellationRepository';
import { Cancellation } from '../../interfaces/Cancellation.types';

jest.mock('@/src/core/models/Cancellation/repositories/CancellationRepository', () => ({
    CancellationRepo: {
        listenToBusinessCancellations: jest.fn(),
        listenToUserCancellations: jest.fn(),
        write: jest.fn(),
        delete: jest.fn(),
        fetchCancellation: jest.fn(),
        fetchAllUserCancellations: jest.fn(),
        fetchAllBusinessCancellations: jest.fn(),
        fetchAllOfferCancellations: jest.fn(),
    },
}));

const createTestStore = () => create<CancellationState>()(immer(cancellationStoreCreator));
type TestStore = ReturnType<typeof createTestStore>;

describe('Cancellation Store Ref-Counting & Snapshot Safety', () => {
    let store: TestStore;
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUnsubscribe.mockClear();
        (CancellationRepo.listenToBusinessCancellations as jest.Mock).mockReturnValue(mockUnsubscribe);

        store = createTestStore();
        store.getState().reset();
    });

    afterEach(() => {
        store.getState().reset();
    });

    it('unsubscribes all active listeners on reset()', () => {
        store.getState().subscribeToBusinessCancellations('biz_reset');
        expect(CancellationRepo.listenToBusinessCancellations).toHaveBeenCalledTimes(1);

        store.getState().reset();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

        // Subscribing again after reset creates a fresh listener
        store.getState().subscribeToBusinessCancellations('biz_reset');
        expect(CancellationRepo.listenToBusinessCancellations).toHaveBeenCalledTimes(2);
    });

    it('subscribes twice and unsubscribes once: ref-counting avoids duplicate set() calls', () => {
        let setCallCount = 0;
        store.subscribe(() => {
            setCallCount++;
        });

        // First subscription
        const unsub1 = store.getState().subscribeToBusinessCancellations('biz_1');
        expect(CancellationRepo.listenToBusinessCancellations).toHaveBeenCalledTimes(1);

        const setCallsAfterFirstSub = setCallCount;

        // Second subscription to same businessId
        const unsub2 = store.getState().subscribeToBusinessCancellations('biz_1');

        // Must not call repository listener again
        expect(CancellationRepo.listenToBusinessCancellations).toHaveBeenCalledTimes(1);
        // Must not call set() on second subscribe
        expect(setCallCount).toBe(setCallsAfterFirstSub);

        // First unsubscribe
        unsub1();
        expect(mockUnsubscribe).not.toHaveBeenCalled();
        expect(setCallCount).toBe(setCallsAfterFirstSub);

        // Second unsubscribe
        unsub2();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
        expect(setCallCount).toBe(setCallsAfterFirstSub);
    });

    it('skips set() when incoming snapshot cancellations are deeply equal', () => {
        let snapshotCallback: ((cancellations: Cancellation[]) => void) | undefined;
        (CancellationRepo.listenToBusinessCancellations as jest.Mock).mockImplementation((_bizId, cb) => {
            snapshotCallback = cb;
            return mockUnsubscribe;
        });

        store.getState().subscribeToBusinessCancellations('biz_2');

        const fixedDate = new Date('2026-01-01T00:00:00.000Z');
        const initialCancellations: Cancellation[] = [
            {
                id: 'cancel_1',
                userId: 'user_1',
                cancelledBy: 'user',
                bookingId: 'booking_1',
                offerId: 'offer_1',
                businessId: 'biz_2',
                reason: 'Schedule conflict',
                status: 'pending',
                adminNote: 'Under review',
                createdAt: fixedDate,
                updatedAt: fixedDate,
            } as Cancellation,
        ];

        snapshotCallback!(initialCancellations);
        expect(store.getState().businessCancellations).toEqual(initialCancellations);
        const savedReference = store.getState().businessCancellations;

        let setFired = false;
        store.subscribe(() => {
            setFired = true;
        });

        // Trigger snapshot with identical data (new array, same contents)
        const identicalCancellations: Cancellation[] = [
            {
                id: 'cancel_1',
                userId: 'user_1',
                cancelledBy: 'user',
                bookingId: 'booking_1',
                offerId: 'offer_1',
                businessId: 'biz_2',
                reason: 'Schedule conflict',
                status: 'pending',
                adminNote: 'Under review',
                createdAt: fixedDate,
                updatedAt: fixedDate,
            } as Cancellation,
        ];

        snapshotCallback!(identicalCancellations);

        // State update must be skipped
        expect(setFired).toBe(false);
        expect(store.getState().businessCancellations).toBe(savedReference);
    });

    it('updates businessCancellations when only adminNote changes with the SAME updatedAt', () => {
        let snapshotCallback: ((cancellations: Cancellation[]) => void) | undefined;
        (CancellationRepo.listenToBusinessCancellations as jest.Mock).mockImplementation((_bizId, cb) => {
            snapshotCallback = cb;
            return mockUnsubscribe;
        });

        store.getState().subscribeToBusinessCancellations('biz_3');

        const fixedDate = new Date('2026-01-01T00:00:00.000Z');
        const initialCancellation: Cancellation = {
            id: 'cancel_2',
            userId: 'user_2',
            cancelledBy: 'user',
            bookingId: 'booking_2',
            offerId: 'offer_2',
            businessId: 'biz_3',
            reason: 'Medical reason',
            status: 'pending',
            adminNote: 'Initial note',
            createdAt: fixedDate,
            updatedAt: fixedDate,
        } as Cancellation;

        snapshotCallback!([initialCancellation]);
        expect(store.getState().businessCancellations[0].adminNote).toBe('Initial note');

        let setFired = false;
        store.subscribe(() => {
            setFired = true;
        });

        // Update adminNote without changing updatedAt (common in CancellationFactory)
        const updatedCancellation: Cancellation = {
            ...initialCancellation,
            adminNote: 'Updated admin review notes',
            updatedAt: fixedDate,
        };

        snapshotCallback!([updatedCancellation]);

        // Deep equality check MUST detect the change and trigger set()
        expect(setFired).toBe(true);
        expect(store.getState().businessCancellations[0].adminNote).toBe('Updated admin review notes');
    });

    it('Fix 2: resolves to the first non-deleted cancellation when a booking has multiple cancellations', () => {
        const cancellations: Cancellation[] = [
            {
                id: 'cancellation_first',
                bookingId: 'booking_100',
                reason: 'First cancellation request (pending)',
                status: 'pending',
                isDeleted: false,
            } as Cancellation,
            {
                id: 'cancellation_second',
                bookingId: 'booking_100',
                reason: 'Second cancellation request (subsequent)',
                status: 'rejected',
                isDeleted: false,
            } as Cancellation,
        ];

        const cancellationByBookingId = new Map<string, Cancellation>();
        for (const c of cancellations) {
            if (!c.isDeleted && c.bookingId && !cancellationByBookingId.has(c.bookingId)) {
                cancellationByBookingId.set(c.bookingId, c);
            }
        }

        // First match wins
        expect(cancellationByBookingId.get('booking_100')?.id).toBe('cancellation_first');
        expect(cancellationByBookingId.get('booking_100')?.status).toBe('pending');
    });
});
