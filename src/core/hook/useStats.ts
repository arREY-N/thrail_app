import useReview from "@/src/core/hook/review/useReview";
import { Hike, useHikeList } from "@/src/core/models/Hike/Hike";



export function useStats() {
    const { myReviews } = useReview();

    const { hikes } = useHikeList();

    let maxDist = 0; let maxDistTrail = '--';
    let maxTime = 0; let maxTimeTrail = '--';
    let maxElev = 0; let maxElevTrail = '--';

    hikes.forEach((log: Hike) => {
        const dist = log.distance ?? 0;
        const time = log.duration ?? 0;
        const elev = log.elevation ?? 0;
        const trailName = log.trail?.name || '--';

        if (dist && dist > maxDist) { maxDist = dist; maxDistTrail = trailName; }
        if (time && time > maxTime) { maxTime = time; maxTimeTrail = trailName; }
        if (elev && elev > maxElev) { maxElev = elev; maxElevTrail = trailName; }
    });

    const totalHikesCount = myReviews.length;
    const lastHikeName = totalHikesCount > 0 ? (myReviews[0].trail?.name || '--') : '--';

    const formatTime = (ms: number) => {
        if (ms === 0) return '--';
        const totalMins = Math.floor(ms / 60000);
        if (totalMins < 1) return '< 1m';
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDistance = (m: number) => {
        if (m === 0) return '--';
        return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
    };

    const computedStats = {
        longestDistance: { value: formatDistance(maxDist), trail: maxDistTrail },
        longestTime: { value: formatTime(maxTime), trail: maxTimeTrail },
        highestPoint: { value: maxElev !== 0 ? `${Math.round(maxElev)} m` : '--', trail: maxElevTrail },
        totalHikes: { value: String(totalHikesCount), lastHike: lastHikeName },
        achievements: {
            beginner: totalHikesCount >= 5,
            regular: totalHikesCount >= 10,
            experienced: totalHikesCount >= 15
        }
    };

    return {
        computedStats
    }
}