import { RelativePathString, router } from "expo-router";
/**
 * @returns - Access to common navigation functions
 */
export function useAppNavigation() {
    const onTrailPress = (id: string) => {
        router.push({
            pathname: '/trail/view',
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
            pathname: '/user/view',
        });
    };

    const onDownloadPress = (id: string) => {
        console.log('Downloading: ', id);
    }

    const onSignUpPress = () => {
        router.replace('/signup');
    }

    const onLogIn = () => {
        router.replace('/login');
    }

    const onNotificationPress = () => {
        router.push('/home/notification');
    }

    const onBookingPress = () => {
        router.push('/book/list');
    }

    const onWeatherPress = () => {
        router.push('/home/weather')
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
            pathname: '/group/list',
        })
    }

    const onLeaderBoardPress = () => {
        router.push({
            pathname: '/leaderboard/view',
        })
    }

    const onProfilePress = () => {
        router.replace({
            pathname: '/profile',
        })
    }

    const onSettingsPress = () => {
        router.push({
            pathname: '/settings',
        })
    }

    const onLanding = () => {
        router.replace('/(auth)/landing');
    }

    const onSecuritySettingsPress = () => {
        router.push('/settings/security');
    }

    const onPrivacySettingsPress = () => {
        router.push('/settings/privacy');
    }

    const onAboutSettingsPress = () => {
        router.push('/settings/about');
    }

    const onTestSettingsPress = () => {
        router.push('/settings/test' as unknown as RelativePathString);
    }

    const onHelpSettingsPress = () => {
        router.push('/settings/help');
    }

    const onHikingPreferencesPress = () => {
        router.push('/settings/preferences');
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
        onPrivacySettingsPress,
        onAboutSettingsPress,
        onTestSettingsPress,
        onHelpSettingsPress,
        onHikingPreferencesPress,
        onUserViewPress
    }
}