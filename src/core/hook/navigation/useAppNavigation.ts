import { router } from "expo-router";
/**
 * @returns - Access to common navigation functions
 */
export function useAppNavigation() {
    const onTrailPress = (id: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId: id},
        })
    }

    const onBackPress = () => {
        router.back();
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

    const onViewAllRecommendationPress = () => {
        router.replace({
            pathname: '/explore',
            params: { filter: 'recommendations'}
        })
    }
    
    const onViewAllTrendingPress = () => {
        router.replace({
            pathname: '/explore',
            params: { filter: 'trending'}
        })
    }

    return {
        onTrailPress,
        onBackPress,
        onDownloadPress,
        onSignUpPress,
        onLogIn,
        onBookingPress, 
        onNotificationPress,
        onWeatherPress,
        onViewAllRecommendationPress,
        onViewAllTrendingPress,
    }
}