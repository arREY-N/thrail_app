import EmergencyNotification from '@/src/components/EmergencyNotification';
import { ViewProfile } from '@/src/core/flows/ViewProfile';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import { View } from 'react-native';

/**
 * Controller component for the Profile tab.
 * Gathers user data, hike logs, reviews, and computes summary statistics.
 * Passes isLoading to ProfileScreen so the skeleton renders inside the Hike Log tab
 * rather than gating the entire screen behind a full-screen spinner.
 */
export default function profile() {
    const {
        hikeLog,
        hasMore,
        computedStats,
        profile,
        role,
        onGroupPress,
        onSettingsPress,
        signOut,
        onAdminPress,
        onSuperadminPress,
        likeReview,
        isLiked,
        onWriteReviewPress,
        onApplyPress,
        isLoading,
        isRefreshing,
        onRefresh,
        error,
        onSeeMore,
    } = ViewProfile();

    return (
        <View style={{ flex: 1 }}>
            <ProfileScreen
                onSignOutPress={signOut}
                onApplyPress={onApplyPress}
                onAdminPress={onAdminPress}
                onSettingsPress={onSettingsPress}
                onSuperadminPress={onSuperadminPress}
                stats={computedStats}
                hikeLog={hikeLog}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                error={error}
                profile={profile ?? undefined}
                role={role ?? undefined}
                onLikeReview={likeReview}
                isLiked={isLiked}
                onEditReview={onWriteReviewPress}
                onGroupPress={onGroupPress}
                onSeeMore={onSeeMore}
                hasMore={hasMore}
            />

            <EmergencyNotification />
        </View>
    );
}

