import * as Clipboard from 'expo-clipboard'; // NEW: For copying coordinates
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const getInitials = (firstName, lastName) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return '?';
};

const LocationScreen = ({
    group,
    booking,
    onStartSharingLocation,
    onStopSharingLocation,
    onStartHike,
    onPauseHike,
    onResumeHike,
    onCompleteHike,
    onEmergencyPress,
    onSendPicture,
    error,
    isLive,
    currentHike,
    location,
    onBackPress
}) => {
    const insets = useSafeAreaInsets();

    if (!group || !booking) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Group Location" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.centerContainer}>
                    <CustomText style={styles.loadingText}>Loading group data...</CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    const headerTitle = group.trail?.name || group.GroupName;
    
    // FIX: Sort hikers so "Offline/Inactive" hikers appear at the top for safety monitoring!
    const sortedMembers = useMemo(() => {
        const allMembers = [...(group.admins || []), ...(group.members || [])];
        
        return allMembers.sort((a, b) => {
            const locA = location?.find(loc => loc.id === a.id);
            const locB = location?.find(loc => loc.id === b.id);
            
            const isInactiveA = locA ? (Date.now() - new Date(locA.timestamp).getTime() > (5 * 1000)) : true;
            const isInactiveB = locB ? (Date.now() - new Date(locB.timestamp).getTime() > (5 * 1000)) : true;
            
            // Offline hikers go first
            if (isInactiveA && !isInactiveB) return -1;
            if (!isInactiveA && isInactiveB) return 1;
            return 0;
        });
    }, [group, location]);

    const copyCoordinates = async (lat, long) => {
        const coords = `${lat}, ${long}`;
        await Clipboard.setStringAsync(coords);
        alert('Coordinates copied to clipboard!');
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={headerTitle} 
                centerTitle={true} 
                onBackPress={onBackPress} 
            />

            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {error && (
                    <View style={styles.errorBanner}>
                        <CustomIcon library="Feather" name="alert-circle" size={18} color={Colors.ERROR} />
                        <CustomText style={styles.errorText}>{error}</CustomText>
                    </View>
                )}

                {/* MISSION CONTROL - Cleaned up Grid */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <CustomIcon library="Feather" name="activity" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.cardTitle}>Mission Control</CustomText>
                    </View>

                    <View style={styles.controlGrid}>
                        {currentHike?.status !== 'started' && currentHike?.status !== 'paused' && (
                            <TouchableOpacity style={styles.primaryButton} onPress={() => onStartHike(group, booking)} activeOpacity={0.8}>
                                <CustomIcon library="Feather" name="play" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.primaryButtonText}>Start Hike</CustomText>
                            </TouchableOpacity>
                        )}

                        {currentHike?.status === 'started' && (
                            <View style={styles.splitButtons}>
                                <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={onPauseHike} activeOpacity={0.8}>
                                    <CustomIcon library="Feather" name="pause" size={18} color={Colors.TEXT_PRIMARY} />
                                    <CustomText style={styles.secondaryButtonText}>Pause Hike</CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={onCompleteHike} activeOpacity={0.8}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.WHITE} />
                                    <CustomText style={styles.primaryButtonText}>Complete</CustomText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {currentHike?.status === 'paused' && (
                            <View style={styles.splitButtons}>
                                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={onResumeHike} activeOpacity={0.8}>
                                    <CustomIcon library="Feather" name="play" size={18} color={Colors.WHITE} />
                                    <CustomText style={styles.primaryButtonText}>Resume</CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.secondaryButton, { flex: 1 }]} onPress={onCompleteHike} activeOpacity={0.8}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.TEXT_PRIMARY} />
                                    <CustomText style={styles.secondaryButtonText}>Complete</CustomText>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {!isLive ? (
                            <TouchableOpacity style={styles.primaryButtonOutline} onPress={onStartSharingLocation} activeOpacity={0.8}>
                                <CustomIcon library="Feather" name="navigation" size={18} color={Colors.PRIMARY} />
                                <CustomText style={styles.primaryButtonOutlineText}>Start Sharing Location</CustomText>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.destructiveButtonOutline} onPress={onStopSharingLocation} activeOpacity={0.8}>
                                <CustomIcon library="Feather" name="navigation-2" size={18} color={Colors.ERROR} />
                                <CustomText style={styles.destructiveButtonOutlineText}>Stop Sharing Location</CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* HIKER STATUS DASHBOARD */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <CustomIcon library="Feather" name="users" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="label" style={styles.cardTitle}>Hiker Status Board</CustomText>
                    </View>

                    {sortedMembers.map((member, index) => {
                        const locData = location?.find(loc => loc.id === member.id);
                        const isInactive = locData ? (Date.now() - new Date(locData.timestamp).getTime() > (5 * 1000)) : true;
                        
                        return (
                            <View key={`${member.id}_${index}`} style={styles.memberCard}>
                                <View style={styles.memberRow}>
                                    <View style={[styles.memberAvatar, isInactive && { backgroundColor: Colors.GRAY_MEDIUM }]}>
                                        <CustomText style={styles.avatarText}>
                                            {getInitials(member.firstname, member.lastname)}
                                        </CustomText>
                                    </View>
                                    
                                    <View style={styles.memberInfo}>
                                        <CustomText style={styles.memberName}>{member.firstname} {member.lastname}</CustomText>
                                        <CustomText variant="caption" style={styles.lastUpdateText}>
                                            {locData ? `Updated: ${formatDate(locData.timestamp)}` : 'Waiting for signal...'}
                                        </CustomText>
                                    </View>

                                    <View style={[styles.statusBadge, isInactive ? styles.statusBadgeOffline : styles.statusBadgeLive]}>
                                        <View style={[styles.statusDot, isInactive ? styles.statusDotOffline : styles.statusDotLive]} />
                                        <CustomText style={isInactive ? styles.statusTextOffline : styles.statusTextLive}>
                                            {isInactive ? 'Offline' : 'Live'}
                                        </CustomText>
                                    </View>
                                </View>

                                {/* Coordinates Box with Tap to Copy */}
                                {locData && (
                                    <View style={styles.coordinatesContainer}>
                                        <View style={styles.coordinatesData}>
                                            <CustomText variant="caption" style={styles.coordText}>Lat: <CustomText style={styles.coordValue}>{locData.latitude}</CustomText></CustomText>
                                            <CustomText variant="caption" style={styles.coordText}>Long: <CustomText style={styles.coordValue}>{locData.longitude}</CustomText></CustomText>
                                            <CustomText variant="caption" style={styles.coordText}>Alt: <CustomText style={styles.coordValue}>{Math.round(locData.altitude)}m</CustomText></CustomText>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.copyButton} 
                                            onPress={() => copyCoordinates(locData.latitude, locData.longitude)}
                                        >
                                            <CustomIcon library="Feather" name="copy" size={16} color={Colors.PRIMARY} />
                                            <CustomText variant="caption" style={styles.copyText}>Copy</CustomText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.splitButtons}>
                    <TouchableOpacity style={styles.cameraButton} onPress={onSendPicture} activeOpacity={0.8}>
                        <CustomIcon library="Feather" name="camera" size={24} color={Colors.TEXT_PRIMARY} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.emergencyButton} onPress={onEmergencyPress} activeOpacity={0.8}>
                        <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.WHITE} />
                        <CustomText style={styles.emergencyButtonText}>Emergency Alert</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const dropShadow = Platform.select({
    ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.06)' }
});

const styles = StyleSheet.create({
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: Colors.TEXT_SECONDARY },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100, gap: 16 },
    
    errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.STATUS_CANCELLED_BG, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.STATUS_CANCELLED_BORDER, gap: 8 },
    errorText: { flex: 1, color: Colors.STATUS_CANCELLED_TEXT, fontSize: 13, fontWeight: '600' },

    card: { backgroundColor: Colors.WHITE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...dropShadow },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { color: Colors.TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5 },

    controlGrid: { gap: 12 },
    splitButtons: { flexDirection: 'row', gap: 12 },
    divider: { height: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, marginVertical: 4 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.PRIMARY, paddingVertical: 14, borderRadius: 12, gap: 8 },
    primaryButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 15 },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.GRAY_ULTRALIGHT, paddingVertical: 14, borderRadius: 12, gap: 8 },
    secondaryButtonText: { color: Colors.TEXT_PRIMARY, fontWeight: 'bold', fontSize: 15 },
    primaryButtonOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.WHITE, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.PRIMARY, gap: 8 },
    primaryButtonOutlineText: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 15 },
    destructiveButtonOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.WHITE, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.ERROR, gap: 8 },
    destructiveButtonOutlineText: { color: Colors.ERROR, fontWeight: 'bold', fontSize: 15 },

    memberCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT },
    memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 14 },
    memberInfo: { flex: 1, justifyContent: 'center' },
    memberName: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, marginBottom: 2 },
    lastUpdateText: { color: Colors.TEXT_SECONDARY, fontSize: 10 },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, gap: 4 },
    statusBadgeLive: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    statusBadgeOffline: { backgroundColor: Colors.GRAY_ULTRALIGHT, borderColor: Colors.GRAY_LIGHT },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusDotLive: { backgroundColor: Colors.PRIMARY },
    statusDotOffline: { backgroundColor: Colors.GRAY_MEDIUM },
    statusTextLive: { fontSize: 10, fontWeight: 'bold', color: Colors.PRIMARY },
    statusTextOffline: { fontSize: 10, fontWeight: 'bold', color: Colors.TEXT_SECONDARY },

    coordinatesContainer: { flexDirection: 'row', backgroundColor: Colors.GRAY_ULTRALIGHT, padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between', marginLeft: 52 },
    coordinatesData: { flex: 1 },
    coordText: { fontSize: 11, color: Colors.TEXT_SECONDARY, marginBottom: 2 },
    coordValue: { fontWeight: '600', color: Colors.TEXT_PRIMARY },
    copyButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.WHITE, borderRadius: 6, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    copyText: { color: Colors.PRIMARY, fontSize: 10, fontWeight: 'bold', marginTop: 2 },

    stickyBottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.WHITE, paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: Colors.GRAY_LIGHT, ...dropShadow },
    cameraButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.GRAY_ULTRALIGHT, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    emergencyButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ERROR, borderRadius: 12, gap: 8 },
    emergencyButtonText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});

export default LocationScreen;