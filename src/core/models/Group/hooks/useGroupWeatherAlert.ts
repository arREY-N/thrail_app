import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IWeatherAlert } from '@/src/core/models/Group/interfaces/Group.types';
import { GroupRepo } from '@/src/core/models/Group/repositories/GroupRepository';

const OFFLINE_ALERT_KEY_PREFIX = '@group_weather_alert_';

export function useGroupWeatherAlert(groupId?: string | null) {
    const [latestAlert, setLatestAlert] = useState<IWeatherAlert | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(Boolean(groupId));
    const [isOffline, setIsOffline] = useState<boolean>(false);

    useEffect(() => {
        if (!groupId) return;

        let isMounted = true;
        const cacheKey = `${OFFLINE_ALERT_KEY_PREFIX}${groupId}`;

        // 1. Immediately hydrate from AsyncStorage for offline viewing
        AsyncStorage.getItem(cacheKey)
            .then((stored) => {
                if (!isMounted || !stored) return;
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.id) {
                        if (parsed.hikeDate) parsed.hikeDate = new Date(parsed.hikeDate);
                        if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
                        setLatestAlert((prev) => prev || parsed);
                        setIsOffline(true);
                        setIsLoading(false);
                    }
                } catch {
                    // Ignore corrupted cache
                }
            })
            .catch(() => {});

        // 2. Real-time Firestore listener
        const unsubscribe = GroupRepo.listenToLatestWeatherAlert(
            groupId,
            (alert) => {
                if (!isMounted) return;
                setLatestAlert(alert);
                setIsOffline(false);
                setIsLoading(false);

                // Persist fresh alert to disk for offline access
                if (alert) {
                    AsyncStorage.setItem(cacheKey, JSON.stringify(alert)).catch(() => {});
                }
            },
            () => {
                // If offline / network error, retain cached alert and mark offline
                if (!isMounted) return;
                setIsOffline(true);
                setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [groupId]);

    return {
        latestAlert: groupId ? latestAlert : null,
        isLoading: groupId ? isLoading : false,
        isOffline,
    };
}

export default useGroupWeatherAlert;
