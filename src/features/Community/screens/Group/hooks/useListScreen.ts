/**
 * @file useListScreen.ts
 * @description Custom hook for ListScreen business logic, specifically managing the sorting of active group chats.
 */

import { useMemo } from 'react';
import { GroupWithLegacyName } from '../ListScreen';

export interface UseListScreenProps {
    groups: GroupWithLegacyName[];
}

/**
 * Hook to manage group list state and sorting.
 * 
 * @param props - Custom hook inputs
 */
export const useListScreen = ({ groups }: UseListScreenProps) => {
    const sortedGroups = useMemo(() => {
        if (!groups) return [];
        return [...groups].sort((a, b) => {
            const timeA = a.lastMessage?.timesent ? new Date(a.lastMessage.timesent as unknown as string | number).getTime() : 0;
            const timeB = b.lastMessage?.timesent ? new Date(b.lastMessage.timesent as unknown as string | number).getTime() : 0;
            return timeB - timeA;
        });
    }, [groups]);

    return {
        sortedGroups,
    };
};
