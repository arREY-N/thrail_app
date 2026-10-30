import { Group } from "@/src/core/models/Group/Group";
import {
    HikerLiveStatus,
    IEnrichedGroupMember,
    IEnrichedHikerLocation,
    IHikerLocation
} from "@/src/features/Navigation/types/HikeRecordingScreen.types";
import { useMemo, useState } from "react";

const MAX_GHOST_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours TTL to retain Last Known Location pins throughout hike day
const SIGNAL_LOST_THRESHOLD_MS = 120000; // 2 minutes without update qualifies as signal lost

const STATUS_RANK: Record<HikerLiveStatus, number> = {
    live: 0,
    signal_lost: 1,
    offline: 2,
};

export interface UseEnrichedHikerLocationsResult {
    sortedMembers: IEnrichedGroupMember[];
    enrichedHikerLocations: IEnrichedHikerLocation[];
    liveCount: number;
    lostCount: number;
}

/**
 * Shared hook to enrich, filter, and synchronize live hiker telemetry across
 * mobile recording screens and web spectator monitoring dashboards.
 *
 * Implements:
 * 1. Strict 24h ghost TTL + drops invalid or missing timestamps.
 * 2. Fallback to `participantsIds` when group type is 'chat' or members are not populated.
 * 3. Consistent live / signal lost / offline calculation.
 */
export function useEnrichedHikerLocations(
    currentGroup: Group | null,
    hikerLocations?: IHikerLocation[] | null,
    currentTimeMs?: number
): UseEnrichedHikerLocationsResult {
    const [mountTime] = useState(() => Date.now());
    const now = typeof currentTimeMs === 'number' && currentTimeMs > 0 ? currentTimeMs : mountTime;

    return useMemo(() => {
        // 1. Strict filtering of raw hiker locations (24h TTL + drop missing/invalid timestamps)
        const validLocations: IHikerLocation[] = (hikerLocations || []).filter((hiker): hiker is IHikerLocation => {
            if (!hiker || typeof hiker !== 'object') return false;
            if (typeof hiker.latitude !== 'number' || isNaN(hiker.latitude)) return false;
            if (typeof hiker.longitude !== 'number' || isNaN(hiker.longitude)) return false;
            if (!hiker.timestamp) return false;

            const timeMs = hiker.timestamp instanceof Date
                ? hiker.timestamp.getTime()
                : new Date(hiker.timestamp).getTime();

            if (isNaN(timeMs) || timeMs <= 0) return false;

            const ageMs = now - timeMs;
            return ageMs >= -60000 && ageMs <= MAX_GHOST_AGE_MS; // Allow up to 1 min clock skew
        });

        // 2. Build complete member list (Admins + Members + Chat participantsIds fallback)
        const seenIds = new Set<string>();
        type MemberEntry = {
            id: string;
            firstname: string;
            lastname: string;
            username?: string;
            email?: string;
            bookingId?: string;
        };
        const membersList: MemberEntry[] = [];

        const rawAdmins = currentGroup?.admins || [];
        const rawMembers = currentGroup?.members || [];

        for (const admin of rawAdmins) {
            if (admin?.id && !seenIds.has(admin.id)) {
                seenIds.add(admin.id);
                membersList.push({
                    id: admin.id,
                    firstname: admin.firstname || '',
                    lastname: admin.lastname || '',
                    username: admin.username,
                    email: admin.email,
                });
            }
        }

        for (const member of rawMembers) {
            if (member?.id && !seenIds.has(member.id)) {
                seenIds.add(member.id);
                membersList.push({
                    id: member.id,
                    firstname: member.firstname || '',
                    lastname: member.lastname || '',
                    username: member.username,
                    email: member.email,
                    bookingId: member.bookingId,
                });
            }
        }

        // Support type === 'chat' or sparse groups: fall back to participantsIds
        if (currentGroup?.participantsIds && Array.isArray(currentGroup.participantsIds)) {
            for (const pid of currentGroup.participantsIds) {
                if (pid && !seenIds.has(pid)) {
                    seenIds.add(pid);
                    const matchLoc = validLocations.find((loc) => loc.id === pid);
                    const nameParts = matchLoc?.hikerName ? matchLoc.hikerName.trim().split(' ') : [];
                    const firstname = nameParts[0] || 'Member';
                    const lastname = nameParts.slice(1).join(' ') || '';
                    membersList.push({
                        id: pid,
                        firstname,
                        lastname,
                    });
                }
            }
        }

        // Ensure any active broadcaster in validLocations is represented even if missing from group roster
        for (const loc of validLocations) {
            if (loc.id && !seenIds.has(loc.id)) {
                seenIds.add(loc.id);
                const nameParts = loc.hikerName ? loc.hikerName.trim().split(' ') : [];
                membersList.push({
                    id: loc.id,
                    firstname: nameParts[0] || 'Hiker',
                    lastname: nameParts.slice(1).join(' ') || '',
                });
            }
        }

        // 3. Map members with telemetry data & determine live/lost/offline status
        let liveCount = 0;
        let lostCount = 0;

        const membersWithLoc: IEnrichedGroupMember[] = membersList.map((member) => {
            const locData = validLocations.find((loc) => loc.id === member.id);
            let status: HikerLiveStatus = 'offline';

            if (locData) {
                const timeMs = locData.timestamp instanceof Date
                    ? locData.timestamp.getTime()
                    : new Date(locData.timestamp).getTime();
                const elapsedMs = isNaN(timeMs) ? Infinity : Math.max(0, now - timeMs);

                if (locData.status === 'GPS_SIGNAL_LOST' || elapsedMs > SIGNAL_LOST_THRESHOLD_MS) {
                    status = 'signal_lost';
                    lostCount++;
                } else {
                    status = 'live';
                    liveCount++;
                }
            }

            return {
                ...member,
                locData,
                status,
                isInactive: status !== 'live',
            };
        });

        // 4. Sort members: Live (0) -> Signal Lost (1) -> Offline (2), then newest timestamp
        const sortedMembers = membersWithLoc.sort((a, b) => {
            if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
                return STATUS_RANK[a.status] - STATUS_RANK[b.status];
            }
            const timeA = a.locData?.timestamp ? new Date(a.locData.timestamp).getTime() : 0;
            const timeB = b.locData?.timestamp ? new Date(b.locData.timestamp).getTime() : 0;
            return timeB - timeA;
        });

        // 5. Build enriched hiker location records with resolved hiker names
        const enrichedHikerLocations: IEnrichedHikerLocation[] = validLocations.map((hiker) => {
            if (hiker.hikerName && hiker.hikerName.trim()) {
                return hiker;
            }
            const member = sortedMembers.find((m) => m.id === hiker.id);
            if (member) {
                const name = `${member.firstname || ''} ${member.lastname || ''}`.trim() || 'Hiker';
                return {
                    ...hiker,
                    hikerName: name,
                };
            }
            return hiker;
        });

        return {
            sortedMembers,
            enrichedHikerLocations,
            liveCount,
            lostCount,
        };
    }, [currentGroup, hikerLocations, now]);
}
