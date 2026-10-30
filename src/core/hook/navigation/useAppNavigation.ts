import { router } from "expo-router";
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


    const onNotificationPress = () => {
        router.push('/(app)/(main)/notification');
    };

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

    const onTrailOfTheMonthPress = (trailId: string, monthId?: string) => {
        router.push({
            pathname: '/(app)/(main)/recommendation/view',
            params: { trailId, month: monthId },
        });
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
        router.push('/settings/test');
    }

    const onHelpSettingsPress = () => {
        router.push('/settings/help');
    }

    const onHikingPreferencesPress = () => {
        router.push('/settings/preferences');
    }

    const onTermsSettingsPress = () => {
        router.push('/(app)/(main)/settings/legal/terms');
    };

    const onPrivacyPolicySettingsPress = () => {
        router.push('/(app)/(main)/settings/legal/privacy');
    };

    const onPoliciesSettingsPress = () => {
        router.push('/(app)/(main)/settings/legal/policies');
    };

    return {
        onTrailPress,
        onBackPress,
        onDownloadPress,
        onBookingPress,
        onNotificationPress,
        onWeatherPress,
        onSeeMoreRecommendationsPress,
        onTrailOfTheMonthPress,
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
        onTermsSettingsPress,
        onPrivacyPolicySettingsPress,
        onPoliciesSettingsPress,
        onUserViewPress
    }
}