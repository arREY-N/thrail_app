import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BookingState, bookingStoreCreator } from '../bookingStoreCreator';
import { BookingRepo } from '../../repositories/BookingRepository';
import { Booking } from '../../interfaces/Booking.types';

jest.mock('@/src/core/models/Booking/repositories/BookingRepository', () => ({
    BookingRepo: {
        listenToBusinessBookings: jest.fn(),
        write: jest.fn(),
        delete: jest.fn(),
        fetchUserBooking: jest.fn(),
        fetchAllUserBookings: jest.fn(),
        fetchAllBusinessBookings: jest.fn(),
        fetchAllOfferBookings: jest.fn(),
        listenToUserBookings: jest.fn(),
    },
}));

const createTestStore = () => create<BookingState>()(immer(bookingStoreCreator));
type TestStore = ReturnType<typeof createTestStore>;

describe('Booking Store Ref-Counting & Listener Bookkeeping', () => {
    let store: TestStore;
    const mockUnsubscribe = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUnsubscribe.mockClear();
        (BookingRepo.listenToBusinessBookings as jest.Mock).mockReturnValue(mockUnsubscribe);

        store = createTestStore();
        store.getState().reset();
    });

    afterEach(() => {
        store.getState().reset();
    });

    it('subscribes twice and unsubscribes once: keeps listener active and avoids duplicate set()', async () => {
        let setCallCount = 0;
        store.subscribe(() => {
            setCallCount++;
        });

        // First subscription
        await store.getState().subscribeToBusinessBookings('offer_1', 'biz_1');
        expect(BookingRepo.listenToBusinessBookings).toHaveBeenCalledTimes(1);
        expect(BookingRepo.listenToBusinessBookings).toHaveBeenCalledWith(
            'offer_1',
            'biz_1',
            expect.any(Function)
        );

        const setCallsAfterFirstSub = setCallCount;

        // Second subscription to the exact same offer
        await store.getState().subscribeToBusinessBookings('offer_1', 'biz_1');

        // listenToBusinessBookings must NOT be called again
        expect(BookingRepo.listenToBusinessBookings).toHaveBeenCalledTimes(1);
        // set() must NOT have been called on second subscribe (count is in module-level Map)
        expect(setCallCount).toBe(setCallsAfterFirstSub);

        // First unsubscribe (ref count goes 2 -> 1)
        store.getState().unsubscribeFromBusinessBookings('offer_1');

        // Underlying unsubscribe must NOT be called yet
        expect(mockUnsubscribe).not.toHaveBeenCalled();
        // set() must NOT have been called on decrement
        expect(setCallCount).toBe(setCallsAfterFirstSub);

        // Second unsubscribe (ref count goes 1 -> 0)
        store.getState().unsubscribeFromBusinessBookings('offer_1');

        // Underlying unsubscribe should now be called exactly once
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
        // set() must NOT have been called on removal
        expect(setCallCount).toBe(setCallsAfterFirstSub);
    });

    it('skips set() on snapshot update if incoming bookings are shallow-equal', async () => {
        let snapshotCallback: ((bookings: Booking[]) => void) | undefined;
        (BookingRepo.listenToBusinessBookings as jest.Mock).mockImplementation((_offerId, _bizId, cb) => {
            snapshotCallback = cb;
            return mockUnsubscribe;
        });

        await store.getState().subscribeToBusinessBookings('offer_2', 'biz_1');

        const mockBookings: Booking[] = [
            {
                id: 'booking_1',
                offer: { id: 'offer_2', date: new Date(), price: 100 },
                business: { id: 'biz_1', name: 'Biz' } as any,
                trail: { id: 'trail_1', name: 'Trail' } as any,
                status: 'approved-docs',
                user: { id: 'user_1' } as any,
                payment: [],
                emergencyContact: {} as any,
                documents: [],
                createdAt: new Date('2026-01-01'),
                updatedAt: new Date('2026-01-02'),
            } as Booking,
        ];

        // Trigger initial snapshot
        snapshotCallback!(mockBookings);
        expect(store.getState().bookingByOffer['offer_2']).toEqual(mockBookings);
        const savedReference = store.getState().bookingByOffer['offer_2'];

        let setFired = false;
        store.subscribe(() => {
            setFired = true;
        });

        // Trigger snapshot with identical data (new array, same contents)
        const identicalBookings: Booking[] = [
            {
                id: 'booking_1',
                offer: { id: 'offer_2', date: new Date(), price: 100 },
                business: { id: 'biz_1', name: 'Biz' } as any,
                trail: { id: 'trail_1', name: 'Trail' } as any,
                status: 'approved-docs',
                user: { id: 'user_1' } as any,
                payment: [],
                emergencyContact: {} as any,
                documents: [],
                createdAt: new Date('2026-01-01'),
                updatedAt: new Date('2026-01-02'),
            } as Booking,
        ];

        snapshotCallback!(identicalBookings);

        // State update must be skipped, retaining original reference
        expect(setFired).toBe(false);
        expect(store.getState().bookingByOffer['offer_2']).toBe(savedReference);
    });

    it('unsubscribes all active listeners on reset()', async () => {
        await store.getState().subscribeToBusinessBookings('offer_3', 'biz_1');
        expect(BookingRepo.listenToBusinessBookings).toHaveBeenCalledTimes(1);

        store.getState().reset();
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
});
