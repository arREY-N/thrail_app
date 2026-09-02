import { useEffect, useState } from 'react';
import { IWeatherAlert } from '@/src/core/models/Group/interfaces/Group.types';
import { GroupRepo } from '@/src/core/models/Group/repositories/GroupRepository';

export function useGroupWeatherAlert(groupId?: string | null) {
    const [latestAlert, setLatestAlert] = useState<IWeatherAlert | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(Boolean(groupId));

    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = GroupRepo.listenToLatestWeatherAlert(groupId, (alert) => {
            setLatestAlert(alert);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [groupId]);

    return {
        latestAlert: groupId ? latestAlert : null,
        isLoading: groupId ? isLoading : false,
    };
}

export default useGroupWeatherAlert;
