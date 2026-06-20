/**
 * @file NotificationSettingsScreen.tsx
 * @description View for managing user notification preferences.
 */
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

/**
 * Props for the NotificationSettingsScreen component
 * @param onBackPress - Callback to navigate back
 * @param masterPush - Master toggle state for push notifications
 * @param weatherCyclone - Toggle state for cyclone and weather alerts
 * @param trailHazards - Toggle state for hazard reports on trails
 * @param bookingStatus - Toggle state for booking status approvals/expiries
 * @param rescheduleCancel - Toggle state for booking rescheduling or cancellation notices
 * @param payments - Toggle state for transactional downpayment/final receipt alerts
 * @param groupChats - Toggle state for messages in hiking group chats
 * @param mountainPackages - Toggle state for new peak packages uploads
 * @param onToggleMasterPush - Handler to update master push toggle state
 * @param onToggleWeatherCyclone - Handler to update weather alerts toggle state
 * @param onToggleTrailHazards - Handler to update trail hazards toggle state
 * @param onToggleBookingStatus - Handler to update booking status toggle state
 * @param onToggleRescheduleCancel - Handler to update reschedule toggle state
 * @param onTogglePayments - Handler to update payment notifications toggle state
 * @param onToggleGroupChats - Handler to update group chats toggle state
 * @param onToggleMountainPackages - Handler to update mountain packages toggle state
 */
export interface NotificationSettingsScreenProps {
    onBackPress: () => void;
    masterPush: boolean;
    weatherCyclone: boolean;
    trailHazards: boolean;
    bookingStatus: boolean;
    rescheduleCancel: boolean;
    payments: boolean;
    groupChats: boolean;
    mountainPackages: boolean;
    onToggleMasterPush: (value: boolean) => void;
    onToggleWeatherCyclone: (value: boolean) => void;
    onToggleTrailHazards: (value: boolean) => void;
    onToggleBookingStatus: (value: boolean) => void;
    onToggleRescheduleCancel: (value: boolean) => void;
    onTogglePayments: (value: boolean) => void;
    onToggleGroupChats: (value: boolean) => void;
    onToggleMountainPackages: (value: boolean) => void;
}

/**
 * NotificationSettingsScreen allows users to manage their communication preferences.
 */
const NotificationSettingsScreen = ({
    onBackPress,
    masterPush,
    weatherCyclone,
    trailHazards,
    bookingStatus,
    rescheduleCancel,
    payments,
    groupChats,
    mountainPackages,
    onToggleMasterPush,
    onToggleWeatherCyclone,
    onToggleTrailHazards,
    onToggleBookingStatus,
    onToggleRescheduleCancel,
    onTogglePayments,
    onToggleGroupChats,
    onToggleMountainPackages,
}: NotificationSettingsScreenProps) => {
    const { isMobile } = useBreakpoints();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Notifications" centerTitle onBackPress={onBackPress} />
            <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]}>
                
                {/* Master Push Notification Toggle */}
                <View style={styles.row}>
                    <View style={styles.iconWrapper}>
                        <CustomIcon library="Feather" name="bell" size={20} color={Colors.PRIMARY} />
                    </View>
                    <View style={styles.textBlock}>
                        <CustomText variant="body" style={styles.rowTitle}>Allow Push Notifications</CustomText>
                        <CustomText variant="caption" style={styles.rowDesc}>Enable or disable all app notifications on this device.</CustomText>
                    </View>
                    <Switch 
                        value={masterPush} 
                        onValueChange={onToggleMasterPush} 
                        trackColor={{ true: Colors.PRIMARY }} 
                    />
                </View>

                {/* Safety & Alerts Section */}
                <View style={[styles.section, !masterPush && styles.disabledSection]}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Safety & Weather Alerts</CustomText>
                    
                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="cloud-lightning" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Weather & Cyclone Warnings</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Get alerts when your booked trails or CALABARZON mountains are under tropical cyclone warnings.</CustomText>
                        </View>
                        <Switch 
                            value={weatherCyclone} 
                            onValueChange={onToggleWeatherCyclone} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Trail Hazards</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Immediate notifications when hikers report active trail blockages or hazards in your area.</CustomText>
                        </View>
                        <Switch 
                            value={trailHazards} 
                            onValueChange={onToggleTrailHazards} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>
                </View>

                {/* Hike & Booking Activity */}
                <View style={[styles.section, !masterPush && styles.disabledSection]}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Hike & Booking Activity</CustomText>
                    
                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="calendar" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Booking Status</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Receive updates on booking approvals, rejections, downpayment requests, or expirations.</CustomText>
                        </View>
                        <Switch 
                            value={bookingStatus} 
                            onValueChange={onToggleBookingStatus} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="clock" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Rescheduling & Cancellations</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Get immediately notified if a hike is rescheduled or canceled, with detailed reasons from the guide or weather conditions.</CustomText>
                        </View>
                        <Switch 
                            value={rescheduleCancel} 
                            onValueChange={onToggleRescheduleCancel} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="credit-card" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Payment Notifications</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Transactional confirmations of downpayment logs, receipts, and refund statuses.</CustomText>
                        </View>
                        <Switch 
                            value={payments} 
                            onValueChange={onTogglePayments} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="message-square" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>Hike Coordination Chats</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Notifications when guides or group members post updates in active group chats.</CustomText>
                        </View>
                        <Switch 
                            value={groupChats} 
                            onValueChange={onToggleGroupChats} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>
                </View>

                {/* Mountain Packages */}
                <View style={[styles.section, !masterPush && styles.disabledSection]}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Mountain Packages</CustomText>
                    
                    <View style={styles.row}>
                        <View style={styles.iconWrapper}>
                            <CustomIcon library="Feather" name="map" size={20} color={Colors.PRIMARY} />
                        </View>
                        <View style={styles.textBlock}>
                            <CustomText variant="body" style={[styles.rowTitle, !masterPush && styles.disabledText]}>New Mountain Packages</CustomText>
                            <CustomText variant="caption" style={styles.rowDesc}>Hear about new custom travel and hiking packages launched for CALABARZON mountains.</CustomText>
                        </View>
                        <Switch 
                            value={mountainPackages} 
                            onValueChange={onToggleMountainPackages} 
                            disabled={!masterPush}
                            trackColor={{ true: Colors.PRIMARY }} 
                        />
                    </View>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 48,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.GRAY_MEDIUM,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
        ...GlobalStyles.dropShadow(2),
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        flex: 1,
    },
    rowTitle: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 4,
    },
    rowDesc: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 18,
    },
    disabledSection: {
        opacity: 0.6,
    },
    disabledText: {
        color: Colors.GRAY_MEDIUM,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    }
});

export default NotificationSettingsScreen;
