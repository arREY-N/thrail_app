import { useRouter } from 'expo-router';

export function useAppNavigation() {
    const router = useRouter();

    const onMountainPress = (id) => {
        router.push(`/(mountain)/${id}`)
    }

    const onBackPress = () => {
        router.back();
    };

    const onDownloadPress = (id) => {
        console.log('Downloading: ', id);
    }

    const onSignUpPress = () => {
        router.replace('/(auth)/signup');
    }

    const onLogIn = () => {
        router.replace('/(auth)/login');
    }

    const onNotificationPress = () => {
        router.push('/(home)/notification');
    }

    const onBookingPress = () => {
        router.push('/(book)/userBooking');
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