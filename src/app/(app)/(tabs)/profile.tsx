import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import EmergencyNotification from '@/src/components/EmergencyNotification';
import { ViewProfile } from '@/src/core/flows/ViewProfile';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

/**
 * Controller component for the Profile tab.
 * Gathers user data, hike logs, reviews, and computes summary statistics.
 */import { Pressable, View } from 'react-native';

export default function Profile() {
    const {
        hikeLog,
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
        onSeeMore,
    } = ViewProfile();

    if (isLoading) return (
        <CustomLoading
            message="Loading Profile"
        />
    )

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
                profile={profile ?? undefined}
                role={role ?? undefined}
                onLikeReview={likeReview}
                isLiked={isLiked}
                onEditReview={onWriteReviewPress}
                onGroupPress={onGroupPress}
            />
            <Pressable onPress={onSeeMore} style={{ position: 'absolute', bottom: 100, right: 20 }}>
                <CustomText style={{ fontSize: 20, color: 'blue' }}>See More</CustomText>
            </Pressable>

            <EmergencyNotification />
        </View>
    );
}
