import EmergencyNotification from '@/src/components/EmergencyNotification';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useStats } from '@/src/core/hook/useStats';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

/**
 * Controller component for the Profile tab.
 * Gathers user data, hike logs, reviews, and computes summary statistics.
 */import { View } from 'react-native';

export default function Profile() {
    const {
        onSettingsPress,
        onGroupPress
    } = useAppNavigation();

    const {
        profile,
        role,
        onSignOutPress,
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onApplyPress,
    } = useProfileNavigation();

    const {
        myReviews,
        likeReview,
        isLiked,
        onWriteReviewPress,
    } = useReview();

    const {
        computedStats
    } = useStats();

    return (
        <View style={{ flex: 1 }}>
            <ProfileScreen
                onSignOutPress={onSignOutPress}
                onApplyPress={onApplyPress}
                onAdminPress={onAdminPress}
                onSettingsPress={onSettingsPress}
                onSuperadminPress={onSuperadminPress}
                stats={computedStats}
                hikeLog={myReviews}
                profile={profile ?? undefined}
                role={role ?? undefined}
                onLikeReview={likeReview}
                isLiked={(review) => Boolean(isLiked(review))}
                onEditReview={onWriteReviewPress}
                onGroupPress={onGroupPress}
            />

            <EmergencyNotification />
        </View>
    );
}

/* 
const TESTLEADERBOARD = ({
    generateMonthlyLeaderboard,
    leaderboard,
    getMonthLeaderboard,
    error,
}) => {
    return (
        <View>
            <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-06-01'))}>
                    <Text>Test Generator for June</Text>
                </Pressable>
                <View style={{ height: 20 }} />
                <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-07-01'))}>
                    <Text>Test Generator for July</Text>
                </Pressable>
                <View style={{ height: 20 }} />
                <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-08-01'))}>
                    <Text>Test Generator for Now</Text>
                </Pressable>
                <View style={{ height: 20 }} />
                <Pressable onPress={() => getMonthLeaderboard()}>
                    <Text>Fetch Current Leaderboard</Text>
                </Pressable>

                { error && <Text>{error}</Text>}

                { leaderboard && (
                    <View style={{ marginTop: 20 }}>
                        <Text>Leaderboard for {leaderboard.date.toLocaleDateString('en-US', { month: 'short'})}</Text>
                        {leaderboard.userRankings.map((user, index) => (
                            <View key={user.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                                <Text>{index + 1}. {user.username}</Text>
                                <Text>{user.totalDistance.toFixed(2)} m</Text>
                            </View>
                        ))}

                    </View>
                )}

        </View>
    );
}
*/
