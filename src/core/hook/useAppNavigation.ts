import { router } from "expo-router";
export function useAppNavigation() {
    const onMountainPress = (id: string) => {
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

    return {
        onMountainPress,
        onBackPress,
        onDownloadPress,
        onSignUpPress,
        onLogIn,
        onBookingPress, 
        onNotificationPress
    }
}