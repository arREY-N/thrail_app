import React from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    View
} from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';

const NotificationScreen = ({ notifications, onBackPress, onPressItem }) => {

    const renderItem = ({ item }) => (
        <Pressable 
            onPress={() => onPressItem(item.id)}
            style={[
                styles.itemContainer,
                !item.isRead && styles.unreadItem
            ]}
        >
            <View style={styles.iconPlaceholder} />

            <View style={styles.textContainer}>
                <CustomText variant="subtitle" style={styles.title}>
                    {item.title}
                </CustomText>
                
                <CustomText variant="body" style={styles.message} numberOfLines={3}>
                    {item.message}
                </CustomText>
                
                <CustomText variant="caption" style={styles.time}>
                    {item.time}
                </CustomText>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Notification" 
                onBackPress={onBackPress}
            />

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    listContent: {
        paddingBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'flex-start',
    },
    unreadItem: {
        backgroundColor: Colors.SECONDARY, 
    },
    iconPlaceholder: {
        width: 50,
        height: 50,
        backgroundColor: Colors.GRAY_MEDIUM, 
        borderRadius: 8,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 16,
        marginBottom: 0, 
    },
    message: {
        fontSize: 14,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 20,
    },
    time: {
        marginTop: 4,
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY,
    }
});

export default NotificationScreen;