/**
 * @file ToastContext.tsx
 * @description Centralized React Context and Provider managing application-wide toast notifications,
 * automatic sticky footer docking, and global overlay presentation.
 */

import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomToast from '@/src/components/CustomToast';
import {
    ToastConfig,
    ToastContextType,
    ToastOptions,
    ToastShowFn,
    ToastType,
} from '@/src/components/Toast/Toast.types';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

/**
 * ToastProvider — Mounts the global toast manager and renders the application-wide CustomToast overlay.
 *
 * @param props - Provider children.
 * @returns {React.JSX.Element} The wrapped component hierarchy.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const insets = useSafeAreaInsets();
    const { isMobile } = useBreakpoints();
    const [dockedFooterHeight, setDockedFooterHeight] = useState<number | null>(null);

    const [toastConfig, setToastConfig] = useState<ToastConfig>({
        message: '',
        visible: false,
        type: 'info',
        variant: 'card',
        position: 'tabbar',
        mode: 'simple',
    });

    const toastConfigRef = useRef(toastConfig);
    useEffect(() => {
        toastConfigRef.current = toastConfig;
    });

    const hideToast = useCallback(() => {
        const currentConfig = toastConfigRef.current;
        if (currentConfig.onHide) {
            try {
                currentConfig.onHide();
            } catch {
                // ignore error in onHide callback
            }
        }
        setToastConfig((prev) => (prev.visible ? { ...prev, visible: false, onHide: undefined } : prev));
    }, []);

    const registerFooterHeight = useCallback((height: number) => {
        if (height > 0) {
            setDockedFooterHeight(height);
        }
    }, []);

    const unregisterFooterHeight = useCallback(() => {
        setDockedFooterHeight(null);
    }, []);

    const showToastCore = useCallback(
        (
            arg1: string | (ToastOptions & { message: string }),
            arg2?: ToastType,
            arg3?: Omit<ToastOptions, 'type'>
        ) => {
            let message = '';
            let type: ToastType = 'info';
            let options: ToastOptions = {};

            if (typeof arg1 === 'string') {
                message = arg1;
                if (arg2) type = arg2;
                if (arg3) options = arg3;
            } else {
                message = arg1.message;
                type = arg1.type ?? 'info';
                options = arg1;
            }

            setToastConfig({
                message,
                type,
                variant: options.variant ?? 'card',
                position: options.position ?? (dockedFooterHeight !== null ? 'sticky_footer' : 'tabbar'),
                mode: options.mode ?? (type === 'error' ? 'dismissible' : 'simple'),
                duration: options.duration,
                bottomOffset: options.bottomOffset,
                onHide: options.onHide,
                visible: true,
                triggerKey: Date.now(),
            });
        },
        [dockedFooterHeight]
    );

    const showToast = useMemo<ToastShowFn>(() => {
        const baseFn = (
            arg1: string | (ToastOptions & { message: string }),
            arg2?: ToastType,
            arg3?: Omit<ToastOptions, 'type'>
        ) => {
            showToastCore(arg1, arg2, arg3);
        };

        return Object.assign(baseFn, {
            success: (msg: string, opts?: Omit<ToastOptions, 'type'>) => {
                showToastCore(msg, 'success', opts);
            },
            error: (msg: string, opts?: Omit<ToastOptions, 'type'>) => {
                showToastCore(msg, 'error', opts);
            },
            warning: (msg: string, opts?: Omit<ToastOptions, 'type'>) => {
                showToastCore(msg, 'warning', opts);
            },
            info: (msg: string, opts?: Omit<ToastOptions, 'type'>) => {
                showToastCore(msg, 'info', opts);
            },
        });
    }, [showToastCore]);

    // Compute dynamic bottom offset for sticky footer docking
    const computedBottomOffset = useMemo(() => {
        if (typeof toastConfig.bottomOffset === 'number') {
            return toastConfig.bottomOffset;
        }

        if (toastConfig.position === 'sticky_footer') {
            if (dockedFooterHeight !== null && dockedFooterHeight > 0) {
                // Dock 12px directly above the measured footer
                return dockedFooterHeight + 12;
            }
            // Standard fallback when footer height is pending measurement
            return isMobile ? Math.max(insets.bottom + 90, 94) : 94;
        }

        return undefined;
    }, [toastConfig.bottomOffset, toastConfig.position, dockedFooterHeight, isMobile, insets.bottom]);

    const contextValue = useMemo<ToastContextType>(
        () => ({
            showToast,
            hideToast,
            registerFooterHeight,
            unregisterFooterHeight,
            dockedFooterHeight,
        }),
        [showToast, hideToast, registerFooterHeight, unregisterFooterHeight, dockedFooterHeight]
    );

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <CustomToast
                message={toastConfig.message}
                visible={toastConfig.visible}
                onHide={hideToast}
                type={toastConfig.type}
                mode={toastConfig.mode}
                variant={toastConfig.variant}
                position={toastConfig.position === 'top' ? 'floating' : (toastConfig.position ?? 'tabbar')}
                bottomOffset={computedBottomOffset}
                duration={toastConfig.duration}
                triggerKey={toastConfig.triggerKey}
            />
        </ToastContext.Provider>
    );
};
