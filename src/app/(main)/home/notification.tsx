
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useNotifications } from "@/src/core/models/Notification/Notification";
import NotificationScreen from '@/src/features/Home/screens/NotificationScreen';

export default function Notification() {
    const { onBackPress } = useAppNavigation();

    const {
        notifications,
        onViewNotification,
    } = useNotifications();

    return (
        <NotificationScreen
            {...{
                notifications: notifications,
                onBackPress: onBackPress,
                onPressItem: onViewNotification
            } as any}
        />
    );
}