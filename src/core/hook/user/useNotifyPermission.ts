import { requestNotificationPermission } from '@/src/core/hook/notification/useNotification';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { NotificationToken } from '@/src/core/models/User/User.types';
import { useUsersStore } from '@/src/core/stores/usersStore';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useNotifyPermission() {
    const [token, setToken] = useState<string | null>(null);
    const { profile } = useAuthHook();

    const hasRun = useRef(false);

    const addUserNotificationToken = useUsersStore(s => s.addUserNotificationToken);

    useEffect(() => {
        const fetchToken = async () => {
            if (hasRun.current === true) {
                return;
            }
            const result = await requestNotificationPermission();
            console.log("Notification Permission Token:", result);
            setToken(result);

            if(!result) {
                console.warn("No notification token obtained. User may have denied permission or an error occurred.");
                return;
            }

            let platform: string | null = null;

            if(Platform.OS === 'web') {
                platform = 'web';
            } else if(Platform.OS === 'ios') {
                platform = 'ios';
            } else if(Platform.OS === 'android') {
                platform = 'android';
            }

            if(!platform) {
                console.warn("Unsupported platform for notifications:", Platform.OS);
                return;
            }

            const newToken: NotificationToken<Date> = {
                token: result || '',
                platform: String(platform) as 'web' | 'ios' | 'android',
                lastUpdated: new Date(),
            }
            
            if(!profile) {
                console.warn("No user profile found. Cannot associate notification token.");
                return;
            }

            if(profile.fcmTokens.some(t => t.token === newToken.token)) {
                console.log("Notification token already exists for user profile.");
                return;
            }

            await addUserNotificationToken(newToken, profile);

            console.log('Notification token added to user profile:', newToken);
            hasRun.current = true;
        };

        fetchToken();
    }, [profile?.id]);
    

    return token;
}