import { useViewNotification } from "@/src/core/hook/notification/useViewNotification";
import { Notification } from "@/src/core/models/Notification/Notification";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function viewNotification() {
    const { notificationId: rawId } = useLocalSearchParams();

    const notificationId = getSearchParam(rawId);

    const {
        notification
    } = useViewNotification(notificationId);

    return (
        <>
            <Stack.Screen options={{headerShown: true }}/>
            <TESTNOTIFICATION
                notification={notification}
            />
        </>
    )
}

export interface NotificationParams{
    notification: Notification | null;
}

export const TESTNOTIFICATION = (params: NotificationParams) => {
    
    if(params.notification === null){
        return(
            <View>
                <Text>Notification not found</Text>
            </View>
        )
    }
    
    return(
        <View>
            <Text>Notification Screen</Text>
            <Text>Title: {params.notification.title}</Text>
            <Text>Message: {params.notification.message}</Text>
            <Text>Read: {params.notification.read ? 'Yes' : 'No'}</Text>
        </View>
    )
}