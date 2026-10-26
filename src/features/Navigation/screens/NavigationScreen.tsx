import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomFAB from "@/src/components/CustomFAB";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomSearchBar from "@/src/components/CustomSearchBar";
import CustomText from "@/src/components/CustomText";

import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from "@/src/constants/layout";
import { Trail } from "@/src/core/models/Trail/Trail";
import TrailMap, { TrailMapRef } from "@/src/features/Map/TrailMap";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";
import { formatDateToStandard } from "@/src/utils/dateFormatter";

import { Booking } from "@/src/core/models/Booking/Booking";
import { Group } from "@/src/core/models/Group/Group";
import { useHikeStore } from "@/src/core/models/Hike/Hike";
import { formatTime } from "@/src/core/utility/formatTime";
import UpcomingHikesModal from "@/src/features/Navigation/components/UpcomingHikesModal";

interface NavigationScreenProps {
    upcomingBookings: Booking[]; 
    groups: Group[];
    currentUserId?: string;
    
    searchQuery: string;
    filteredTrails: Trail[];
    selectedTrail: Trail | null;
    isLoading: boolean;
    
    onSearchChange: (text: string) => void;
    onSearchSubmit: () => void;
    onTrailSelect: (trail: Trail) => void;
    onGroupPress: () => void;
    onBookingPress: () => void;
    onStartTracking: (bookingContext?: Booking | null) => void;
    onDeveloperBypass?: (bookingContext: Booking | null) => void;
}

const getElevation = (trail: Trail) => {
    const elev = trail?.difficulty?.elevation || trail?.geography?.masl;
    return elev && elev > 0 ? elev : '--';
};

const getLocation = (trail: Trail) => {
    const prov = trail?.general?.province;
    if (Array.isArray(prov) && prov.length > 0) return prov.join(', ');
    if (typeof prov === 'string') return prov;
    return trail?.general?.address || 'Unknown';
};

const getDisplayData = (item: Trail) => {
    const dist = item?.difficulty?.length ? `${item.difficulty.length} km` : "--";
    const elev = getElevation(item);
    const route = item?.difficulty?.circularity === "Out-and-Back" ? "Out & Back" : item?.difficulty?.circularity || "--";
    return { dist, elev: `${elev} masl`, route };
};

const NavigationScreen: React.FC<NavigationScreenProps> = ({
    upcomingBookings, groups, currentUserId,
    searchQuery, filteredTrails, selectedTrail, isLoading,
    onSearchChange, onSearchSubmit, onTrailSelect,
    onBookingPress, onStartTracking, onDeveloperBypass, onGroupPress
}) => {
    const insets = useSafeAreaInsets();
    const searchTopPadding = Platform.OS === 'ios' ? insets.top : insets.top + 10;
    
    const { isDesktop, isTablet } = useBreakpoints();
    const isLargeScreen = isDesktop || isTablet;

    const mapRef = useRef<TrailMapRef | null>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(true);
    const [isDevBypassModalVisible, setDevBypassModalVisible] = useState(false);
    const [isUpcomingModalVisible, setUpcomingModalVisible] = useState(false);
    const [activeBooking, setActiveBooking] = useState<Booking | null>(upcomingBookings[0] || null);
    const [controlsHeight, setControlsHeight] = useState(250);

    const activeHikeSession = useHikeStore((s) => (s.active && s.currentHike && (s.currentHike.status === 'started' || s.currentHike.status === 'paused') ? s.currentHike : null));
    const activeHikeElapsed = useHikeStore((s) => s.elapsedTime);
    const activeHikeDistance = useHikeStore((s) => s.totalDistance);

    const prevTrailRef = useRef<Trail | null>(null);
    const [prevUpcomingLength, setPrevUpcomingLength] = useState(upcomingBookings.length);
    if (upcomingBookings.length !== prevUpcomingLength) {
        setPrevUpcomingLength(upcomingBookings.length);
        if (upcomingBookings.length > 0 && !activeBooking) {
            setActiveBooking(upcomingBookings[0]);
        }
    }

    useEffect(() => {
        if (prevTrailRef.current !== null && selectedTrail === null) {
            setTimeout(() => {
                mapRef.current?.centerOnUser();
            }, 150);
        }
        prevTrailRef.current = selectedTrail;
    }, [selectedTrail]);

    const handleToggleOffline = () => {
        setIsOfflineMode(!isOfflineMode);
        mapRef.current?.toggleOffline();
    };

    const handleDisabledPress = () => {
        Alert.alert(
            "Booking Scheduled",
            `Your guided hike is scheduled for ${formatDateToStandard(activeBooking?.offer?.date)}. You can start tracking once the date arrives.`,
            [{ text: "Understood" }]
        );
    };

    const navigateToGroupChat = (booking: Booking) => {
        const targetGroup = groups?.find((g: Group) => g.members?.some((m: { id: string; bookingId?: string }) => m.id === currentUserId && m.bookingId === booking.id));
        if (targetGroup) {
            router.push({ pathname: '/(app)/(main)/group/room', params: { roomId: targetGroup.id } });
        } else {
            onGroupPress();
        }
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <CustomHeader title="Hike" showDefaultIcons={true} />
                <TrailMap ref={mapRef} bottomInset={0} />
                <CustomFAB onPress={onGroupPress} />
            </View>
        );
    }

    const showDropdown = filteredTrails.length > 0 && selectedTrail?.general?.name !== searchQuery;

    const responsiveStyle = isLargeScreen ? {
        width: '100%' as const,
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center' as const,
    } : { width: '100%' as const };

    const isToday = activeBooking ? (new Date(activeBooking.offer.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)) : false;
    const daysUntilHike = activeBooking 
        ? Math.ceil((new Date(activeBooking.offer.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
        : null;

    return (
        <View style={styles.container}>
            <TrailMap 
                ref={mapRef}
                    initialLon={selectedTrail?.geography?.startLong} 
                    initialLat={selectedTrail?.geography?.startLat}
                    bottomInset={controlsHeight + 20} 
                />

                <View style={[styles.floatingSearchWrapper, { top: searchTopPadding }, responsiveStyle]}>
                    <CustomSearchBar
                        searchPlaceholder="Search mountains or trails..."
                        searchValue={searchQuery}
                        onSearchChange={onSearchChange}
                        rightIconLibrary="FontAwesome5"
                        rightIconName="location-arrow"
                        onRightButtonPress={onSearchSubmit}
                        activeTab={undefined}
                        onTabSelect={undefined}
                    />

                    {showDropdown && (
                        <View style={styles.dropdownContainer}>
                            <FlatList
                                data={filteredTrails}
                                keyExtractor={(item) => item.id}
                                keyboardShouldPersistTaps="handled"
                                style={styles.dropdownList}
                                renderItem={({ item, index }) => {
                                    const { dist, elev, route } = getDisplayData(item);
                                    const locationName = getLocation(item);
                                    
                                    return (
                                        <TouchableOpacity 
                                            style={[styles.dropdownItem, index === filteredTrails.length - 1 && { borderBottomWidth: 0 }]} 
                                            onPress={() => onTrailSelect(item)}
                                        >
                                            <View style={styles.dropdownIconBox}>
                                                <CustomIcon library="FontAwesome6" name="mountain" size={16} color={Colors.PRIMARY} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.dropdownHeaderRow}>
                                                    <CustomText style={styles.dropdownItemText} numberOfLines={1}>{item.general?.name}</CustomText>
                                                    <CustomText variant="caption" style={styles.dropdownLocation}>{locationName}</CustomText>
                                                </View>
                                                <CustomText variant="caption" style={styles.dropdownSubText}>{dist} • {elev} • {route}</CustomText>
                                            </View>
                                            <CustomIcon library="Feather" name="arrow-up-left" size={16} color={Colors.GRAY_MEDIUM} />
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    )}
                </View>

                <View style={[styles.mapControlsColumn, { bottom: controlsHeight + 36 }]}>
                    <TouchableOpacity 
                        style={[styles.floatingIconBtn, { backgroundColor: Colors.YELLOW }]} 
                        onPress={() => {
                            // Pass a real trailId so the map loads, but pass the fake DEV_TEST booking ID
                            router.push({
                                pathname: '/(app)/(main)/hike/view',
                                params: { 
                                    hikeId: "new_diy_session",
                                }
                            });
                        }} 
                        activeOpacity={0.8}
                    >
                        <CustomIcon library="Feather" name="tool" size={20} color={Colors.WHITE} />
                    </TouchableOpacity>

                    {upcomingBookings.length > 0 && (
                        <TouchableOpacity 
                            style={styles.floatingIconBtn} 
                            onPress={() => setUpcomingModalVisible(true)} 
                            activeOpacity={0.8}
                        >
                            <CustomIcon library="Ionicons" name="ticket-outline" size={20} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.floatingIconBtn} onPress={onGroupPress} activeOpacity={0.8}>
                        <CustomIcon library="Ionicons" name="chatbubbles-outline" size={20} color={Colors.PRIMARY} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.floatingIconBtn} onPress={handleToggleOffline} activeOpacity={0.8}>
                        <CustomIcon library="Feather" name={isOfflineMode ? "map" : "layers"} size={20} color={isOfflineMode ? Colors.TEXT_SECONDARY : Colors.PRIMARY} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.floatingIconBtn} onPress={() => mapRef.current?.centerOnUser()} activeOpacity={0.8}>
                        <CustomIcon library="Ionicons" name="locate" size={22} color={Colors.TEXT_PRIMARY} />
                    </TouchableOpacity>
                </View>

                <View 
                    style={[styles.floatingControlsContainer, responsiveStyle]}
                    onLayout={(e) => {
                        const h = Math.round(e.nativeEvent.layout.height);
                        if (h > 0 && Math.abs(h - controlsHeight) > 2) {
                            setControlsHeight(h);
                        }
                    }}
                >
                    {activeHikeSession && (
                        <TouchableOpacity
                            style={styles.resumeBannerContainer}
                            activeOpacity={0.88}
                            onPress={() => {
                                router.push({
                                    pathname: '/(app)/(main)/hike/view',
                                    params: {
                                        hikeId: activeHikeSession.id,
                                        trailId: activeHikeSession.trail?.id,
                                        bookingId: activeHikeSession.bookingId || undefined,
                                    }
                                });
                            }}
                        >
                            <View style={styles.resumeBannerContent}>
                                <View style={[styles.resumeStatusDot, activeHikeSession.status === 'paused' ? styles.bgAmber : styles.bgEmerald]} />
                                <View style={{ flex: 1 }}>
                                    <View style={styles.resumeHeaderRow}>
                                        <CustomText style={styles.resumeTitle} numberOfLines={1}>
                                            {activeHikeSession.trail?.name || "Active Hike Session"}
                                        </CustomText>
                                        <View style={[styles.resumeBadge, activeHikeSession.status === 'paused' ? styles.badgeAmber : styles.badgeEmerald]}>
                                            <CustomText style={styles.resumeBadgeText}>
                                                {activeHikeSession.status === 'paused' ? 'PAUSED' : 'RECORDING'}
                                            </CustomText>
                                        </View>
                                    </View>
                                    <CustomText variant="caption" style={styles.resumeStats}>
                                        {formatTime(activeHikeElapsed)} • {activeHikeDistance >= 1000 ? `${(activeHikeDistance / 1000).toFixed(2)} km` : `${Math.round(activeHikeDistance)} m`}
                                    </CustomText>
                                </View>
                                <View style={styles.resumeCtaBox}>
                                    <CustomText style={styles.resumeCtaText}>Resume</CustomText>
                                    <CustomIcon library="Feather" name="chevron-right" size={14} color={Colors.PRIMARY} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    {isLoading ? (
                        <View style={styles.loaderCard}>
                            <ActivityIndicator size="small" color={Colors.PRIMARY} />
                        </View>
                    ) : selectedTrail ? (
                        <View style={styles.controlCard}>
                            <TouchableOpacity style={styles.clearSearchBtn} onPress={() => onSearchChange('')}>
                                <CustomIcon library="Feather" name="x" size={16} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                            
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.headerTitleGroup}>
                                    <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.lobbyContextLabel}>Free Roam (DIY)</CustomText>
                                </View>
                            </View>
                            <CustomText variant="h3" style={styles.trailTitle}>Selected: {selectedTrail.general?.name}</CustomText>
                            <CustomText variant="caption" style={styles.trailSubtext}>You&apos;re all set! Tap below to load the trail map and start recording your adventure.</CustomText>
                            <TouchableOpacity style={styles.activeLaunchButton} onPress={() => onStartTracking(null)}>
                                <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.activeLaunchText}>Start Selected Hike</CustomText>
                            </TouchableOpacity>
                        </View>
                    ) : activeBooking ? (
                        <View style={styles.controlCard}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.headerTitleGroup}>
                                    <CustomIcon library="Feather" name="compass" size={16} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.lobbyContextLabel}>Guided Hike</CustomText>
                                </View>
                                
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {isToday ? (
                                        <View style={styles.badgeToday}><CustomText style={styles.badgeTextLive}>TODAY</CustomText></View>
                                    ) : (
                                        <View style={styles.badgeUpcoming}><CustomText style={styles.badgeTextUpcoming}>In {daysUntilHike} Days</CustomText></View>
                                    )}
                                    <TouchableOpacity style={styles.chatShortcutBtn} onPress={() => navigateToGroupChat(activeBooking)}>
                                        <CustomIcon library="Ionicons" name="chatbubble-outline" size={16} color={Colors.PRIMARY} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                            <CustomText variant="h3" style={styles.trailTitle}>{activeBooking.trail?.name}</CustomText>
                            <CustomText variant="caption" style={styles.trailSubtext}>Your reservation is secure. Use the group chat to coordinate logistics with your guide.</CustomText>

                            {isToday ? (
                                <TouchableOpacity style={styles.activeLaunchButton} onPress={() => onStartTracking(activeBooking)}>
                                    <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                    <CustomText style={styles.activeLaunchText}>Start Live Session</CustomText>
                                </TouchableOpacity>
                            ) : (
                                <Pressable 
                                    style={({ pressed }) => [styles.disabledLaunchButton, pressed && { opacity: 0.8 }]} 
                                    onPress={handleDisabledPress}
                                    onLongPress={() => { if (onDeveloperBypass) setDevBypassModalVisible(true); }}
                                    delayLongPress={2000}
                                >
                                    <CustomIcon library="Feather" name="lock" size={16} color={Colors.TEXT_SECONDARY} />
                                    <CustomText style={styles.disabledLaunchText}>Starts on {formatDateToStandard(activeBooking.offer.date)}</CustomText>
                                </Pressable>
                            )}

                            <ConfirmationModal
                                visible={isDevBypassModalVisible}
                                onClose={() => setDevBypassModalVisible(false)}
                                onConfirm={() => { setDevBypassModalVisible(false); onDeveloperBypass?.(activeBooking); } }
                                title="Admin Override"
                                message="Do you want to bypass the date lock and start the live hike now for testing?"
                                confirmText="Bypass & Start"
                                isDestructive={false}
                                iconName="unlock"
                            />
                        </View>
                    ) : (
                        <View style={styles.controlCard}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.headerTitleGroup}>
                                    <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.lobbyContextLabel}>Free Roam (DIY)</CustomText>
                                </View>
                            </View>
                            <CustomText variant="h3" style={styles.trailTitle}>Ready to Explore?</CustomText>
                            <CustomText variant="caption" style={styles.trailSubtext}>Where to next? Search for a mountain above, or tap below to start a free-roam hike at your current location.</CustomText>
                            <TouchableOpacity style={styles.activeLaunchButton} onPress={() => onStartTracking(null)}>
                                <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.activeLaunchText}>Start Live Session</CustomText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <UpcomingHikesModal
                    visible={isUpcomingModalVisible}
                    onClose={() => setUpcomingModalVisible(false)}
                    bookings={upcomingBookings}
                    activeBooking={activeBooking}
                    onSelectBooking={(booking: Booking) => {
                        setActiveBooking(booking);
                        setUpcomingModalVisible(false);
                    }}
                />

            </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.BACKGROUND },
    
    floatingSearchWrapper: { position: "absolute", zIndex: 50 }, 
    floatingControlsContainer: { position: "absolute", bottom: 24, zIndex: 40, paddingHorizontal: 16 },
    mapControlsColumn: { position: 'absolute', right: 16, gap: 12, zIndex: 45 },
    floatingIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.WHITE, alignItems: "center", justifyContent: "center", ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },

    dropdownContainer: { marginHorizontal: 16, marginTop: 4, backgroundColor: Colors.WHITE, borderRadius: 16, maxHeight: 220, overflow: "hidden", ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    dropdownList: { paddingVertical: 4 },
    dropdownItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT, gap: 12 },
    dropdownIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.BACKGROUND, alignItems: 'center', justifyContent: 'center' },
    
    dropdownHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    dropdownItemText: { fontSize: 15, fontWeight: "bold", color: Colors.TEXT_PRIMARY, flexShrink: 1 },
    dropdownLocation: { color: Colors.PRIMARY, fontWeight: "600", fontSize: 12, marginLeft: 8, flexShrink: 0 },
    dropdownSubText: { color: Colors.TEXT_SECONDARY, marginTop: 2 },

    loaderCard: { backgroundColor: Colors.WHITE, padding: 32, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT },
    controlCard: { backgroundColor: Colors.WHITE, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }) },
    
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    headerTitleGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    lobbyContextLabel: { fontSize: 13, fontWeight: "bold", color: Colors.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.5 },
    
    chatShortcutBtn: { flexDirection: "row", alignItems: "center", justifyContent: 'center', width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.GRAY_ULTRALIGHT },
    
    badgeToday: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeUpcoming: { backgroundColor: Colors.GRAY_ULTRALIGHT, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeTextLive: { color: Colors.PRIMARY, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    badgeTextUpcoming: { color: Colors.TEXT_SECONDARY, fontSize: 10, fontWeight: '700' },

    clearSearchBtn: { position: 'absolute', top: 16, right: 16, padding: 8, backgroundColor: Colors.GRAY_ULTRALIGHT, borderRadius: 16, zIndex: 10 },
    trailTitle: { fontSize: 22, fontWeight: "bold", color: Colors.TEXT_PRIMARY, marginBottom: 6 },
    trailSubtext: { color: Colors.TEXT_SECONDARY, lineHeight: 18, fontSize: 14, marginBottom: 24 },
    activeLaunchButton: { flexDirection: "row", backgroundColor: Colors.PRIMARY, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 },
    activeLaunchText: { color: Colors.WHITE, fontWeight: "bold", fontSize: 16 },
    disabledLaunchButton: { flexDirection: "row", backgroundColor: Colors.GRAY_ULTRALIGHT, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    disabledLaunchText: { color: Colors.TEXT_SECONDARY, fontWeight: "700", fontSize: 16 },

    resumeBannerContainer: {
        width: '100%',
        marginBottom: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#A7F3D0',
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }),
    },
    resumeBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    resumeStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    bgEmerald: {
        backgroundColor: '#10B981',
    },
    bgAmber: {
        backgroundColor: '#F59E0B',
    },
    resumeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resumeTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
    },
    resumeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeEmerald: {
        backgroundColor: '#D1FAE5',
    },
    badgeAmber: {
        backgroundColor: '#FEF3C7',
    },
    resumeBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#065F46',
    },
    resumeStats: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    resumeCtaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 10,
        gap: 2,
    },
    resumeCtaText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
});

export default NavigationScreen;