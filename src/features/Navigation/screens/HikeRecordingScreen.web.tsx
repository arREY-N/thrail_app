import { Palette, Colors } from "@/src/constants/colors";
import { useEnrichedHikerLocations } from "@/src/features/Navigation/hooks/useEnrichedHikerLocations";
import {
    HikeRecordingScreenProps,
    IEnrichedGroupMember,
    IHikerLocation
} from "@/src/features/Navigation/types/HikeRecordingScreen.types";
import TrailMap, { TrailMapRef } from "@/src/features/Map/TrailMap";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

export interface HikeRecordingScreenWebProps extends Partial<HikeRecordingScreenProps> {
    groupId?: string;
    currentGroup?: HikeRecordingScreenProps['currentGroup'];
    hikerLocations?: IHikerLocation[];
    error?: string | null;
    onBackPress?: () => void;
    lon?: string | string[];
    lat?: string | string[];
}

const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    return '?';
};

const formatTimeAgo = (timestamp?: Date | string | number, currentTimeMs = Date.now()): string => {
    if (!timestamp) return "";
    const timeMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
    if (isNaN(timeMs)) return "";
    const mins = Math.max(0, Math.floor((currentTimeMs - timeMs) / (1000 * 60)));
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m ago`;
};

const formatRecordedTime = (timestamp?: Date | string | number): string => {
    if (!timestamp) return "Unknown";
    const timeMs = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
    if (isNaN(timeMs)) return "Unknown";
    return new Date(timeMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const isValidCoord = (lat?: number | null, lon?: number | null): boolean => {
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    return isFinite(lat) && isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

const HikeRecordingScreenWeb: React.FC<HikeRecordingScreenWebProps> = memo(({
    hike,
    currentGroup = null,
    hikerLocations = [],
    error = null,
    onBackPress = () => {},
    lon,
    lat,
    profile,
}) => {
    const { width: windowWidth } = useWindowDimensions();
    const [clientInnerWidth, setClientInnerWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : windowWidth
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateWidth = () => setClientInnerWidth(window.innerWidth);
        window.addEventListener('resize', updateWidth);
        window.addEventListener('orientationchange', updateWidth);
        updateWidth();
        return () => {
            window.removeEventListener('resize', updateWidth);
            window.removeEventListener('orientationchange', updateWidth);
        };
    }, []);

    // Active width considers both React Native Dimensions and native DOM innerWidth
    const activeWidth = Math.min(windowWidth, clientInnerWidth);
    const isMobile = activeWidth < 768;

    const mapRef = useRef<TrailMapRef | null>(null);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [selectedMember, setSelectedMember] = useState<IEnrichedGroupMember | null>(null);

    // On desktop start open; on mobile start collapsed so the map is 100% visible
    const [showRoster, setShowRoster] = useState(false);
    const hasInitializedRosterRef = useRef(false);

    useEffect(() => {
        if (!hasInitializedRosterRef.current) {
            hasInitializedRosterRef.current = true;
            setShowRoster(!isMobile);
        }
    }, [isMobile]);

    const [copiedSar, setCopiedSar] = useState(false);

    // Stable 10-second ticker for live timestamp calculations
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Telemetry enrichment hook
    const { sortedMembers, enrichedHikerLocations, liveCount, lostCount } = useEnrichedHikerLocations(
        currentGroup,
        hikerLocations,
        currentTime
    );

    // Synchronize selected member with newest telemetry updates
    const liveSelectedMember = selectedMember
        ? sortedMembers.find((m) => m.id === selectedMember.id) || selectedMember
        : null;

    const handleSelectHiker = useCallback((member: IEnrichedGroupMember) => {
        setSelectedMember(member);
        if (member.locData && isValidCoord(member.locData.latitude, member.locData.longitude)) {
            mapRef.current?.flyTo?.({
                center: [member.locData.longitude, member.locData.latitude],
                zoom: 17,
                duration: 800,
            });
        }
        // Auto-close roster on mobile so user sees the focused map & data card
        if (isMobile) {
            setShowRoster(false);
        }
    }, [isMobile]);

    const handleCopySarData = useCallback(async () => {
        if (!liveSelectedMember?.locData) return;
        const latVal = liveSelectedMember.locData.latitude.toFixed(6);
        const lonVal = liveSelectedMember.locData.longitude.toFixed(6);
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latVal},${lonVal}`;
        const name = `${liveSelectedMember.firstname} ${liveSelectedMember.lastname || ''}`.trim() || 'Hiker';
        const text = `THRAIL APP EMERGENCY SOS\n\nThis is ${name}. I am having a trail emergency and require immediate assistance. Copy this location in any browser or in Google Maps:\n\n[${latVal}, ${lonVal}]\n\n${mapUrl}`;

        await Clipboard.setStringAsync(text);
        setCopiedSar(true);
        setTimeout(() => setCopiedSar(false), 2500);
    }, [liveSelectedMember]);

    const handleOpenInMaps = useCallback(() => {
        if (!liveSelectedMember?.locData) return;
        const latVal = liveSelectedMember.locData.latitude;
        const lonVal = liveSelectedMember.locData.longitude;
        const url = `https://www.google.com/maps/search/?api=1&query=${latVal},${lonVal}`;
        if (typeof window !== 'undefined') {
            window.open(url, '_blank');
        }
    }, [liveSelectedMember]);

    const trailName = hike?.trail?.name || currentGroup?.trail?.name || "Live Trail Monitoring";
    const organizerName = currentGroup?.business?.name;

    return (
        <View style={styles.container}>
            {/* Fullscreen MapLibre Map */}
            <TrailMap
                ref={mapRef}
                initialLon={lon}
                initialLat={lat}
                bottomInset={isMobile ? (liveSelectedMember ? 220 : 20) : 24}
                showControls={false}
                hikerLocations={enrichedHikerLocations}
                currentUserId={profile?.id}
                mountainId={currentGroup?.trail?.name || hike?.trail?.name || (currentGroup?.trail?.id !== 'diy' ? currentGroup?.trail?.id : undefined)}
            />

            {/* Top Responsive Clean Light Glassmorphic Header */}
            <View style={[styles.topHeader, isMobile && styles.topHeaderMobile]}>
                <View style={[styles.headerLeft, isMobile && styles.headerLeftMobile]}>
                    <TouchableOpacity
                        style={[styles.iconBtn, isMobile && styles.iconBtnMobile]}
                        onPress={onBackPress}
                        accessibilityLabel="Return to Dashboard"
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="arrow-back" size={isMobile ? 18 : 20} color={Palette.Neutral950} />
                    </TouchableOpacity>

                    <View style={styles.titleColumn}>
                        <Text style={[styles.trailTitle, isMobile && styles.trailTitleMobile]} numberOfLines={1}>
                            {trailName}
                        </Text>
                        <Text style={[styles.subtitleText, isMobile && styles.subtitleTextMobile]} numberOfLines={1}>
                            {isMobile
                                ? (organizerName || 'Live Monitor')
                                : (organizerName ? `Organized by ${organizerName}` : 'Desktop Spectator Dashboard')}
                        </Text>
                    </View>
                </View>

                {/* Desktop-Only Center Telemetry Counters */}
                {!isMobile && (
                    <View style={styles.headerCenter}>
                        <View style={[styles.pill, styles.pillLive]}>
                            <View style={[styles.statusDot, { backgroundColor: Palette.Green600 }]} />
                            <Text style={styles.pillTextLive}>{liveCount} Live</Text>
                        </View>
                        {lostCount > 0 && (
                            <View style={[styles.pill, styles.pillLost]}>
                                <View style={[styles.statusDot, { backgroundColor: Palette.Amber500 }]} />
                                <Text style={styles.pillTextLost}>{lostCount} Signal Lost</Text>
                            </View>
                        )}
                        <View style={[styles.pill, styles.pillTracked]}>
                            <MaterialIcons name="people" size={14} color={Palette.Slate500} />
                            <Text style={styles.pillText}>{sortedMembers.length} Tracked</Text>
                        </View>
                    </View>
                )}

                {/* Action Controls */}
                <View style={[styles.headerRight, isMobile && styles.headerRightMobile]}>
                    {/* Mobile-Only Compact Live Pill */}
                    {isMobile && liveCount > 0 && (
                        <View style={styles.pillLiveMini}>
                            <View style={[styles.statusDot, { backgroundColor: Palette.Green600 }]} />
                            <Text style={styles.pillLiveMiniText}>{liveCount}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.glassButton, isMobile && styles.glassButtonMobile]}
                        onPress={() => mapRef.current?.centerOnUser()}
                        accessibilityLabel="My Location"
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="my-location" size={isMobile ? 18 : 18} color={Palette.Slate700} />
                        {!isMobile && <Text style={styles.glassButtonText}>My Location</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.glassButton, isMobile && styles.glassButtonMobile]}
                        onPress={() => mapRef.current?.toggleOffline()}
                        accessibilityLabel="Basemap"
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="layers" size={isMobile ? 18 : 18} color={Palette.Slate700} />
                        {!isMobile && <Text style={styles.glassButtonText}>Basemap</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.glassButton,
                            isMobile && styles.glassButtonMobile,
                            showRoster && styles.glassButtonActive,
                        ]}
                        onPress={() => setShowRoster((prev) => !prev)}
                        accessibilityLabel={`Hikers (${sortedMembers.length})`}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons
                            name="group"
                            size={isMobile ? 18 : 18}
                            color={showRoster ? Palette.Green700 : Palette.Slate700}
                        />
                        {!isMobile ? (
                            <Text style={[styles.glassButtonText, showRoster && styles.glassButtonTextActive]}>
                                Hikers ({sortedMembers.length})
                            </Text>
                        ) : (
                            sortedMembers.length > 0 && (
                                <View style={styles.badgeMini}>
                                    <Text style={styles.badgeMiniText}>{sortedMembers.length}</Text>
                                </View>
                            )
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error Notification Banner */}
            {error && (
                <View style={[styles.errorBanner, isMobile && styles.errorBannerMobile]}>
                    <MaterialIcons name="warning" size={16} color={Palette.Red600} />
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            )}

            {/* Responsive Active Hikers Panel (Light Theme Desktop Sidebar / Mobile Bottom Sheet) */}
            {showRoster && (
                <View style={[styles.rosterPanel, isMobile && styles.rosterPanelMobile]}>
                    {isMobile && (
                        <View style={styles.grabBarContainer}>
                            <View style={styles.grabBar} />
                        </View>
                    )}
                    <View style={[styles.rosterHeader, isMobile && styles.rosterHeaderMobile]}>
                        <View>
                            <Text style={styles.rosterTitle}>Active Hikers</Text>
                            <Text style={styles.rosterSubtitle}>
                                {sortedMembers.length} {sortedMembers.length === 1 ? 'member' : 'members'} in group
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowRoster(false)}
                            accessibilityLabel="Close roster panel"
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="close" size={18} color={Palette.Slate500} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.rosterList} contentContainerStyle={styles.rosterListContent}>
                        {sortedMembers.length === 0 ? (
                            <View style={styles.emptyRoster}>
                                <MaterialIcons name="location-searching" size={28} color={Palette.Slate400} />
                                <Text style={styles.emptyRosterTitle}>Waiting for Telemetry</Text>
                                <Text style={styles.emptyRosterSubtitle}>
                                    Hikers will appear on this board as soon as their devices broadcast active coordinates.
                                </Text>
                            </View>
                        ) : (
                            sortedMembers.map((member) => {
                                const isSelected = selectedMember?.id === member.id;
                                const hasLoc = member.locData && isValidCoord(member.locData.latitude, member.locData.longitude);
                                const statusColor = member.status === 'live'
                                    ? Palette.Green600
                                    : (member.status === 'signal_lost' ? Palette.Amber500 : Palette.Slate400);

                                return (
                                    <Pressable
                                        key={member.id}
                                        style={[
                                            styles.hikerCard,
                                            isSelected && styles.hikerCardSelected,
                                        ]}
                                        onPress={() => handleSelectHiker(member)}
                                    >
                                        <View style={[styles.avatarCircle, { borderColor: statusColor }]}>
                                            <Text style={styles.avatarInitials}>
                                                {getInitials(member.firstname, member.lastname)}
                                            </Text>
                                            <View style={[styles.avatarStatusBadge, { backgroundColor: statusColor }]} />
                                        </View>

                                        <View style={styles.hikerCardBody}>
                                            <View style={styles.hikerNameRow}>
                                                <Text style={styles.hikerName} numberOfLines={1}>
                                                    {member.firstname} {member.lastname || ''}
                                                </Text>
                                                {member.status === 'live' && (
                                                    <View style={[styles.statusTag, styles.statusTagLive]}>
                                                        <Text style={styles.statusTagTextLive}>LIVE</Text>
                                                    </View>
                                                )}
                                                {member.status === 'signal_lost' && (
                                                    <View style={[styles.statusTag, styles.statusTagLost]}>
                                                        <Text style={styles.statusTagTextLost}>LOST</Text>
                                                    </View>
                                                )}
                                                {member.status === 'offline' && (
                                                    <View style={[styles.statusTag, styles.statusTagOffline]}>
                                                        <Text style={styles.statusTagTextOffline}>OFFLINE</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.telemetryRow}>
                                                {hasLoc ? (
                                                    <Text style={styles.telemetrySnippet} numberOfLines={1}>
                                                        {member.locData!.latitude.toFixed(4)}, {member.locData!.longitude.toFixed(4)}
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.telemetrySnippetMuted}>No GPS telemetry received</Text>
                                                )}
                                            </View>

                                            {hasLoc && member.locData!.timestamp && (
                                                <Text style={styles.timeAgoSnippet}>
                                                    {member.status === 'signal_lost' ? 'Signal lost ' : 'Updated '}
                                                    {formatTimeAgo(member.locData!.timestamp, currentTime)}
                                                </Text>
                                            )}
                                        </View>

                                        {hasLoc && (
                                            <TouchableOpacity
                                                style={styles.crosshairBtn}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectHiker(member);
                                                }}
                                                accessibilityLabel={`Track ${member.firstname}`}
                                            >
                                                <MaterialIcons name="my-location" size={16} color={Palette.Green700} />
                                            </TouchableOpacity>
                                        )}
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Selected Hiker Live Data / Emergency Target Card (Clean Light Aesthetic) */}
            {liveSelectedMember && liveSelectedMember.locData && isValidCoord(liveSelectedMember.locData.latitude, liveSelectedMember.locData.longitude) && (
                <View style={[styles.sarCard, isMobile && styles.sarCardMobile]}>
                    <View style={styles.sarHeader}>
                        <View style={styles.sarHeaderLeft}>
                            <MaterialIcons
                                name="security"
                                size={20}
                                color={liveSelectedMember.status === 'signal_lost' ? Palette.Amber600 : Palette.Green700}
                            />
                            <Text style={styles.sarTitle}>
                                {liveSelectedMember.status === 'signal_lost' ? 'Last Known Data' : 'Live Data'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setSelectedMember(null)}
                            accessibilityLabel="Dismiss target card"
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="close" size={18} color={Palette.Slate500} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sarHikerName}>
                        {liveSelectedMember.firstname} {liveSelectedMember.lastname || ''}
                    </Text>

                    <View style={styles.coordDisplayBox}>
                        <Text style={styles.coordLabel}>SATELLITE COORDINATES</Text>
                        <Text style={styles.coordValues}>
                            {liveSelectedMember.locData.latitude.toFixed(6)}, {liveSelectedMember.locData.longitude.toFixed(6)}
                        </Text>
                        <View style={styles.coordMetaRow}>
                            <Text style={styles.coordMeta}>
                                Recorded: {formatRecordedTime(liveSelectedMember.locData.timestamp)} ({formatTimeAgo(liveSelectedMember.locData.timestamp, currentTime)})
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sarActionsRow}>
                        <TouchableOpacity
                            style={[styles.sarActionBtn, styles.sarActionBtnPrimary]}
                            onPress={handleCopySarData}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name={copiedSar ? "check" : "content-copy"} size={16} color={Palette.White} />
                            <Text style={styles.sarActionBtnTextPrimary}>
                                {copiedSar ? "Data Copied!" : "Copy Data"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sarActionBtn}
                            onPress={handleOpenInMaps}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="map" size={16} color={Palette.Slate700} />
                            <Text style={styles.sarActionBtnText}>Open Maps</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
});

HikeRecordingScreenWeb.displayName = "HikeRecordingScreenWeb";
export default HikeRecordingScreenWeb;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: Palette.OffWhite,
    },
    topHeader: {
        position: "absolute",
        top: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
    },
    topHeaderMobile: {
        top: 10,
        left: 10,
        right: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 8px 20px -3px rgba(0, 0, 0, 0.10)",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flexShrink: 1,
        minWidth: 0,
    },
    headerLeftMobile: {
        gap: 8,
        flex: 1,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Palette.Slate100,
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
    },
    iconBtnMobile: {
        width: 34,
        height: 34,
        borderRadius: 17,
    },
    titleColumn: {
        gap: 2,
        flexShrink: 1,
        minWidth: 0,
    },
    trailTitle: {
        color: Palette.Neutral950,
        fontSize: 16,
        fontWeight: "800",
        maxWidth: 240,
    },
    trailTitleMobile: {
        fontSize: 14,
        maxWidth: 135,
    },
    subtitleText: {
        color: Palette.Slate500,
        fontSize: 12,
        fontWeight: "500",
    },
    subtitleTextMobile: {
        fontSize: 10,
    },
    headerCenter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    pillLive: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
    },
    pillLiveMini: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        flexShrink: 0,
    },
    pillLiveMiniText: {
        color: Palette.Green800,
        fontSize: 11,
        fontWeight: "800",
    },
    pillLost: {
        backgroundColor: Palette.Amber50,
        borderColor: Palette.Amber200,
    },
    pillTracked: {
        backgroundColor: Palette.Slate100,
        borderColor: Palette.Slate200,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    pillText: {
        color: Palette.Slate700,
        fontSize: 12,
        fontWeight: "600",
    },
    pillTextLive: {
        color: Palette.Green800,
        fontSize: 12,
        fontWeight: "700",
    },
    pillTextLost: {
        color: Palette.Amber900,
        fontSize: 12,
        fontWeight: "700",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
    },
    headerRightMobile: {
        gap: 6,
    },
    glassButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        cursor: "pointer",
        flexShrink: 0,
    },
    glassButtonMobile: {
        width: 34,
        height: 34,
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    glassButtonActive: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green600,
    },
    glassButtonText: {
        color: Palette.Slate700,
        fontSize: 12,
        fontWeight: "600",
    },
    glassButtonTextActive: {
        color: Palette.Green700,
        fontWeight: "700",
    },
    badgeMini: {
        position: "absolute",
        top: -3,
        right: -3,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Palette.Green700,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    badgeMiniText: {
        color: Palette.White,
        fontSize: 9,
        fontWeight: "800",
    },
    errorBanner: {
        position: "absolute",
        top: 84,
        left: 16,
        zIndex: 50,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Palette.Red50,
        borderWidth: 1,
        borderColor: Palette.Red200,
    },
    errorBannerMobile: {
        top: 64,
        left: 10,
        right: 10,
    },
    errorBannerText: {
        color: Palette.Red800,
        fontSize: 12,
        fontWeight: "600",
    },
    grabBarContainer: {
        alignItems: "center",
        paddingVertical: 8,
    },
    grabBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: Palette.Slate300,
    },
    rosterPanel: {
        position: "absolute",
        top: 84,
        right: 16,
        bottom: 24,
        width: 360,
        zIndex: 40,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.12)",
        flexDirection: "column",
        overflow: "hidden",
    },
    rosterPanelMobile: {
        position: "absolute",
        top: "auto",
        left: 10,
        right: 10,
        bottom: 10,
        width: "auto",
        maxHeight: "52%",
        borderRadius: 24,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.18)",
    },
    rosterHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Palette.Slate100,
    },
    rosterHeaderMobile: {
        paddingVertical: 10,
    },
    rosterTitle: {
        color: Palette.Neutral950,
        fontSize: 16,
        fontWeight: "800",
    },
    rosterSubtitle: {
        color: Palette.Slate500,
        fontSize: 11,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Palette.Slate100,
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    rosterList: {
        flex: 1,
    },
    rosterListContent: {
        padding: 12,
        gap: 8,
    },
    emptyRoster: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyRosterTitle: {
        color: Palette.Slate700,
        fontSize: 14,
        fontWeight: "700",
        marginTop: 8,
    },
    emptyRosterSubtitle: {
        color: Palette.Slate400,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
    },
    hikerCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        borderRadius: 14,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
    },
    hikerCardSelected: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green600,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Slate100,
        position: "relative",
    },
    avatarInitials: {
        color: Palette.Slate800,
        fontSize: 13,
        fontWeight: "700",
    },
    avatarStatusBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Palette.White,
    },
    hikerCardBody: {
        flex: 1,
        gap: 2,
    },
    hikerNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    hikerName: {
        color: Palette.Neutral950,
        fontSize: 14,
        fontWeight: "700",
        maxWidth: 150,
    },
    statusTag: {
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 8,
    },
    statusTagLive: {
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
    },
    statusTagLost: {
        backgroundColor: Palette.Amber50,
        borderWidth: 1,
        borderColor: Palette.Amber200,
    },
    statusTagOffline: {
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
    },
    statusTagTextLive: {
        color: Palette.Green800,
        fontSize: 9,
        fontWeight: "800",
    },
    statusTagTextLost: {
        color: Palette.Amber900,
        fontSize: 9,
        fontWeight: "800",
    },
    statusTagTextOffline: {
        color: Palette.Slate600,
        fontSize: 9,
        fontWeight: "700",
    },
    telemetryRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    telemetrySnippet: {
        color: Palette.Slate700,
        fontSize: 11,
        fontFamily: "monospace",
        fontWeight: "600",
    },
    telemetrySnippetMuted: {
        color: Palette.Slate400,
        fontSize: 11,
        fontStyle: "italic",
    },
    timeAgoSnippet: {
        color: Palette.Slate400,
        fontSize: 10,
    },
    crosshairBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Palette.Green50,
        borderWidth: 1,
        borderColor: Palette.Green200,
        cursor: "pointer",
    },
    sarCard: {
        position: "absolute",
        bottom: 24,
        left: 16,
        width: 380,
        zIndex: 40,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
        padding: 16,
        flexDirection: "column",
        gap: 10,
    },
    sarCardMobile: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 10,
        width: "auto",
        padding: 14,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.18)",
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
        color: Palette.Slate500,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    sarHikerName: {
        color: Palette.Neutral950,
        fontSize: 18,
        fontWeight: "800",
    },
    coordDisplayBox: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: Palette.Slate50,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        gap: 4,
    },
    coordLabel: {
        color: Palette.Slate500,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    coordValues: {
        color: Palette.Neutral950,
        fontSize: 16,
        fontWeight: "800",
        fontFamily: "monospace",
        letterSpacing: 0.5,
    },
    coordMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    coordMeta: {
        color: Palette.Slate500,
        fontSize: 11,
    },
    sarActionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    sarActionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Palette.Slate100,
        borderWidth: 1,
        borderColor: Palette.Slate200,
        cursor: "pointer",
    },
    sarActionBtnPrimary: {
        backgroundColor: Palette.Green700,
        borderColor: Palette.Green700,
    },
    sarActionBtnText: {
        color: Palette.Slate800,
        fontSize: 12,
        fontWeight: "700",
    },
    sarActionBtnTextPrimary: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "700",
    },
});
