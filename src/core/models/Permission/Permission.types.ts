/**
 * @file Permission.types.ts
 * @description Type definitions for the device permissions domain.
 */

export type PermissionKey = 'location' | 'camera' | 'notifications';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'while-using';

export interface IPermissionState {
    status: PermissionStatus;
    canAskAgain: boolean;
}

export interface IPermission {
    key: PermissionKey;
    status: PermissionStatus;
    canAskAgain: boolean;
}
