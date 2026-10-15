/**
 * @file NotificationScreen.tsx
 * @description Notification list screen displaying notifications ordered chronologically,
 * constrained to Layout.MAX_WIDTH on Web, with dedicated empty state handling.
 */

import React, { useCallback, useMemo } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    Platform,
    StyleSheet,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { Notification } from '@/src/core/models/Notification/Notification';
import { NotificationCard } from '@/src/features/Notification/components/NotificationCard';
import { safeParseDateString } from '@/src/utils/dateFormatter';

/**
 * Props for the NotificationScreen component.
 * @param notifications - Array of canonical Notification objects to display
 * @param onBackPress - Callback fired when the header back button is pressed
 * @param onPressItem - Callback fired when a specific notification item is tapped
 */
export interface NotificationScreenProps {
    notifications: Notification[];
    onBackPress: () => void;
    onPressItem: (id: string) => void;
}

/**
 * Screen displaying the user's notifications ordered chronologically (newest first).
 * Centered and constrained to Layout.MAX_WIDTH on Desktop Web viewports.
 */
export const NotificationScreen = ({
    notifications,
    onBackPress,
    onPressItem,
}: NotificationScreenProps): React.JSX.Element => {
    const sortedNotifications = useMemo(() => {
        if (!notifications) return [];
        return [...notifications].sort((a, b) => {
            const timeA = a.createdAt instanceof Date
                ? a.createdAt.getTime()
                : safeParseDateString(a.createdAt).getTime();
            const timeB = b.createdAt instanceof Date
                ? b.createdAt.getTime()
                : safeParseDateString(b.createdAt).getTime();
            return timeB - timeA;
        });
    }, [notifications]);

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Notification>) => (
            <NotificationCard item={item} onPress={onPressItem} />
        ),
        [onPressItem]
    );

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Notifications"
                centerTitle={true}
                onBackPress={onBackPress}
                showDefaultIcons={Platform.OS === 'web'}
            />

            <View style={styles.constrainer}>
                <FlatList
                    data={sortedNotifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <CustomIcon
                                library="Feather"
                                name="bell-off"
                                size={48}
                                color={Colors.GRAY_MEDIUM}
                            />
                            <CustomText variant="subtitle" style={styles.emptyTitle}>
                                No notifications yet
                            </CustomText>
                            <CustomText variant="body" style={styles.emptySubtitle}>
                                You&apos;re all caught up! New updates, advisories, and booking reminders will appear here.
                            </CustomText>
                        </View>
                    }
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        flex: 1,
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default NotificationScreen;
