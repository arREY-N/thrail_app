/**
 * @file HikeLiveMonitorScreen.tsx
 * @description Dedicated native mobile (Android/iOS) spectator live monitor screen.
 * Uses native elevation and a native Modal bottom sheet for the Active Hikers list
 * so it composites cleanly above the MapLibre OpenGL surface across all devices.
 */

import * as Clipboard from "expo-clipboard";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";
import { Layout } from "@/src/constants/layout";
import TrailMap, { TrailMapRef } from "@/src/features/Map/TrailMap";
import {
    formatTimeAgo,
    LKL_TICKER_INTERVAL_MS,
    useEnrichedHikerLocations,
} from "@/src/features/Navigation/hooks/useEnrichedHikerLocations";
import {
    HikeRecordingScreenProps,
    IEnrichedGroupMember,
    IHikerLocation,
} from "@/src/features/Navigation/types/HikeRecordingScreen.types";

/**
 * Props for the HikeLiveMonitorScreen component.
 *
 * @param groupId - ID of the monitored group session
 * @param hike - Optional hike model reference
 * @param currentGroup - Active group metadata including members and trail info
 * @param hikerLocations - Real-time GPS telemetry array for group members
 * @param error - Optional error message string from location or group listeners
 * @param onBackPress - Callback invoked when the back button is pressed
 * @param lon - Optional initial longitude parameter
 * @param lat - Optional initial latitude parameter
 * @param profile - Currently authenticated spectator user profile
 */
export interface HikeLiveMonitorScreenProps extends Partial<HikeRecordingScreenProps> {
    groupId?: string;
    currentGroup?: HikeRecordingScreenProps["currentGroup"];
    hikerLocations?: IHikerLocation[];
    error?: string | null;
    onBackPress?: () => void;
    lon?: string | string[];
    lat?: string | string[];
}

/**
 * Computes uppercase initials from a member's first and last name.
 *
 * @param firstName - Member's first name
 * @param lastName - Member's last name
 * @returns Two-letter or single-letter uppercase initials
 */
const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
        return firstName.charAt(0).toUpperCase();
    }
    return "?";
};

/**
 * Formats a timestamp into a human-readable HH:MM:SS time string.
 *
 * @param timestamp - Date, string, or numeric epoch timestamp
 * @returns Formatted local time string
 */
const formatRecordedTime = (timestamp?: Date | string | number): string => {
    if (!timestamp) return "--";
    const timeMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
    if (isNaN(timeMs)) return "--";
    return new Date(timeMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

/**
 * Validates whether latitude and longitude numbers are within geographic bounds.
 *
 * @param lat - Latitude in degrees
 * @param lon - Longitude in degrees
 * @returns True when both coordinates are valid finite numbers
 */
const isValidCoord = (lat?: number | null, lon?: number | null): boolean => {
    if (typeof lat !== "number" || typeof lon !== "number") return false;
    return isFinite(lat) && isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

/**
 * Dedicated native mobile spectator Live Monitor screen.
 */
const HikeLiveMonitorScreenComponent = ({
    hike,
    currentGroup = null,
    hikerLocations = [],
    error = null,
    onBackPress = () => {},
    lon,
    lat,
}: HikeLiveMonitorScreenProps): React.JSX.Element => {
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = useWindowDimensions();
    const mapRef = useRef<TrailMapRef | null>(null);

    const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
    const [selectedMember, setSelectedMember] = useState<IEnrichedGroupMember | null>(null);
    const [showRoster, setShowRoster] = useState<boolean>(false);
    const [copiedSar, setCopiedSar] = useState<boolean>(false);
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(Platform.OS !== "web");
    const [modeToast, setModeToast] = useState<string | null>(null);

    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, LKL_TICKER_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                clearTimeout(copiedTimeoutRef.current);
            }
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    const {
        sortedMembers,
        enrichedHikerLocations,
        liveCount,
        lostCount,
    } = useEnrichedHikerLocations(
        currentGroup,
        hikerLocations,
        currentTime
    );

    const [initialHikerCoord, setInitialHikerCoord] = useState<{ lon: number; lat: number } | null>(null);
    if (!initialHikerCoord && enrichedHikerLocations.length > 0) {
        const firstValid = enrichedHikerLocations.find((h) => isValidCoord(h.latitude, h.longitude));
        if (firstValid) {
            setInitialHikerCoord({
                lon: firstValid.longitude,
                lat: firstValid.latitude,
            });
        }
    }

    const effectiveInitialLon = lon ?? (initialHikerCoord ? String(initialHikerCoord.lon) : undefined);
    const effectiveInitialLat = lat ?? (initialHikerCoord ? String(initialHikerCoord.lat) : undefined);

    const liveSelectedMember = selectedMember
        ? sortedMembers.find((m) => m.id === selectedMember.id) || selectedMember
        : null;

    const hasValidSelectedMember = Boolean(
        liveSelectedMember &&
        liveSelectedMember.locData &&
        isValidCoord(liveSelectedMember.locData.latitude, liveSelectedMember.locData.longitude)
    );

    const handleToggleOffline = useCallback((): void => {
        const nextMode = !isOfflineMode;
        setIsOfflineMode(nextMode);
        mapRef.current?.toggleOffline();

        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setModeToast(
            nextMode
                ? "Offline Map Active · Local Storage"
                : "Online Map Active · Live Topo Tiles"
        );
        toastTimeoutRef.current = setTimeout(() => {
            setModeToast(null);
        }, 2500);
    }, [isOfflineMode]);

    const handleSelectHiker = useCallback((member: IEnrichedGroupMember): void => {
        setSelectedMember(member);
        setShowRoster(false);
        if (member.locData && isValidCoord(member.locData.latitude, member.locData.longitude)) {
            mapRef.current?.flyTo?.({
                center: [member.locData.longitude, member.locData.latitude],
                zoom: 17,
                duration: 800,
            });
        }
    }, []);

    const handleCopySarData = useCallback(async (): Promise<void> => {
        if (!liveSelectedMember?.locData) return;
        const latVal = liveSelectedMember.locData.latitude.toFixed(6);
        const lonVal = liveSelectedMember.locData.longitude.toFixed(6);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latVal},${lonVal}`;
        const name = `${liveSelectedMember.firstname} ${liveSelectedMember.lastname || ""}`.trim() || "Hiker";
        const text = `THRAIL APP EMERGENCY SOS\n\nThis is ${name}. I am having a trail emergency and require immediate assistance. Copy this location in any browser or in Google Maps:\n\n[${latVal}, ${lonVal}]\n\n${mapUrl}`;

        await Clipboard.setStringAsync(text);
        setCopiedSar(true);
        if (copiedTimeoutRef.current) {
            clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => {
            setCopiedSar(false);
        }, 2500);
    }, [liveSelectedMember]);

    const handleOpenInMaps = useCallback((): void => {
        if (!liveSelectedMember?.locData) return;
        const latVal = liveSelectedMember.locData.latitude;
        const lonVal = liveSelectedMember.locData.longitude;
        const url = `https://www.google.com/maps/search/?api=1&query=${latVal},${lonVal}`;
        Linking.openURL(url).catch(() => {});
    }, [liveSelectedMember]);

    const trailName = hike?.trail?.name || currentGroup?.trail?.name || "Live Trail Monitor";
    const organizerName = currentGroup?.business?.name;
    const controlsBottomOffset = hasValidSelectedMember
        ? Math.max(insets.bottom + 230, 244)
        : Math.max(insets.bottom + 28, 40);

    return (
        <View style={styles.container}>
            <TrailMap
                ref={mapRef}
                isOffline={isOfflineMode}
                initialLon={effectiveInitialLon}
                initialLat={effectiveInitialLat}
                bottomInset={hasValidSelectedMember ? 230 : 32}
                showControls={false}
                hikerLocations={enrichedHikerLocations}
                currentUserId={undefined}
                mountainId={
                    currentGroup?.trail?.name ||
                    hike?.trail?.name ||
                    (currentGroup?.trail?.id !== "diy" ? currentGroup?.trail?.id : undefined)
                }
            />

            {/* Top Native Floating Header */}
            <View
                collapsable={false}
                style={[styles.floatingHeaderContainer, { top: insets.top + 10 }]}
            >
                <TouchableOpacity
                    onPress={onBackPress}
                    style={styles.glassPillRound}
                    activeOpacity={0.75}
                    accessibilityLabel="Return to Chat"
                >
                    <CustomIcon
                        library="Feather"
                        name="chevron-left"
                        size={24}
                        color={Colors.TEXT_PRIMARY}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setShowRoster(true)}
                    style={styles.glassPillCenter}
                >
                    <CustomText
                        variant="label"
                        style={styles.headerTitle}
                        numberOfLines={1}
                    >
                        {trailName}
                    </CustomText>
                    <View style={styles.liveStatusRow}>
                        <View
                            style={[
                                styles.statusDot,
                                liveCount > 0
                                    ? styles.dotLive
                                    : lostCount > 0
                                        ? styles.dotLost
                                        : styles.dotOffline,
                            ]}
                        />
                        <CustomText
                            variant="caption"
                            style={styles.statusText}
                            numberOfLines={1}
                        >
                            {liveCount > 0
                                ? `${liveCount} LIVE · ${sortedMembers.length} IN GROUP`
                                : lostCount > 0
                                    ? `${lostCount} SIGNAL LOST · ${sortedMembers.length} IN GROUP`
                                    : organizerName
                                        ? organizerName.toUpperCase()
                                        : `${sortedMembers.length} IN GROUP`}
                        </CustomText>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerRightSpacer} pointerEvents="none" />
            </View>

            {/* Map Mode Toast Banner */}
            {modeToast && (
                <View
                    style={[styles.modeToastBanner, { top: insets.top + 68 }]}
                    pointerEvents="none"
                >
                    <View style={styles.modeToastContent}>
                        <CustomIcon
                            library="Feather"
                            name={isOfflineMode ? "hard-drive" : "cloud"}
                            size={14}
                            color={Colors.PRIMARY}
                        />
                        <CustomText
                            variant="caption"
                            style={styles.modeToastText}
                        >
                            {modeToast}
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Error Banner */}
            {error && (
                <View
                    collapsable={false}
                    style={[styles.errorBanner, { top: insets.top + 68 }]}
                >
                    <CustomIcon
                        library="Feather"
                        name="alert-circle"
                        size={16}
                        color={Colors.ERROR}
                    />
                    <CustomText
                        variant="caption"
                        style={styles.errorBannerText}
                    >
                        {error}
                    </CustomText>
                </View>
            )}

            {/* Right-Side Floating Map Controls */}
            <View
                collapsable={false}
                style={[styles.mapControls, { bottom: controlsBottomOffset }]}
            >
                <TouchableOpacity
                    style={[styles.fabBtn, showRoster && styles.fabBtnActive]}
                    onPress={() => setShowRoster(true)}
                    activeOpacity={0.8}
                    accessibilityLabel={`Active Hikers (${sortedMembers.length})`}
                >
                    <CustomIcon
                        library="Feather"
                        name="users"
                        size={20}
                        color={Colors.PRIMARY}
                    />
                    {sortedMembers.length > 0 && (
                        <View style={styles.badgeMini}>
                            <CustomText
                                variant="caption"
                                style={styles.badgeMiniText}
                            >
                                {sortedMembers.length}
                            </CustomText>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fabBtn}
                    onPress={handleToggleOffline}
                    activeOpacity={0.8}
                    accessibilityLabel={`Toggle map mode. Currently ${isOfflineMode ? "Offline" : "Online"}`}
                >
                    <CustomIcon
                        library="Feather"
                        name={isOfflineMode ? "hard-drive" : "cloud"}
                        size={20}
                        color={Colors.PRIMARY}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fabBtn}
                    onPress={() => mapRef.current?.centerOnUser()}
                    activeOpacity={0.8}
                    accessibilityLabel="Center on my location"
                >
                    <CustomIcon
                        library="Ionicons"
                        name="locate"
                        size={22}
                        color={Colors.TEXT_PRIMARY}
                    />
                </TouchableOpacity>
            </View>

            {/* Selected Hiker Live Data Card */}
            {liveSelectedMember && liveSelectedMember.locData && hasValidSelectedMember && (
                <View
                    collapsable={false}
                    style={[
                        styles.sarCard,
                        { bottom: Math.max(insets.bottom + 12, 16) },
                    ]}
                >
                    <View style={styles.sarHeader}>
                        <View style={styles.sarHeaderLeft}>
                            <CustomIcon
                                library="Feather"
                                name={liveSelectedMember.status === "signal_lost" ? "alert-triangle" : "shield"}
                                size={16}
                                color={
                                    liveSelectedMember.status === "signal_lost"
                                        ? Colors.ORANGE
                                        : Colors.PRIMARY
                                }
                            />
                            <CustomText
                                variant="caption"
                                style={styles.sarTitle}
                            >
                                {liveSelectedMember.status === "signal_lost"
                                    ? "LAST KNOWN LOCATION"
                                    : "LIVE HIKER TELEMETRY"}
                            </CustomText>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setSelectedMember(null)}
                            accessibilityLabel="Dismiss target card"
                            activeOpacity={0.7}
                        >
                            <CustomIcon
                                library="Feather"
                                name="x"
                                size={18}
                                color={Colors.TEXT_SECONDARY}
                            />
                        </TouchableOpacity>
                    </View>

                    <CustomText
                        variant="h3"
                        style={styles.sarHikerName}
                        numberOfLines={1}
                    >
                        {`${liveSelectedMember.firstname} ${liveSelectedMember.lastname || ""}`.trim()}
                    </CustomText>

                    <View style={styles.coordDisplayBox}>
                        <CustomText
                            variant="caption"
                            style={styles.coordLabel}
                        >
                            SATELLITE COORDINATES
                        </CustomText>
                        <CustomText
                            variant="label"
                            style={styles.coordValues}
                        >
                            {`${liveSelectedMember.locData.latitude.toFixed(6)}, ${liveSelectedMember.locData.longitude.toFixed(6)}`}
                        </CustomText>
                        <CustomText
                            variant="caption"
                            style={styles.coordMeta}
                        >
                            {`Recorded: ${formatRecordedTime(liveSelectedMember.locData.timestamp)} (${formatTimeAgo(liveSelectedMember.locData.timestamp, currentTime)})`}
                        </CustomText>
                    </View>

                    <View style={styles.sarActionsRow}>
                        <TouchableOpacity
                            style={[styles.sarActionBtn, styles.sarActionBtnPrimary]}
                            onPress={handleCopySarData}
                            activeOpacity={0.8}
                        >
                            <CustomIcon
                                library="Feather"
                                name={copiedSar ? "check" : "copy"}
                                size={16}
                                color={Colors.WHITE}
                            />
                            <CustomText
                                variant="caption"
                                style={styles.sarActionBtnTextPrimary}
                            >
                                {copiedSar ? "Data Copied!" : "Copy Data"}
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sarActionBtn}
                            onPress={handleOpenInMaps}
                            activeOpacity={0.8}
                        >
                            <CustomIcon
                                library="Feather"
                                name="map-pin"
                                size={16}
                                color={Colors.TEXT_PRIMARY}
                            />
                            <CustomText
                                variant="caption"
                                style={styles.sarActionBtnText}
                            >
                                Open Maps
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Native Modal Bottom Sheet for Active Hikers List */}
            <Modal
                visible={showRoster}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRoster(false)}
            >
                <Pressable
                    style={styles.modalOverlayBottom}
                    onPress={() => setShowRoster(false)}
                >
                    <Pressable
                        style={[
                            styles.bottomSheet,
                            { paddingBottom: Math.max(insets.bottom + 20, 24) },
                        ]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.grabBarContainer}>
                            <View style={styles.grabBar} />
                        </View>

                        <View style={styles.sheetHeaderRow}>
                            <View>
                                <CustomText variant="h3">
                                    Active Hikers
                                </CustomText>
                                <CustomText
                                    variant="caption"
                                    style={styles.rosterSubtitle}
                                >
                                    {`${sortedMembers.length} ${sortedMembers.length === 1 ? "member" : "members"} in group · ${liveCount} live`}
                                </CustomText>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowRoster(false)}
                                style={styles.closeBtn}
                                activeOpacity={0.7}
                                accessibilityLabel="Close Active Hikers"
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="x"
                                    size={22}
                                    color={Colors.TEXT_PRIMARY}
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: Math.max(260, screenHeight * 0.55) }}
                        >
                            {sortedMembers.length === 0 ? (
                                <View style={styles.emptyRoster}>
                                    <CustomIcon
                                        library="Feather"
                                        name="radio"
                                        size={32}
                                        color={Colors.GRAY_MEDIUM}
                                    />
                                    <CustomText
                                        variant="label"
                                        style={styles.emptyRosterTitle}
                                    >
                                        Waiting for Telemetry
                                    </CustomText>
                                    <CustomText
                                        variant="caption"
                                        style={styles.emptyRosterSubtitle}
                                    >
                                        Hikers will appear on this board as soon as their devices broadcast active coordinates.
                                    </CustomText>
                                </View>
                            ) : (
                                sortedMembers.map((member, index) => {
                                    const locData = member.locData;
                                    const hasLoc = Boolean(
                                        locData &&
                                        isValidCoord(locData.latitude, locData.longitude)
                                    );
                                    const isLive = member.status === "live";
                                    const isLost = member.status === "signal_lost";
                                    const isOffline = member.status === "offline";
                                    const isSelected = selectedMember?.id === member.id;

                                    return (
                                        <TouchableOpacity
                                            key={member.id || index}
                                            activeOpacity={0.8}
                                            onPress={() => handleSelectHiker(member)}
                                            style={[
                                                styles.memberCard,
                                                isSelected && styles.memberCardSelected,
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.memberAvatar,
                                                    isLive && styles.avatarLive,
                                                    isLost && styles.avatarSignalLost,
                                                    isOffline && styles.avatarOffline,
                                                ]}
                                            >
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.avatarText}
                                                >
                                                    {getInitials(member.firstname, member.lastname)}
                                                </CustomText>
                                            </View>

                                            <View style={styles.memberInfo}>
                                                <CustomText
                                                    variant="label"
                                                    style={styles.memberName}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {`${member.firstname} ${member.lastname || ""}`.trim()}
                                                </CustomText>

                                                {hasLoc && locData ? (
                                                    <CustomText
                                                        variant="caption"
                                                        numberOfLines={1}
                                                        style={styles.memberCoordsText}
                                                    >
                                                        {`${locData.latitude.toFixed(4)}, ${locData.longitude.toFixed(4)}`}
                                                    </CustomText>
                                                ) : (
                                                    <CustomText
                                                        variant="caption"
                                                        numberOfLines={1}
                                                        style={styles.memberSubtextOffline}
                                                    >
                                                        Waiting for GPS signal...
                                                    </CustomText>
                                                )}

                                                {hasLoc && locData?.timestamp && (
                                                    <CustomText
                                                        variant="caption"
                                                        numberOfLines={1}
                                                        style={
                                                            isLost
                                                                ? styles.memberSubtextLost
                                                                : styles.memberSubtext
                                                        }
                                                    >
                                                        {isLost
                                                            ? `Signal lost • ${formatTimeAgo(locData.timestamp, currentTime)}`
                                                            : `Updated ${formatTimeAgo(locData.timestamp, currentTime)}`}
                                                    </CustomText>
                                                )}

                                                {hasLoc && locData && (
                                                    <View
                                                        style={[
                                                            styles.trackHikerBtn,
                                                            isLost && styles.trackHikerBtnLost,
                                                        ]}
                                                    >
                                                        <CustomIcon
                                                            library="Feather"
                                                            name={isLost ? "alert-triangle" : "map-pin"}
                                                            size={11}
                                                            color={isLost ? Colors.ORANGE : Colors.PRIMARY}
                                                        />
                                                        <CustomText
                                                            variant="caption"
                                                            style={[
                                                                styles.trackHikerBtnText,
                                                                isLost && styles.trackHikerBtnTextLost,
                                                            ]}
                                                        >
                                                            {isLost ? "Track Last Known" : "Track Hiker"}
                                                        </CustomText>
                                                    </View>
                                                )}
                                            </View>

                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    isLive && styles.badgeLive,
                                                    isLost && styles.badgeSignalLost,
                                                    isOffline && styles.badgeOffline,
                                                ]}
                                            >
                                                {isLive && (
                                                    <View
                                                        style={[
                                                            styles.statusDot,
                                                            styles.dotLive,
                                                        ]}
                                                    />
                                                )}
                                                {isLost && (
                                                    <CustomIcon
                                                        library="Feather"
                                                        name="alert-triangle"
                                                        size={10}
                                                        color={Colors.ORANGE}
                                                    />
                                                )}
                                                {isOffline && (
                                                    <View
                                                        style={[
                                                            styles.statusDot,
                                                            styles.dotOffline,
                                                        ]}
                                                    />
                                                )}

                                                <CustomText
                                                    variant="caption"
                                                    style={[
                                                        styles.statusBadgeText,
                                                        isLive && styles.textLive,
                                                        isLost && styles.textSignalLost,
                                                        isOffline && styles.textOffline,
                                                    ]}
                                                >
                                                    {isLive
                                                        ? "Live"
                                                        : isLost
                                                            ? "Signal Lost"
                                                            : "Offline"}
                                                </CustomText>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const HikeLiveMonitorScreen = memo(HikeLiveMonitorScreenComponent);
HikeLiveMonitorScreen.displayName = "HikeLiveMonitorScreen";

export default HikeLiveMonitorScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    floatingHeaderContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
        zIndex: 50,
        elevation: 8,
    },
    glassPillRound: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.WHITE,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        elevation: 6,
        ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }),
    },
    headerRightSpacer: {
        width: 44,
        height: 44,
    },
    glassPillCenter: {
        flex: 1,
        minHeight: 44,
        borderRadius: 22,
        backgroundColor: Colors.WHITE,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        elevation: 6,
        ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }),
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: Colors.TEXT_PRIMARY,
    },
    liveStatusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "800",
        color: Colors.TEXT_SECONDARY,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotLive: {
        backgroundColor: Colors.PRIMARY,
    },
    dotLost: {
        backgroundColor: Colors.WARNING,
    },
    dotOffline: {
        backgroundColor: Colors.GRAY_MEDIUM,
    },
    badgeMini: {
        position: "absolute",
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.PRIMARY,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
    },
    badgeMiniText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: "bold",
        lineHeight: 12,
    },
    modeToastBanner: {
        position: "absolute",
        left: 16,
        right: 16,
        alignItems: "center",
        zIndex: 60,
        elevation: 9,
    },
    modeToastContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        borderWidth: 1,
        gap: 8,
        elevation: 6,
        ...GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }),
    },
    modeToastText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.PRIMARY,
    },
    errorBanner: {
        position: "absolute",
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.ERROR_BG,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        zIndex: 55,
        elevation: 8,
        ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }),
    },
    errorBannerText: {
        flex: 1,
        color: Colors.ERROR,
        fontSize: 12,
        fontWeight: "600",
    },
    mapControls: {
        position: "absolute",
        right: 16,
        gap: 12,
        zIndex: 40,
        elevation: 8,
    },
    fabBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.WHITE,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        elevation: 6,
        ...GlobalStyles.dropShadow(4, 0.12, Colors.SHADOW, { radius: 8 }),
    },
    fabBtnActive: {
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    sarCard: {
        position: "absolute",
        left: 16,
        right: 16,
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: "center",
        borderRadius: 24,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 16,
        gap: 10,
        zIndex: 45,
        elevation: 10,
        ...GlobalStyles.dropShadow(6, 0.16, Colors.SHADOW, { radius: 12 }),
    },
    sarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sarHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    sarTitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    sarHikerName: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: "bold",
    },
    coordDisplayBox: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 4,
    },
    coordLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    coordValues: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 15,
        fontWeight: "bold",
    },
    coordMeta: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        marginTop: 2,
    },
    sarActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 2,
    },
    sarActionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    sarActionBtnPrimary: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    sarActionBtnText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: "bold",
    },
    sarActionBtnTextPrimary: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: "bold",
    },
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: "flex-end",
    },
    bottomSheet: {
        backgroundColor: Colors.WHITE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
        maxHeight: "85%",
        width: "100%",
        maxWidth: 500,
        alignSelf: "center",
        elevation: 16,
        ...GlobalStyles.dropShadow(8, 0.2, Colors.SHADOW, { radius: 16 }),
    },
    grabBarContainer: {
        alignItems: "center",
        paddingVertical: 6,
    },
    grabBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    sheetHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    rosterSubtitle: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyRoster: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyRosterTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: "bold",
        marginTop: 4,
    },
    emptyRosterSubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: "center",
        lineHeight: 18,
    },
    memberCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    memberCardSelected: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        flexShrink: 0,
    },
    avatarLive: {
        backgroundColor: Colors.PRIMARY,
    },
    avatarSignalLost: {
        backgroundColor: Colors.WARNING,
    },
    avatarOffline: {
        backgroundColor: Colors.GRAY_MEDIUM,
    },
    avatarText: {
        color: Colors.WHITE,
        fontWeight: "bold",
        fontSize: 14,
    },
    memberInfo: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    memberName: {
        fontWeight: "bold",
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
    },
    memberCoordsText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        marginTop: 2,
    },
    memberSubtext: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    memberSubtextLost: {
        color: Colors.ORANGE,
        fontWeight: "600",
        marginTop: 2,
    },
    memberSubtextOffline: {
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
        flexShrink: 0,
        alignSelf: "center",
    },
    badgeLive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    badgeSignalLost: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        borderColor: Colors.STATUS_WARNING_BORDER,
    },
    badgeOffline: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: "bold",
    },
    textLive: {
        color: Colors.PRIMARY,
    },
    textSignalLost: {
        color: Colors.ORANGE,
    },
    textOffline: {
        color: Colors.TEXT_SECONDARY,
    },
    trackHikerBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignSelf: "flex-start",
    },
    trackHikerBtnLost: {
        backgroundColor: Colors.STATUS_WARNING_BG,
    },
    trackHikerBtnText: {
        fontSize: 11,
        fontWeight: "bold",
        color: Colors.PRIMARY,
    },
    trackHikerBtnTextLost: {
        color: Colors.ORANGE,
    },
});
