import { router } from "expo-router";
/**
 * @returns - Access to common navigation functions
 */
export function useAppNavigation() {
    const onTrailPress = (id: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId: id },
        })
    }

    const onBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const onUserViewPress = (id?: string) => {
        if (!id) return;
        router.push({
            pathname: '/(main)/user/view',
            params: { userId: id }
        });
    };

    const onDownloadPress = (id: string) => {
        console.log('Downloading: ', id);
    }

    const onSignUpPress = () => {
        router.replace('/(auth)/signup');
    }

    const onLogIn = () => {
        router.replace('/(auth)/login');
    }

    const onNotificationPress = () => {
        router.push('/(main)/home/notification');
    }

    const onBookingPress = () => {
        router.push('/(main)/book/list');
    }

    const onWeatherPress = () => {
        router.push('/(main)/home/weather')
    }

    const onSeeMoreRecommendationsPress = () => {
        router.replace({
            pathname: '/explore',
            params: { filter: 'recommendations' }
        })
    }

    const onSeeMoreDiscoverPress = () => {
        router.replace({
            pathname: '/explore',
            params: { filter: 'trending' }
        })
    }

    const onSeeMoreOffersPress = () => {
        router.replace({
            pathname: '/explore',
            params: { filter: 'offers' }
        })
    }

    const onGroupPress = () => {
        router.push({
            pathname: '/(main)/group/list',
        })
    }

    const onLeaderBoardPress = () => {
        router.push({
            pathname: '/(main)/leaderboard/view',
        })
    }

    const onProfilePress = () => {
        router.replace({
            pathname: '/(tabs)/profile',
        })
    }

    const onSettingsPress = () => {
        router.push({
            pathname: '/(main)/settings',
        })
    }

    const onLanding = () => {
        router.replace('/(auth)/landing');
    }

    const onSecuritySettingsPress = () => {
        router.push('/(main)/settings/security');
    }

    const onNotificationSettingsPress = () => {
        router.push('/(main)/settings/notifications');
    }

    const onPrivacySettingsPress = () => {
        router.push('/(main)/settings/privacy');
    }

    const onAboutSettingsPress = () => {
        router.push('/(main)/settings/about');
    }

    const onHelpSettingsPress = () => {
        router.push('/(main)/settings/help');
    }

    const onHikingPreferencesPress = () => {
        router.push('/(main)/settings/preferences');
    }

    return {
        onLanding,
        onTrailPress,
        onBackPress,
        onDownloadPress,
        onSignUpPress,
        onLogIn,
        onBookingPress,
        onNotificationPress,
        onWeatherPress,
        onSeeMoreRecommendationsPress,
        onSeeMoreDiscoverPress,
        onSeeMoreOffersPress,
        onGroupPress,
        onLeaderBoardPress,
        onProfilePress,
        onSettingsPress,
        onSecuritySettingsPress,
        onNotificationSettingsPress,
        onPrivacySettingsPress,
        onAboutSettingsPress,
        onHelpSettingsPress,
        onHikingPreferencesPress,
        onUserViewPress
    }
}