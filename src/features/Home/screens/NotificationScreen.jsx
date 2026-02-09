import React from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    View
} from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomIcon from '../../../components/CustomIcon'; // Make sure to import this
import CustomText from '../../../components/CustomText';
import ScreenWrapper from '../../../components/ScreenWrapper'; // Use ScreenWrapper for consistency
import { Colors } from '../../../constants/colors';

const NotificationScreen = ({ notifications, onBackPress, onPressItem }) => {

    const getIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes('update')) return { name: 'download-cloud', lib: 'Feather', color: Colors.PRIMARY };
        if (t.includes('welcome')) return { name: 'star', lib: 'Feather', color: '#FFC107' };
        if (t.includes('alert') || t.includes('warning')) return { name: 'alert-circle', lib: 'Feather', color: '#FF5252' };
        return { name: 'bell', lib: 'Feather', color: Colors.PRIMARY };
    };

    const renderItem = ({ item }) => {
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
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Notifications" 
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
}

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
        
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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