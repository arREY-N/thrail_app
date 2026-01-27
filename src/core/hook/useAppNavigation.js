import { useRouter } from 'expo-router';

export function useAppNavigation() {
    const router = useRouter();

    const onMountainPress = (id) => {
        console.log('Routing to: ', id);
        router.push(`/(mountain)/${id}`);
    };

    const onBackPress = () => {
        router.back();
    };

    const onDownloadPress = (id) => {
        console.log('Downloading: ', id);
    };

    const onNotificationPress = () => {
        router.push('/(home)/notification');
    };

    const onBookingPress = () => {
        router.push('/(book)/userBooking');
    };

    return {
        onMountainPress,
        onBackPress,
        onDownloadPress,
        onNotificationPress,
        onBookingPress,
    };
}
