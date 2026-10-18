/**
 * @file Toast.ts
 * @description Public domain facade for the global Toast management architecture.
 * Mirrors backend entity facade standards (e.g., Cancellation.ts).
 */

// TYPES
export * from '@/src/components/Toast/Toast.types';

// CONTEXT & PROVIDER
export { ToastContext, ToastProvider } from '@/src/components/Toast/ToastContext';

// HOOKS
export { useToast } from '@/src/components/Toast/useToast';

// COMPONENT
export { default as CustomToast } from '@/src/components/CustomToast';
export type { CustomToastProps } from '@/src/components/CustomToast';
