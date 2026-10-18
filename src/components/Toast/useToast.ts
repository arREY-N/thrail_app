/**
 * @file useToast.ts
 * @description Hook providing access to the global Toast management context.
 */

import { useContext } from 'react';

import { ToastContextType } from '@/src/components/Toast/Toast.types';
import { ToastContext } from '@/src/components/Toast/ToastContext';

/**
 * Custom hook to trigger or manage application-wide toast notifications.
 *
 * @throws {Error} If called outside of a ToastProvider.
 * @returns {ToastContextType} The active toast context controller.
 */
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider.');
    }
    return context;
};
