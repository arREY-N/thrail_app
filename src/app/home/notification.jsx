import { useRouter } from "expo-router";
import React, { useState } from "react";

import NotificationScreen from "../../features/Home/screens/NotificationScreen";

export default function notification() {
    const router = useRouter();

    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Lorem Ipsum',
            message: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
            time: '2 hours ago',
            isRead: false, 
        },
        {
            id: '2',
            title: 'System Update',
            message: 'Your profile has been successfully updated.',
            time: '21 hours ago',
            isRead: true,
        },
        {
            id: '3',
            title: 'Lorem Ipsum',
            message: 'It is a long established fact that a reader will be distracted by the readable content.',
            time: '1 day ago',
            isRead: false,
        },
        {
            id: '4',
            title: 'Welcome!',
            message: 'Thanks for joining our hiking community. Start exploring trails now!',
            time: '2 days ago',
            isRead: false,
        },
    ]);

    const handleBack = () => {
        router.back();
    };

    const handlePressItem = (id) => {
        setNotifications(prev => prev.map(item => 
            item.id === id ? { ...item, isRead: true } : item
        ));
    };

    return (
        <NotificationScreen 
            notifications={notifications}
            onBackPress={handleBack}
            onPressItem={handlePressItem}
        />
    );
}