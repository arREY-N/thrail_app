/**
 * @file usePaymentAdmin.test.ts
 * @description Unit tests for usePaymentAdmin hook:
 * - Tests full refund payload (100)
 * - Tests partial refund payload (10)
 * - Tests custom amount refund payload
 * - Tests role validation (admin only)
 * - Tests loading (isRefunding) state transitions and error handling
 */

import { renderHook, act } from '@testing-library/react-native';
import { usePaymentAdmin } from '../usePaymentAdmin';

// Mock dependencies
const mockHttpsCallableFn = jest.fn();
jest.mock('firebase/functions', () => ({
    httpsCallable: jest.fn(() => mockHttpsCallableFn),
}));

jest.mock('@/src/core/config/Firebase', () => ({
    functions: {},
}));

const mockRole = { current: 'admin' };
jest.mock('@/src/core/models/User/User', () => ({
    useAuthHook: () => ({
        role: mockRole.current,
        profile: { id: 'admin_1' },
    }),
}));

jest.mock('@/src/core/utility/errorFormatter', () => ({
    catchError: jest.fn(),
}));

describe('usePaymentAdmin Hook', () => {
    const mockBooking: any = {
        id: 'booking_123',
        user: { id: 'user_456' },
        payment: [
            {
                amount: 1500,
                status: 'captured',
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockRole.current = 'admin';
        mockHttpsCallableFn.mockResolvedValue({ data: { success: true } });
    });

    it('should throw an error if a non-admin calls onRefund', async () => {
        mockRole.current = 'user';
        const { result } = renderHook(() => usePaymentAdmin());

        await act(async () => {
            await expect(result.current.onRefund(mockBooking, 'full')).rejects.toThrow(
                'Only admins can refund bookings'
            );
        });

        expect(mockHttpsCallableFn).not.toHaveBeenCalled();
    });

    it('should send refundPercentage: 100 when full refund is selected', async () => {
        const { result } = renderHook(() => usePaymentAdmin());

        await act(async () => {
            await result.current.onRefund(mockBooking, 'full');
        });

        expect(mockHttpsCallableFn).toHaveBeenCalledWith({
            bookingId: 'booking_123',
            userId: 'user_456',
            reason: 'requested_by_admin',
            refundPercentage: 100,
        });
    });

    it('should send refundPercentage: 10 when partial refund is selected (fixing previous 50 bug)', async () => {
        const { result } = renderHook(() => usePaymentAdmin());

        await act(async () => {
            await result.current.onRefund(mockBooking, 'partial');
        });

        expect(mockHttpsCallableFn).toHaveBeenCalledWith({
            bookingId: 'booking_123',
            userId: 'user_456',
            reason: 'requested_by_admin',
            refundPercentage: 10,
        });
    });

    it('should send customAmount when custom refund is selected with an explicit amount', async () => {
        const { result } = renderHook(() => usePaymentAdmin());

        await act(async () => {
            await result.current.onRefund(mockBooking, 'custom', 650);
        });

        expect(mockHttpsCallableFn).toHaveBeenCalledWith({
            bookingId: 'booking_123',
            userId: 'user_456',
            reason: 'requested_by_admin',
            customAmount: 650,
        });
    });

    it('should handle callable errors and set localError', async () => {
        mockHttpsCallableFn.mockRejectedValueOnce(new Error('PayMongo Gateway Error'));
        const { result } = renderHook(() => usePaymentAdmin());

        await act(async () => {
            await expect(result.current.onRefund(mockBooking, 'custom', 500)).rejects.toThrow(
                'PayMongo Gateway Error'
            );
        });

        expect(result.current.localError).toBe('PayMongo Gateway Error');
        expect(result.current.isRefunding).toBe(false);
    });
});
