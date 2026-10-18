/**
 * @file Toast.types.ts
 * @description Type definitions for the global Toast management architecture in Thrail.
 */

export type ToastType = 'success' | 'warning' | 'info' | 'error';
export type ToastVariant = 'card' | 'accent-left' | 'dark';
export type ToastPosition = 'tabbar' | 'sticky_footer' | 'floating' | 'top';
export type ToastMode = 'simple' | 'dismissible';

/**
 * Options for configuring a toast display request.
 */
export interface ToastOptions {
    type?: ToastType;
    variant?: ToastVariant;
    position?: ToastPosition;
    mode?: ToastMode;
    duration?: number;
    bottomOffset?: number;
    onHide?: () => void;
}

/**
 * Internal toast configuration passed to the active toast renderer.
 */
export interface ToastConfig extends ToastOptions {
    message: string;
    visible: boolean;
    triggerKey?: string | number;
}

/**
 * Callable showToast signature supporting shorthand strings, options objects, and helper methods.
 */
export interface ToastShowFn {
    (message: string, type?: ToastType, options?: Omit<ToastOptions, 'type'>): void;
    (options: ToastOptions & { message: string }): void;
    success: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
    error: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
    warning: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
    info: (message: string, options?: Omit<ToastOptions, 'type'>) => void;
}

/**
 * Context contract exposed by ToastProvider.
 */
export interface ToastContextType {
    showToast: ToastShowFn;
    hideToast: () => void;
    registerFooterHeight: (height: number) => void;
    unregisterFooterHeight: () => void;
    dockedFooterHeight: number | null;
}
