import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Keyboard, Platform, Pressable, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ConfirmationModal from "@/src/components/ConfirmationModal";
import CustomHeader from "@/src/components/CustomHeader";
import CustomIcon from "@/src/components/CustomIcon";
import CustomSearchBar from "@/src/components/CustomSearchBar";
import CustomText from "@/src/components/CustomText";

import { Colors } from "@/src/constants/colors";
import { Layout } from "@/src/constants/layout";
import { Trail } from "@/src/core/models/Trail/Trail";
import TrailMap from "@/src/features/Map/TrailMap";
import { useBreakpoints } from "@/src/hooks/useBreakpoints";

interface NavigationScreenProps {
    bookingContext: any | null; 
    isFutureBooking: boolean;
    formattedDate: string;
    searchQuery: string;
    filteredTrails: Trail[];
    selectedTrail: Trail | null;
    isLoading: boolean;
    onSearchChange: (text: string) => void;
    onSearchSubmit: () => void;
    onTrailSelect: (trail: Trail) => void;
    onGroupChatPress: () => void;
    onBookedGroupChatPress: () => void;
    onBookingPress: () => void;
    onStartTracking: () => void;
    onDeveloperBypass?: () => void;
}

const getElevation = (trail: any) => {
    const elev = trail?.difficulty?.elevation || trail?.geography?.masl || trail?.masl;
    return elev && elev > 0 ? elev : '--';
};

const getLocation = (trail: any) => {
    const prov = trail?.general?.province;
    if (Array.isArray(prov) && prov.length > 0) return prov.join(', ');
    if (typeof prov === 'string') return prov;
    return trail?.general?.address || 'Unknown';
};

const getDisplayData = (item: any) => {
    const dist = item?.difficulty?.length ? `${item.difficulty.length} km` : "--";
    const elev = getElevation(item);
    const route = item?.difficulty?.circularity === "Out and Back" ? "Out & Back" : item?.difficulty?.circularity || "--";
    return { dist, elev: `${elev} masl`, route };
};

const NavigationScreen: React.FC<NavigationScreenProps> = ({
    bookingContext,
    isFutureBooking,
    formattedDate,
    searchQuery,
    filteredTrails = [],
    selectedTrail,
    isLoading,
    onSearchChange,
    onSearchSubmit,
    onTrailSelect,
    onGroupChatPress,
    onBookedGroupChatPress,
    onBookingPress,
    onStartTracking,
    onDeveloperBypass
}) => {
    const insets = useSafeAreaInsets();
    const searchTopPadding = Platform.OS === 'ios' ? insets.top : insets.top + 10;
    
    const { isDesktop, isTablet } = useBreakpoints();
    const isLargeScreen = isDesktop || isTablet;

    const mapRef = useRef<any>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(true);
    const [isDevBypassModalVisible, setDevBypassModalVisible] = useState(false);
    const prevTrailRef = useRef<Trail | null>(null);

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
            `Your guided hike is scheduled for ${formattedDate}. You can start tracking once the date arrives.`,
            [{ text: "Understood" }]
        );
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <CustomHeader title="Hike" showDefaultIcons={true} onBackPress={undefined} rightActions={undefined} style={undefined} children={undefined} />
                <TrailMap ref={mapRef} bottomInset={0} />
            </View>
        );
    }

    const showDropdown = filteredTrails.length > 0 && selectedTrail?.general?.name !== searchQuery;

    const responsiveStyle = isLargeScreen ? {
        width: '100%' as const,
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center' as const,
    } : { width: '100%' as const };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <TrailMap 
                    ref={mapRef}
                    initialLon={selectedTrail?.geography?.startLong} 
                    initialLat={selectedTrail?.geography?.startLat}
                    bottomInset={275}
                />

                <View style={[styles.floatingSearchWrapper, { top: searchTopPadding }, responsiveStyle]}>
                    <CustomSearchBar
                        searchPlaceholder="Search mountains or trails..."
                        searchValue={searchQuery}
                        onSearchChange={onSearchChange}
                        rightIconLibrary="FontAwesome5"
                        rightIconName="location-arrow"
                        onRightButtonPress={onSearchSubmit} activeTab={undefined} onTabSelect={undefined}                    />

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

                <TouchableOpacity style={[styles.floatingIconBtn, { bottom: 460 }]} onPress={onBookingPress} activeOpacity={0.8}>
                    <CustomIcon library="Ionicons" name="calendar-clear-outline" size={20} color={Colors.PRIMARY} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.floatingIconBtn, { bottom: 400 }]} onPress={onGroupChatPress} activeOpacity={0.8}>
                    <CustomIcon library="Ionicons" name="chatbubbles-outline" size={20} color={Colors.PRIMARY} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.floatingIconBtn, { bottom: 340 }]} onPress={handleToggleOffline} activeOpacity={0.8}>
                    <CustomIcon library="Feather" name={isOfflineMode ? "map" : "layers"} size={20} color={isOfflineMode ? Colors.TEXT_SECONDARY : Colors.PRIMARY} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.floatingIconBtn, { bottom: 280 }]} onPress={() => mapRef.current?.centerOnUser()} activeOpacity={0.8}>
                    <CustomIcon library="Ionicons" name="locate" size={22} color={Colors.TEXT_PRIMARY} />
                </TouchableOpacity>

                <View style={[styles.floatingControlsContainer, responsiveStyle]}>
                    {isLoading ? (
                        <View style={styles.loaderCard}>
                            <ActivityIndicator size="small" color={Colors.PRIMARY} />
                        </View>
                    ) : selectedTrail ? (
                        <View style={styles.controlCard}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.headerTitleGroup}>
                                    <CustomIcon library="Feather" name="map-pin" size={16} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.lobbyContextLabel}>Free Roam (DIY)</CustomText>
                                </View>
                            </View>
                            <CustomText variant="h3" style={styles.trailTitle}>Selected: {selectedTrail.general?.name}</CustomText>
                            <CustomText variant="caption" style={styles.trailSubtext}>You're all set! Tap below to load the trail map and start recording your adventure.</CustomText>
                            <TouchableOpacity style={styles.activeLaunchButton} onPress={onStartTracking}>
                                <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.activeLaunchText}>Start Selected Hike</CustomText>
                            </TouchableOpacity>
                        </View>
                    ) : bookingContext ? (
                        <View style={styles.controlCard}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.headerTitleGroup}>
                                    <CustomIcon library="Feather" name="compass" size={16} color={Colors.PRIMARY} />
                                    <CustomText variant="label" style={styles.lobbyContextLabel}>Guided Hike</CustomText>
                                </View>
                                <TouchableOpacity style={styles.chatShortcutBtn} onPress={onBookedGroupChatPress}>
                                    <CustomIcon library="Ionicons" name="chatbubble-outline" size={16} color={Colors.PRIMARY} />
                                    <CustomText style={styles.chatShortcutText}>Group Chat</CustomText>
                                </TouchableOpacity>
                            </View>
                            <CustomText variant="h3" style={styles.trailTitle}>{bookingContext.trail?.name}</CustomText>
                            <CustomText variant="caption" style={styles.trailSubtext}>Your reservation is secure. Use the group chat to coordinate logistics with your guide.</CustomText>

                            {isFutureBooking ? (
                                <Pressable 
                                    style={({ pressed }) => [styles.disabledLaunchButton, pressed && { opacity: 0.8 }]} 
                                    onPress={handleDisabledPress}
                                    onLongPress={() => { if (onDeveloperBypass) setDevBypassModalVisible(true); }}
                                    delayLongPress={2000}
                                >
                                    <CustomIcon library="Feather" name="lock" size={16} color={Colors.TEXT_SECONDARY} />
                                    <CustomText style={styles.disabledLaunchText}>Starts on {formattedDate}</CustomText>
                                </Pressable>
                            ) : (
                                <TouchableOpacity style={styles.activeLaunchButton} onPress={onStartTracking}>
                                    <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                    <CustomText style={styles.activeLaunchText}>Start Live Session</CustomText>
                                </TouchableOpacity>
                            )}

                            <ConfirmationModal
                                        visible={isDevBypassModalVisible}
                                        onClose={() => setDevBypassModalVisible(false)}
                                        onConfirm={() => { setDevBypassModalVisible(false); onDeveloperBypass?.(); } }
                                        title="Admin Override"
                                        message="Do you want to bypass the date lock and start the live hike now for testing?"
                                        confirmText="Bypass & Start"
                                        isDestructive={false}
                                        iconName="unlock" children={undefined}                            />
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
                            <TouchableOpacity style={styles.activeLaunchButton} onPress={onStartTracking}>
                                <CustomIcon library="Feather" name="navigation" size={18} color={Colors.WHITE} />
                                <CustomText style={styles.activeLaunchText}>Start Live Session</CustomText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

const dropShadow = Platform.select({
    ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 },
    android: { elevation: 6 },
    web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)' } as any,
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.BACKGROUND },

    floatingSearchWrapper: { position: "absolute", zIndex: 50 }, 
    floatingControlsContainer: { position: "absolute", bottom: 24, zIndex: 40, paddingHorizontal: 16 },

    floatingIconBtn: { position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.WHITE, alignItems: "center", justifyContent: "center", zIndex: 45, ...dropShadow },

    dropdownContainer: { marginHorizontal: 16, marginTop: 4, backgroundColor: Colors.WHITE, borderRadius: 16, maxHeight: 220, overflow: "hidden", ...dropShadow },
    dropdownList: { paddingVertical: 4 },
    dropdownItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT, gap: 12 },
    dropdownIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.BACKGROUND, alignItems: 'center', justifyContent: 'center' },
    dropdownHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    dropdownItemText: { fontSize: 15, fontWeight: "bold", color: Colors.TEXT_PRIMARY, flexShrink: 1 },
    dropdownLocation: { color: Colors.PRIMARY, fontWeight: "600", fontSize: 12, marginLeft: 8, flexShrink: 0 },
    dropdownSubText: { color: Colors.TEXT_SECONDARY, marginTop: 2 },

    loaderCard: { backgroundColor: Colors.WHITE, padding: 32, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT },
    controlCard: { backgroundColor: Colors.WHITE, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...dropShadow },
    
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    headerTitleGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
    lobbyContextLabel: { fontSize: 13, fontWeight: "bold", color: Colors.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.5 },
    chatShortcutBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    chatShortcutText: { fontSize: 13, fontWeight: "700", color: Colors.PRIMARY },
    trailTitle: { fontSize: 22, fontWeight: "bold", color: Colors.TEXT_PRIMARY, marginBottom: 6 },
    trailSubtext: { color: Colors.TEXT_SECONDARY, lineHeight: 18, fontSize: 14, marginBottom: 24 },
    activeLaunchButton: { flexDirection: "row", backgroundColor: Colors.PRIMARY, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 },
    activeLaunchText: { color: Colors.WHITE, fontWeight: "bold", fontSize: 16 },
    disabledLaunchButton: { flexDirection: "row", backgroundColor: Colors.GRAY_ULTRALIGHT, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    disabledLaunchText: { color: Colors.TEXT_SECONDARY, fontWeight: "700", fontSize: 16 },
});

export default NavigationScreen;