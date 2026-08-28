import { useCallback } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    View
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Interface representing a single notification item.
 */
export interface AppNotification {
    id: string | number;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
}

/**
 * Props for the NotificationScreen component.
 */
export interface NotificationScreenProps {
    /** Array of notification objects to display */
    notifications: AppNotification[];
    /** Callback fired when the back button is pressed */
    onBackPress: () => void;
    /** Callback fired when a specific notification item is pressed */
    onPressItem: (id: string | number) => void;
}

/**
 * Interface representing the icon data returned for a notification category.
 */
interface NotificationIconData {
    name: string;
    lib: IconLibrary;
    color: string;
}

/**
 * Determines the icon properties based on the notification title.
 * @param title - The title of the notification
 * @returns {NotificationIconData} The icon data (name, library, and color)
 */
const getIcon = (title: string): NotificationIconData => {
    const t = title.toLowerCase();
    if (t.includes('update')) return { name: 'download-cloud', lib: 'Feather', color: Colors.PRIMARY };
    if (t.includes('welcome')) return { name: 'star', lib: 'Feather', color: '#FFC107' };
    if (t.includes('alert') || t.includes('warning')) return { name: 'alert-circle', lib: 'Feather', color: '#FF5252' };
    return { name: 'bell', lib: 'Feather', color: Colors.PRIMARY };
};

/**
 * Screen displaying a list of user notifications.
 * @param {NotificationScreenProps} props - The component props
 */
const NotificationScreen = ({ notifications, onBackPress, onPressItem }: NotificationScreenProps) => {

    const renderItem = useCallback(({ item }: ListRenderItemInfo<AppNotification>) => {
        const iconData = getIcon(item.title);

        return (
            <Pressable
                onPress={() => onPressItem(item.id)}
                style={({ pressed }) => [
                    styles.cardContainer,
                    pressed && styles.cardPressed,
                    !item.isRead && styles.unreadCard
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: iconData.color + '15' }]}>
                    <CustomIcon
                        library={iconData.lib}
                        name={iconData.name}
                        size={24}
                        color={iconData.color}
                    />
                </View>

                <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                        <CustomText
                            variant="subtitle"
                            style={[styles.title, !item.isRead && styles.unreadTitle]}
                            numberOfLines={1}
                        >
                            {item.title}
                        </CustomText>

                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>

                    <CustomText variant="body" style={styles.message} numberOfLines={2}>
                        {item.message}
                    </CustomText>

                    <CustomText variant="caption" style={styles.time}>
                        {item.time}
                    </CustomText>
                </View>
            </Pressable>
        );
    }, [onPressItem]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Notifications"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <CustomIcon library="Feather" name="bell-off" size={48} color={Colors.GRAY_MEDIUM} />
                        <CustomText style={{ color: Colors.TEXT_SECONDARY, marginTop: 12 }}>
                            No notifications yet
                        </CustomText>
                    </View>
                }
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    listContent: {
        padding: 16,
        gap: 16,
    },

    cardContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        alignItems: 'flex-start',





        ...GlobalStyles.dropShadow(3),
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }]
    },
    unreadCard: {
        backgroundColor: Colors.WHITE,
        borderLeftWidth: 3,
        borderLeftColor: Colors.PRIMARY,
    },

    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },

    textContainer: {
        flex: 1,
        gap: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        flex: 1,
        marginRight: 8,
        color: Colors.TEXT_PRIMARY,
    },
    unreadTitle: {
        fontWeight: '700',
        color: Colors.BLACK,
    },
    message: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
    time: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.TEXT_PLACEHOLDER,
        fontWeight: '500',
    },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.PRIMARY,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    }
});

export default NotificationScreen;
