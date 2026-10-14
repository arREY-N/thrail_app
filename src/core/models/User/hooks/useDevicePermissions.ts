/**
 * @file useDevicePermissions.ts
 * @description Hook that manages checking and requesting device permissions (Location, Camera, Photos, Notifications).
 */

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { IPermissionState, PermissionKey, PermissionStatus } from '@/src/core/models/Permission/Permission.types';

export interface UseDevicePermissionsResult {
    statuses: Record<PermissionKey, PermissionStatus>;
    canAskAgain: Record<PermissionKey, boolean>;
    isLoading: boolean;
    checkAllPermissions: () => Promise<void>;
    requestPermission: (key: PermissionKey) => Promise<IPermissionState>;
}

/**
 * Custom hook to manage device-specific permissions in a unified manner.
 * Handles checking current permission statuses on mount and app foreground events,
 * and requests permissions using respective Expo APIs.
 * 
 * @returns An object containing the current permission statuses, loading state, and handlers.
 */
export function useDevicePermissions(): UseDevicePermissionsResult {
    const [statuses, setStatuses] = useState<Record<PermissionKey, PermissionStatus>>({
        location: 'undetermined',
        camera: 'undetermined',
        notifications: 'undetermined',
        photos: 'undetermined',
    });

    const [canAskAgain, setCanAskAgain] = useState<Record<PermissionKey, boolean>>({
        location: true,
        camera: true,
        notifications: true,
        photos: true,
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkAllPermissions = useCallback(async (): Promise<void> => {
        try {
            const safeCheck = async (promise: Promise<any>) => {
                try {
                    return await promise;
                } catch (e) {
                    console.warn('Failed to check permission, falling back to undetermined:', e);
                    return { status: 'undetermined', canAskAgain: true };
                }
            };

            const [locFore, locBack, cam, notif, photos] = await Promise.all([
                safeCheck(Location.getForegroundPermissionsAsync()),
                safeCheck(Location.getBackgroundPermissionsAsync()),
                safeCheck(ImagePicker.getCameraPermissionsAsync()),
                safeCheck(Notifications.getPermissionsAsync()),
                safeCheck(ImagePicker.getMediaLibraryPermissionsAsync()),
            ]);

            let locationStatus: PermissionStatus = 'undetermined';
            if (locFore.status === 'granted') {
                if (locBack.status === 'granted') {
                    locationStatus = 'granted';
                } else {
                    locationStatus = 'while-using';
                }
            } else {
                locationStatus = locFore.status;
            }

            setStatuses({
                location: locationStatus,
                camera: cam.status,
                notifications: notif.status,
                photos: photos.status,
            });

            setCanAskAgain({
                location: locFore.canAskAgain || locBack.canAskAgain,
                camera: cam.canAskAgain,
                notifications: notif.canAskAgain,
                photos: photos.canAskAgain,
            });
        } catch (error) {
            console.error('Error checking permissions:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestPermission = useCallback(async (key: PermissionKey): Promise<IPermissionState> => {
        let status: PermissionStatus = 'undetermined';
        let askAgain = true;

        try {
            if (key === 'location') {
                const foreCheck = await Location.getForegroundPermissionsAsync();
                if (foreCheck.status !== 'granted') {
                    const res = await Location.requestForegroundPermissionsAsync();
                    askAgain = res.canAskAgain;
                    if (res.status === 'granted') {
                        const backCheck = await Location.getBackgroundPermissionsAsync();
                        status = backCheck.status === 'granted' ? 'granted' : 'while-using';
                    } else {
                        status = res.status;
                    }
                } else {
                    const res = await Location.requestBackgroundPermissionsAsync();
                    status = res.status === 'granted' ? 'granted' : 'while-using';
                    askAgain = res.canAskAgain;
                }
            } else if (key === 'camera') {
                const res = await ImagePicker.requestCameraPermissionsAsync();
                status = res.status;
                askAgain = res.canAskAgain;
            } else if (key === 'notifications') {
                const res = await Notifications.requestPermissionsAsync();
                status = res.status;
                askAgain = res.canAskAgain;
            } else if (key === 'photos') {
                const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
                status = res.status;
                askAgain = res.canAskAgain;
            }

            setStatuses((prev) => ({ ...prev, [key]: status }));
            setCanAskAgain((prev) => ({ ...prev, [key]: askAgain }));
        } catch (error) {
            console.error(`Error requesting permission for ${key}:`, error);
        }

        return { status, canAskAgain: askAgain };
    }, []);

    useEffect(() => {
        checkAllPermissions();

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAllPermissions();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [checkAllPermissions]);

    return {
        statuses,
        canAskAgain,
        isLoading,
        checkAllPermissions,
        requestPermission,
    };
}
