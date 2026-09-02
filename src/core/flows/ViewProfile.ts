import { SignOutFlow } from "@/src/core/flows/SignOutFlow";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useProfileNavigation } from "@/src/core/hook/navigation/useProfileNavigation";
import { Hike, useHikeList } from "@/src/core/models/Hike/Hike";
import { newReview, Review, useReview, useReviewList } from "@/src/core/models/Review/Review";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { logger } from "@/src/core/utility/errorFormatter";
import { formatDistance, formatTime } from "@/src/core/utility/statsFormatter";
import { useMemo, useState } from "react";

export function ViewProfile() {
    const { profile, role } = useAuthHook();

    const {
        onSettingsPress,
        onGroupPress
    } = useAppNavigation();

    const {
        signOut
    } = SignOutFlow();

    const {
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
    } = useProfileNavigation();

    const {
        likeReview,
        isLiked,
        onWriteReviewPress,
    } = useReview();

    const { reviews, reviewIsLoading } = useReviewList();
    const { hikes, hikeIsLoading } = useHikeList();

    const hikeLog = useMemo<Review[]>(() => {
        if (!profile?.id) return [];

        const userSummary = UserLogic.toSummary(profile);

        const userReviews = reviews.filter(r => r.user.id === profile.id);
        const formattedHikes = (hikes || []).map(h => newReview({ ...h, user: userSummary }))

        return [
            ...userReviews,
            ...formattedHikes
        ].sort((a, b) => {
            const dateA = a.hikeDate ? new Date(a.hikeDate).getTime() : 0;
            const dateB = b.hikeDate ? new Date(b.hikeDate).getTime() : 0;
            return dateB - dateA;
        });
    }, [hikes, profile, reviews])

    const computedStats = useMemo(() => {
        logger('useStates', 'Computin stats', hikes.length);
        const totalHikesCount = hikes.length;
        const lastHikeName = totalHikesCount > 0 ? (hikes[0].trail?.name || '') : '';
        let maxDist = 0; let maxDistTrail = '0';
        let maxTime = 0; let maxTimeTrail = '0';
        let maxElev = 0; let maxElevTrail = '0';

        hikes.forEach((log: Hike) => {
            const dist = log.distance ?? 0;
            const time = log.duration ?? 0;
            const elev = log.elevation ?? 0;
            const trailName = log.trail?.name || '';

            if (dist && dist > maxDist) { maxDist = dist; maxDistTrail = trailName; }
            if (time && time > maxTime) { maxTime = time; maxTimeTrail = trailName; }
            if (elev && elev > maxElev) { maxElev = elev; maxElevTrail = trailName; }
        });

        return {
            longestDistance: { value: formatDistance(maxDist), trail: maxDistTrail },
            longestTime: { value: formatTime(maxTime), trail: maxTimeTrail },
            highestPoint: { value: maxElev !== 0 ? `${Math.round(maxElev)} m` : '0', trail: maxElevTrail },
            totalHikes: { value: String(totalHikesCount), lastHike: lastHikeName },
            achievements: {
                beginner: totalHikesCount >= 5,
                regular: totalHikesCount >= 10,
                experienced: totalHikesCount >= 15
            }
        }
    }, [hikes]);

    const [page, setPage] = useState(5);

    const visibleHikeLog = useMemo(() => {
        return hikeLog.slice(0, page);
    }, [hikeLog, page])

    const onSeeMore = () => {
        setPage(prev => {
            if (prev + 5 > hikeLog.length) return hikeLog.length;
            return prev + 5
        });
    }
    return {
        onSeeMore,
        hikeLog: visibleHikeLog,
        reviews,
        hikes,
        isLoading: hikeIsLoading || reviewIsLoading,
        computedStats,
        role,
        profile,
        onSettingsPress,
        onGroupPress,
        signOut,
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
        likeReview,
        isLiked,
        onWriteReviewPress,
    }
}