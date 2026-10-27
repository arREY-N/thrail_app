import { requestNotificationPermission } from '@/src/core/models/Notification/Notification';
import { NotificationToken, useAuthHook, useUserStore } from '@/src/core/models/User/User';
import { logger } from '@/src/core/utility/errorFormatter';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';


export function useNotifyPermission() {
    const [token, setToken] = useState<string | null>(null);
    const { profile } = useAuthHook();

    const hasRun = useRef(false);

    const addUserNotificationToken = useUserStore(s => s.addUserNotificationToken);

    useEffect(() => {
        const fetchToken = async () => {
            if (hasRun.current === true) {
                return;
            }

            const result = await requestNotificationPermission();
            setToken(result);

            if (!result) {
                logger('UseNotifyPermission', "No notification token obtained. User may have denied permission or an error occurred.");
                return;
            }

            let platform: string | null = null;

            if (Platform.OS === 'web') {
                platform = 'web';
            } else if (Platform.OS === 'ios') {
                platform = 'ios';
            } else if (Platform.OS === 'android') {
                platform = 'android';
            }

            if (!platform) {
                logger('UseNotifyPermission', "Unsupported platform for notifications:", Platform.OS);
                return;
            }

            const newToken: NotificationToken<Date> = {
                token: result || '',
                platform: String(platform) as 'web' | 'ios' | 'android',
                lastUpdated: new Date(),
            }

            if (!profile) {
                logger('UseNotifyPermission', "No user profile found. Cannot associate notification token.");
                return;
            }

            if (profile.fcmTokens.some(t => t.token === newToken.token)) {
                return;
            }

            await addUserNotificationToken(newToken, profile);

            hasRun.current = true;
        };

        fetchToken();
    }, [addUserNotificationToken, profile]);


    return token;
}