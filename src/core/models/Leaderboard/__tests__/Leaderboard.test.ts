import { Hike } from "@/src/core/models/Hike/Hike";
import { onCreateMonthlyLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { User } from "@/src/core/models/User/User";

describe('Leaderboard - Business Requirements', () => {

    it('should correctly rank users using Dense Ranking', () => {
        const users: User[] = [
            { id: 'u1', username: 'Alice' } as User,
            { id: 'u2', username: 'Bob' } as User,
            { id: 'u3', username: 'Charlie' } as User
        ];

        // We instantiate real Hike objects now
        // We manually inject userId since it's not a property of the Hike class itself
        const hikes: (Hike & { userId: string })[] = [
            new Hike({ status: 'completed', startTime: new Date('2026-06-05'), endTime: new Date('2026-06-05'), distance: 200 }) as any,
            new Hike({ status: 'completed', startTime: new Date('2026-06-05'), endTime: new Date('2026-06-05'), distance: 200 }) as any,
            new Hike({ status: 'completed', startTime: new Date('2026-06-05'), endTime: new Date('2026-06-05'), distance: 100 }) as any,
        ];
        
        // Stitched UserIDs
        hikes[0].userId = 'u2';
        hikes[1].userId = 'u3';
        hikes[2].userId = 'u1';

        const leaderboard = onCreateMonthlyLeaderboard(users, hikes);

        expect(leaderboard.ranking).toHaveLength(3);
        
        const bob = leaderboard.ranking.find(r => r.userId === 'u2');
        const charlie = leaderboard.ranking.find(r => r.userId === 'u3');
        const alice = leaderboard.ranking.find(r => r.userId === 'u1');

        expect(bob?.rank).toBe(1);
        expect(charlie?.rank).toBe(1);
        expect(alice?.rank).toBe(2); 
    });

    it('should exclude completed hikes that lack an endTime property', () => {
        const users: User[] = [{ id: 'u1' } as User];
        
        const hikes: (Hike & { userId: string })[] = [
            new Hike({ status: 'completed', startTime: new Date('2026-06-05'), endTime: undefined, distance: 100 }) as any
        ];
        hikes[0].userId = 'u1';

        const leaderboard = onCreateMonthlyLeaderboard(users, hikes);
        
        const entry = leaderboard.ranking.find(r => r.userId === 'u1');
        
        expect(entry?.numberOfHikes).toBe(0);
        expect(entry?.totalLength).toBe(0);
    });
});