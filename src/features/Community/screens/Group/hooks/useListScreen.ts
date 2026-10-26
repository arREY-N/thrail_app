/**
 * @file useListScreen.ts
 * @description Custom hook for ListScreen business logic, specifically managing the sorting of active group chats.
 */

import { useMemo } from 'react';
import { GroupWithLegacyName } from '@/src/features/Community/screens/Group/ListScreen';

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
            const timeA = a.lastMessage?.timesent 
                ? new Date(a.lastMessage.timesent as unknown as string | number).getTime() 
                : (a.updatedAt ? new Date(a.updatedAt as unknown as string | number).getTime() : (a.createdAt ? new Date(a.createdAt as unknown as string | number).getTime() : 0));
            const timeB = b.lastMessage?.timesent 
                ? new Date(b.lastMessage.timesent as unknown as string | number).getTime() 
                : (b.updatedAt ? new Date(b.updatedAt as unknown as string | number).getTime() : (b.createdAt ? new Date(b.createdAt as unknown as string | number).getTime() : 0));
            return timeB - timeA;
        });
    }, [groups]);

    return {
        sortedGroups,
    };
};
