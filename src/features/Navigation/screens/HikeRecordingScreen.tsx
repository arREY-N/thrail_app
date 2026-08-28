import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from "@/src/constants/layout";
import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { Hike } from "@/src/core/models/Hike/Hike";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useAuthStore } from '@/src/core/models/User/stores/authStore';
import { formatDate } from "@/src/core/utility/date";
import { formatTime } from "@/src/core/utility/formatTime";
import TrailMap from "@/src/features/Map/TrailMap";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    return '?';
};

interface HikeRecordingScreenProps {
    hike: Hike;
    booking: Booking | null;
    currentGroup: Group | null;
    hikerLocations: { id: string, timestamp: Date | string, latitude: number, longitude: number, altitude?: number, hikerName?: string }[];
    error: string | null;
    fullOffer?: Offer | null;

    baseElapsedTime: number;
    timerStartTime: number;
    totalDistance: number;
    totalElevationGain: number;

    isLoading: boolean;
    lon?: string | string[];
    lat?: string | string[];
    onStartHike: () => void;
    onPauseHike: () => void;
    onResumeHike: () => void;
    onCompleteHike: () => void;
    onResetHike: () => void;
    onAddReview: () => void;
    onBackPress: () => void;
    onTriggerBackendSOS?: () => void;
    onTriggerEmergencySOS?: () => void;
    onOpenSOSCamera?: () => void;
    emergencyContactNumber?: string;
    shareLocationEnabled?: boolean;
    setShareLocationEnabled?: (enabled: boolean) => Promise<void>;
}

const HikeRecordingScreen: React.FC<HikeRecordingScreenProps> = ({
    hike, booking, currentGroup, hikerLocations, error, fullOffer,
    baseElapsedTime, timerStartTime, totalDistance, totalElevationGain,
    isLoading, lon, lat,
    onStartHike, onPauseHike, onResumeHike, onCompleteHike, onAddReview, onBackPress,
    onTriggerBackendSOS, onTriggerEmergencySOS, onOpenSOSCamera, emergencyContactNumber,
    shareLocationEnabled, setShareLocationEnabled,
}) => {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<any>(null);

    const [localError, setLocalError] = useState<string | null>(error);
    useEffect(() => setLocalError(error), [error]);

    const [isOfflineMode, setIsOfflineMode] = useState(true);
    const [showSosMenu, setShowSosMenu] = useState(false);
    const [showCameraPrompt, setShowCameraPrompt] = useState(false);
    const [showTeamStatus, setShowTeamStatus] = useState(false);
    const [showTrailInfo, setShowTrailInfo] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [showOtherHikers, setShowOtherHikers] = useState(true);
    const [showMapOptions, setShowMapOptions] = useState(false);

    const [liveTime, setLiveTime] = useState(baseElapsedTime);

    const { profile } = useAuthStore();

    const isStarted = hike.status === "started";
    const isPaused = hike.status === "paused";
    const isCompleted = hike.status === "completed";
    const isTracking = isStarted || isPaused || isCompleted;

    useEffect(() => {
        if (isStarted) {
            mapRef.current?.startBackgroundTracking?.();
        } else if (isPaused || isCompleted) {
            mapRef.current?.stopBackgroundTracking?.();
        }
    }, [isStarted, isPaused, isCompleted]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isStarted && timerStartTime > 0) {
            setLiveTime(Date.now() - timerStartTime);
            interval = setInterval(() => {
                setLiveTime(Date.now() - timerStartTime);
            }, 1000);
        } else {
            setLiveTime(baseElapsedTime);
        }
        return () => clearInterval(interval);
    }, [isStarted, timerStartTime, baseElapsedTime]);

    const completeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => { completeAnim.setValue(0); }, [hike.status, completeAnim]);

    const animateProgress = (anim: Animated.Value, duration: number, toValue: number) => {
        Animated.timing(anim, { toValue, duration, useNativeDriver: false }).start();
    };

    const isGuidedHike = !!booking;

    const handleSendSMS = () => {
        const message = `EMERGENCY SOS \n\nI am having a trail emergency and require immediate assistance.\n\n📍 Coordinates: ${lat || 'Unknown'}, ${lon || 'Unknown'}`;
        Linking.openURL(`sms:${emergencyContactNumber || ""}?body=${encodeURIComponent(message)}`);
        setShowSosMenu(false);
    };

    const handleCall911 = () => {
        Linking.openURL(`tel:911`);
        setShowSosMenu(false);
    };

    const handleGroupSOS = () => {
        if (onTriggerBackendSOS) onTriggerBackendSOS();
        setShowSosMenu(false);
        setShowCameraPrompt(true);
    };

    const handleEmergencyContactSOS = () => {
        if (onTriggerEmergencySOS) onTriggerEmergencySOS();
        setShowSosMenu(false);
        setShowCameraPrompt(true);
    };

    const handleSafeBackPress = () => {
        if (isStarted || isPaused || (isCompleted && isLoading)) {
            setShowBackConfirm(true);
        } else {
            onBackPress();
        }
    };

    const handlePress = async (url: string) => {
        const supported = await Linking.canOpenURL(url);

        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
        }
    };

    const handleHikerLocationPress = (member: any, locData: any) => {
        if (!locData || !locData.latitude || !locData.longitude) return;

        Alert.alert(
            "Track Hiker",
            `Where would you like to view ${member.firstname}'s location?`,
            [
                {
                    text: "Center on Trail Map",
                    onPress: () => {
                        setShowTeamStatus(false);
                        mapRef.current?.centerOnCoordinate(locData.longitude, locData.latitude);
                    }
                },
                {
                    text: "Open in Google Maps",
                    onPress: () => {
                        const locationLink = `https://www.google.com/maps/search/?api=1&query=${locData.latitude},${locData.longitude}`;
                        handlePress(locationLink);
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const sortedMembers = useMemo(() => {
        if (!currentGroup) return [];
        const seenIds = new Set<string>();

        const allMembers = [...(currentGroup.admins || []), ...(currentGroup.members || [])].filter(member => {
            if (seenIds.has(member.id)) return false;
            seenIds.add(member.id);
            return true;
        });

        return allMembers.sort((a, b) => {
            const locA = hikerLocations?.find(loc => loc.id === a.id);
            const locB = hikerLocations?.find(loc => loc.id === b.id);
            const isInactiveA = locA ? (Date.now() - new Date(locA.timestamp).getTime() > 5000) : true;
            const isInactiveB = locB ? (Date.now() - new Date(locB.timestamp).getTime() > 5000) : true;
            if (isInactiveA && !isInactiveB) return -1;
            if (!isInactiveA && isInactiveB) return 1;
            return 0;
        });
    }, [currentGroup, hikerLocations]);

    const formatDistance = (meters: number) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(2)} km`;
    }
    const liveDistanceStr = isTracking ? formatDistance(totalDistance) : "--";
    const liveElevationStr = isTracking ? `${Math.round(totalElevationGain)} m` : "--";

    const locationMap = new Map(hikerLocations?.map(loc => [loc.id, loc])) || new Map();

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <CustomHeader title={hike.trail?.name || "Independent Route"} showDefaultIcons={false} onBackPress={onBackPress} rightActions={undefined} style={undefined} children={undefined} />
                <TrailMap initialLon={lon} initialLat={lat} bottomInset={0} />
            </View>
        );
    }

    const enrichedHikerLocations = useMemo(() => {
        if (!hikerLocations) return [];
        return hikerLocations.map(hiker => {
            if (hiker.hikerName) return hiker;
            const member = sortedMembers?.find(m => m.id === hiker.id);
            if (member) {
                return {
                    ...hiker,
                    hikerName: `${member.firstname} ${member.lastname || ''}`.trim()
                };
            }
            return hiker;
        });
    }, [hikerLocations, sortedMembers]);

    return (
        <View style={styles.container}>
            <TrailMap
                ref={mapRef}
                initialLon={lon}
                initialLat={lat}
                bottomInset={210}
                hikerLocations={showOtherHikers ? enrichedHikerLocations : []}
                currentUserId={profile?.id}
            />

            <View style={[styles.floatingHeaderContainer, { top: insets.top + 10 }]}>
                <TouchableOpacity onPress={handleSafeBackPress} style={styles.glassPillRound}>
                    <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.TEXT_PRIMARY} />
                </TouchableOpacity>

                <View style={styles.glassPillCenter}>
                    <CustomText style={styles.headerTitle} numberOfLines={1}>{hike.trail?.name || "Independent Route"}</CustomText>
                    <View style={styles.liveStatusRow}>
                        {isStarted && <CustomIcon library="Feather" name="play-circle" size={10} color={Colors.PRIMARY} />}
                        {isPaused && <CustomIcon library="Feather" name="pause-circle" size={10} color={Colors.WARNING} />}
                        {isCompleted && <CustomIcon library="Feather" name="check-circle" size={10} color={Colors.PRIMARY} />}
                        {hike.status === 'unhiked' && <View style={[styles.statusDot, { backgroundColor: Colors.GRAY_MEDIUM }]} />}
                        <CustomText style={styles.statusText}>{hike.status.toUpperCase()}</CustomText>
                    </View>
                </View>

                <TouchableOpacity style={[styles.glassPillRound, { backgroundColor: Colors.WHITE }]} onPress={() => setShowSosMenu(true)}>
                    <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.ERROR} />
                </TouchableOpacity>
            </View>

            <View style={[styles.mapControls, { bottom: 230 }]}>
                {booking && (
                    <TouchableOpacity style={styles.fabBtn} onPress={() => setShowTrailInfo(true)}>
                        <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                )}
                {isGuidedHike && currentGroup && (
                    <TouchableOpacity style={styles.fabBtn} onPress={() => router.push({ pathname: '/(main)/group/room', params: { roomId: currentGroup.id } })}>
                        <CustomIcon library="Ionicons" name="chatbubbles-outline" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                )}
                {isGuidedHike && currentGroup && (
                    <TouchableOpacity style={styles.fabBtn} onPress={() => setShowTeamStatus(true)}>
                        <CustomIcon library="Feather" name="users" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                )}
                {isGuidedHike && currentGroup && (
                    <TouchableOpacity style={styles.fabBtn} onPress={() => setShowMapOptions(true)}>
                        <CustomIcon library="Feather" name="settings" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.fabBtn} onPress={() => { setIsOfflineMode(!isOfflineMode); mapRef.current?.toggleOffline(); }}>
                    <CustomIcon library="Feather" name={isOfflineMode ? "map" : "layers"} size={20} color={isOfflineMode ? Colors.TEXT_SECONDARY : Colors.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabBtn} onPress={() => mapRef.current?.centerOnUser()}>
                    <CustomIcon library="Ionicons" name="locate" size={22} color={Colors.TEXT_PRIMARY} />
                </TouchableOpacity>
            </View>

            <View style={[styles.dashboardWrapper, { paddingBottom: insets.bottom + 16 }]}>
                {localError && (
                    <TouchableOpacity style={styles.errorBox} onPress={() => setLocalError(null)}>
                        <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.ERROR} />
                        <CustomText style={styles.errorLabel}>{localError}</CustomText>
                        <CustomIcon library="Feather" name="x" size={16} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>
                )}

                <View style={styles.metricsCard}>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                            <CustomText style={styles.metricValue}>{liveDistanceStr}</CustomText>
                            <CustomText style={styles.metricLabel}>Distance</CustomText>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <CustomText style={[styles.metricValue, { fontSize: 28, color: Colors.PRIMARY }]}>{formatTime(liveTime)}</CustomText>
                            <CustomText style={styles.metricLabel}>Duration</CustomText>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                            <CustomText style={styles.metricValue}>{liveElevationStr}</CustomText>
                            <CustomText style={styles.metricLabel}>Elevation</CustomText>
                        </View>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    {hike.status === "unhiked" && (
                        <TouchableOpacity style={styles.lightGreenBtn} onPress={onStartHike}>
                            <CustomIcon library="Feather" name="play" size={20} color={Colors.PRIMARY} />
                            <CustomText style={styles.lightGreenBtnText}>Start Recording</CustomText>
                        </TouchableOpacity>
                    )}

                    {isStarted && (
                        <TouchableOpacity style={styles.pauseBtn} onPress={onPauseHike}>
                            <CustomIcon library="Feather" name="pause" size={20} color={Colors.WHITE} />
                            <CustomText style={styles.pauseBtnText}>Pause</CustomText>
                        </TouchableOpacity>
                    )}

                    {isPaused && (
                        <>
                            <TouchableOpacity style={[styles.lightGreenBtn, { flex: 1.5 }]} onPress={onResumeHike}>
                                <CustomIcon library="Feather" name="play" size={18} color={Colors.PRIMARY} />
                                <CustomText style={styles.lightGreenBtnText}>Resume</CustomText>
                            </TouchableOpacity>

                            <AnimatedPressable
                                style={[styles.animatedFinishBtn, { flex: 1 }]}
                                onPressIn={() => animateProgress(completeAnim, 1500, 1)}
                                onPressOut={() => { completeAnim.stopAnimation(); animateProgress(completeAnim, 200, 0); }}
                                onLongPress={onCompleteHike} delayLongPress={1500}
                            >
                                <Animated.View style={[styles.progressFillFinish, { width: completeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                                <CustomIcon library="Feather" name="check-square" size={18} color={Colors.ERROR} style={styles.btnContent} />
                                <CustomText style={[styles.actionTextFinish, styles.btnContent]}>Hold to Finish</CustomText>
                            </AnimatedPressable>
                        </>
                    )}

                    {isCompleted && (
                        <TouchableOpacity
                            style={[styles.lightGreenBtn, isLoading && { opacity: 0.7 }]}
                            disabled={isLoading}
                            onPress={onAddReview}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.PRIMARY} />
                            ) : (
                                <>
                                    <CustomIcon library="Feather" name="edit-3" size={20} color={Colors.PRIMARY} />
                                    <CustomText style={styles.lightGreenBtnText}>Submit Trail Review</CustomText>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Modal visible={showSosMenu} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.actionSheet}>
                        <View style={styles.sheetHeader}>
                            <CustomIcon library="Feather" name="alert-triangle" size={32} color={Colors.ERROR} />
                            <CustomText variant="h3" style={{ marginTop: 12 }}>Emergency Protocol</CustomText>
                            <CustomText variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>
                                {isGuidedHike
                                    ? "If you have cellular data, use the App Alert. If signal is weak, use SMS or 911."
                                    : "Ensure you are in a safe location. Connect with local emergency services immediately."}
                            </CustomText>
                        </View>

                        {isGuidedHike ? (
                            <TouchableOpacity style={styles.sheetBtnPrimary} onPress={handleGroupSOS}>
                                <CustomIcon library="Feather" name="radio" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.sheetBtnTextPrimary}>Send Alert to Guide (App)</CustomText>
                            </TouchableOpacity>
                        ) : (
                            !isGuidedHike && profile?.emergencyContact?.userId ? (
                                <TouchableOpacity style={styles.sheetBtnPrimary} onPress={handleEmergencyContactSOS}>
                                    <CustomIcon library="Feather" name="phone-call" size={18} color={Colors.WHITE} />
                                    <CustomText style={styles.sheetBtnTextPrimary}>Send Alert to Emergency Contact</CustomText>
                                </TouchableOpacity>
                            ) : null
                        )}

                        <TouchableOpacity style={styles.sheetBtnOutline} onPress={handleSendSMS}>
                            <CustomIcon library="Feather" name="message-square" size={18} color={Colors.TEXT_PRIMARY} />
                            <CustomText style={styles.sheetBtnTextDark}>Send Emergency SMS</CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sheetBtnOutlineDanger} onPress={handleCall911}>
                            <CustomIcon library="Feather" name="phone-call" size={18} color={Colors.ERROR} />
                            <CustomText style={styles.sheetBtnTextDanger}>Call Local Emergency (911)</CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => setShowSosMenu(false)}>
                            <CustomText style={styles.sheetCancelText}>Cancel</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={showBackConfirm}
                onClose={() => setShowBackConfirm(false)}
                onConfirm={() => { setShowBackConfirm(false); onBackPress(); }}
                title="Leave Session?"
                message="Are you sure you want to leave this screen? Your hike recording will safely continue tracking in the background."
                confirmText="Yes, Leave"
                cancelText="Cancel"
                isDestructive={false}
                iconName="shield" children={undefined} />

            <Modal visible={showTrailInfo} transparent animationType="slide">
                <View style={styles.modalOverlayBottom}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeaderRow}>
                            <CustomText variant="h3">Hike Information</CustomText>
                            <TouchableOpacity onPress={() => setShowTrailInfo(false)} style={styles.closeBtn}>
                                <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                            {isGuidedHike ? (
                                <>
                                    <View style={styles.infoSection}>
                                        <CustomText style={styles.infoTitle}>Trail Guidelines</CustomText>
                                        <CustomText style={styles.infoText}>Stay on the marked path. Keep in contact with your group and follow your guide's instructions at all times to ensure safety.</CustomText>
                                    </View>

                                    {(fullOffer?.schedule && fullOffer.schedule.length > 0) && (
                                        <View style={styles.infoSection}>
                                            <CustomText style={styles.infoTitle}>Itinerary</CustomText>
                                            {fullOffer.schedule.map((day: { day: number; activities: { time: string | Date; event: string }[] }, idx: number) => (
                                                <View key={idx} style={{ marginBottom: 12 }}>
                                                    <CustomText style={styles.infoSubTitle}>Day {day.day}</CustomText>
                                                    {day.activities.map((act: { time: string | Date; event: string }, i: number) => (
                                                        <View key={i} style={styles.activityRow}>
                                                            <CustomText style={styles.activityTime}>{formatTime(act.time as any)}</CustomText>
                                                            <CustomText style={styles.activityEvent}>{act.event}</CustomText>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {(fullOffer?.thingsToBring && fullOffer.thingsToBring.length > 0) && (
                                        <View style={styles.infoSection}>
                                            <CustomText style={styles.infoTitle}>Things to Bring</CustomText>
                                            {fullOffer.thingsToBring.map((item: string, idx: number) => (
                                                <CustomText key={idx} style={styles.infoText}>• {item}</CustomText>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.infoSection}>
                                    <CustomText style={styles.infoTitle}>DIY Trail Guidelines</CustomText>
                                    <CustomText style={styles.infoText}>You are hiking independently. Please ensure you stay on the path, carry sufficient water, and be aware of the weather conditions. If an emergency occurs, use the SOS button to contact local authorities.</CustomText>
                                </View>
                            )}
                        </ScrollView>

                        <TouchableOpacity style={[styles.sheetBtnPrimary, { marginTop: 16 }]} onPress={() => setShowTrailInfo(false)}>
                            <CustomText style={styles.sheetBtnTextPrimary}>Understood</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={showCameraPrompt}
                onClose={() => setShowCameraPrompt(false)}
                onConfirm={() => { setShowCameraPrompt(false); onOpenSOSCamera?.(); }}
                title="Alert Sent Successfully"
                message="Please take a quick photo of the emergency to help your guide assess the situation."
                confirmText="Open Camera"
                cancelText="Skip"
                iconName="camera" children={undefined} />

            <Modal visible={showMapOptions} transparent animationType="slide">
                <View style={styles.modalOverlayBottom}>
                    <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24 }]}>
                        <View style={styles.sheetHeaderRow}>
                            <CustomText variant="h3">Map Options</CustomText>
                            <TouchableOpacity onPress={() => setShowMapOptions(false)} style={styles.closeBtn}>
                                <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.optionRow}>
                            <View style={styles.optionInfo}>
                                <CustomText style={styles.optionTitle}>Show Team on Map</CustomText>
                                <CustomText variant="caption">View other hikers in your booking on the map</CustomText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowOtherHikers(!showOtherHikers)}
                                style={[styles.toggleBtn, showOtherHikers ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                            >
                                <CustomText style={showOtherHikers ? styles.toggleTextActive : styles.toggleTextInactive}>
                                    {showOtherHikers ? "ON" : "OFF"}
                                </CustomText>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.optionRow, { marginTop: 16 }]}>
                            <View style={styles.optionInfo}>
                                <CustomText style={styles.optionTitle}>Share My Location</CustomText>
                                <CustomText variant="caption">Allow other group members to see your live position</CustomText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShareLocationEnabled?.(!shareLocationEnabled)}
                                style={[styles.toggleBtn, shareLocationEnabled ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                            >
                                <CustomText style={shareLocationEnabled ? styles.toggleTextActive : styles.toggleTextInactive}>
                                    {shareLocationEnabled ? "ON" : "OFF"}
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showTeamStatus} transparent animationType="slide">
                <View style={styles.modalOverlayBottom}>
                    <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24 }]}>
                        <View style={styles.sheetHeaderRow}>
                            <CustomText variant="h3">Hiker Status Board</CustomText>
                            <TouchableOpacity onPress={() => setShowTeamStatus(false)} style={styles.closeBtn}>
                                <CustomIcon library="Feather" name="x" size={24} color={Colors.TEXT_PRIMARY} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                            {sortedMembers.map((member, index) => {
                                const locData = locationMap.get(member.id);
                                const isInactive = locData ? (Date.now() - new Date(locData.timestamp).getTime() > 10000) : true;
                                const locationLink = `https://www.google.com/maps/search/?api=1&query=${locData?.latitude},${locData?.longitude}`;

                                return (
                                    <View key={index} style={styles.memberCard}>
                                        <View style={[styles.memberAvatar, isInactive && { backgroundColor: Colors.GRAY_MEDIUM }]}>
                                            <CustomText style={styles.avatarText}>{getInitials(member.firstname, member.lastname)}</CustomText>
                                        </View>
                                        <View style={styles.memberInfo}>
                                            <CustomText style={styles.memberName}>{member.firstname} {member.lastname}</CustomText>
                                            <CustomText variant="caption">{locData ? `Updated: ${formatDate(locData.timestamp as any)}` : 'Waiting for signal...'}</CustomText>
                                            {locData && (
                                                <TouchableOpacity
                                                    style={styles.trackHikerBtn}
                                                    onPress={() => handleHikerLocationPress(member, locData)}
                                                >
                                                    <CustomIcon library="Feather" name="map-pin" size={11} color={Colors.PRIMARY} />
                                                    <CustomText style={styles.trackHikerBtnText}>Track Hiker</CustomText>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View style={[styles.statusBadge, isInactive ? styles.badgeOffline : styles.badgeLive]}>
                                            <View style={[styles.statusDot, isInactive ? { backgroundColor: Colors.TEXT_SECONDARY } : { backgroundColor: Colors.PRIMARY }]} />
                                            <CustomText style={isInactive ? styles.textOffline : styles.textLive}>{isInactive ? 'Offline' : 'Live'}</CustomText>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.BACKGROUND },

    floatingHeaderContainer: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 50 },
    glassPillRound: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    glassPillCenter: { flexShrink: 1, minHeight: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },

    headerTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    liveStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusText: { fontSize: 10, fontWeight: '800', color: Colors.TEXT_SECONDARY },
    statusDot: { width: 6, height: 6, borderRadius: 3 },

    mapControls: { position: 'absolute', right: 16, gap: 12, zIndex: 30 },
    fabBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.WHITE, alignItems: 'center', justifyContent: 'center', ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },

    dashboardWrapper: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, zIndex: 40, alignItems: 'center' },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.WHITE, padding: 12, borderRadius: 12, marginBottom: 12, gap: 8, width: '100%', maxWidth: Layout.MAX_WIDTH, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    errorLabel: { color: Colors.ERROR, fontWeight: "600", fontSize: 13, flex: 1 },

    metricsCard: { backgroundColor: Colors.WHITE, borderRadius: 24, paddingVertical: 20, marginBottom: 12, width: '100%', maxWidth: Layout.MAX_WIDTH, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    metricsGrid: { flexDirection: 'row', paddingHorizontal: 8, alignItems: 'center' },
    metricItem: { flex: 1, alignItems: "center" },
    metricDivider: { width: 1, height: '80%', backgroundColor: Colors.GRAY_LIGHT },
    metricValue: { fontSize: 18, fontWeight: "900", color: Colors.TEXT_PRIMARY, letterSpacing: -0.5 },
    metricLabel: { color: Colors.TEXT_SECONDARY, fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginTop: 4 },

    actionRow: { flexDirection: "row", gap: 12, width: '100%', maxWidth: Layout.MAX_WIDTH },

    lightGreenBtn: { flex: 1, backgroundColor: Colors.STATUS_APPROVED_BG, height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    lightGreenBtnText: { color: Colors.PRIMARY, fontWeight: "bold", fontSize: 16 },

    pauseBtn: { flex: 1, backgroundColor: Colors.YELLOW, height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    pauseBtnText: { color: Colors.WHITE, fontWeight: "bold", fontSize: 16 },

    animatedFinishBtn: { height: 56, borderRadius: 16, backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.ERROR, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, overflow: 'hidden', ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    progressFillFinish: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: Colors.ERROR_BG },
    btnContent: { zIndex: 2 },
    actionTextFinish: { color: Colors.ERROR, fontWeight: "bold", fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
    actionSheet: { backgroundColor: Colors.WHITE, borderRadius: 24, padding: 24, alignItems: "center" },
    sheetHeader: { alignItems: 'center', marginBottom: 24 },
    sheetBtnPrimary: { backgroundColor: Colors.PRIMARY, width: "100%", paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
    sheetBtnOutline: { backgroundColor: Colors.WHITE, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, width: "100%", paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
    sheetBtnOutlineDanger: { backgroundColor: Colors.ERROR_BG, borderWidth: 1, borderColor: Colors.ERROR, width: "100%", paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 },
    sheetBtnTextPrimary: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 15 },
    sheetBtnTextDark: { color: Colors.TEXT_PRIMARY, fontWeight: 'bold', fontSize: 15 },
    sheetBtnTextDanger: { color: Colors.ERROR, fontWeight: 'bold', fontSize: 15 },
    sheetCancelBtn: { marginTop: 8, paddingVertical: 12 },
    sheetCancelText: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold', fontSize: 15 },

    modalOverlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    bottomSheet: { backgroundColor: Colors.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    closeBtn: { padding: 4, backgroundColor: Colors.GRAY_ULTRALIGHT, borderRadius: 16 },
    memberCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 14 },
    memberInfo: { flex: 1 },
    memberName: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, gap: 4 },
    badgeLive: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
    badgeOffline: { backgroundColor: Colors.GRAY_ULTRALIGHT, borderColor: Colors.GRAY_LIGHT },
    textLive: { fontSize: 10, fontWeight: 'bold', color: Colors.PRIMARY },
    textOffline: { fontSize: 10, fontWeight: 'bold', color: Colors.TEXT_SECONDARY },

    infoSection: { marginBottom: 20 },
    infoTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.TEXT_PRIMARY, marginBottom: 8 },
    infoSubTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.TEXT_SECONDARY, marginBottom: 6 },
    infoText: { fontSize: 14, color: Colors.TEXT_SECONDARY, lineHeight: 22 },
    activityRow: { flexDirection: 'row', marginBottom: 4 },
    activityTime: { width: 70, fontSize: 13, fontWeight: 'bold', color: Colors.PRIMARY },
    activityEvent: { flex: 1, fontSize: 13, color: Colors.TEXT_SECONDARY },

    optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    optionInfo: { flex: 1, paddingRight: 16 },
    optionTitle: { fontWeight: 'bold', fontSize: 16, color: Colors.TEXT_PRIMARY },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, minWidth: 60, alignItems: 'center' },
    toggleBtnActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
    toggleBtnInactive: { backgroundColor: Colors.WHITE, borderColor: Colors.GRAY_LIGHT },
    toggleTextActive: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 12 },
    toggleTextInactive: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold', fontSize: 12 },

    trackHikerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignSelf: 'flex-start',
    },
    trackHikerBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default HikeRecordingScreen;