import { Palette } from "@/src/constants/colors";
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
    View
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
    const mapRef = useRef<TrailMapRef | null>(null);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [selectedMember, setSelectedMember] = useState<IEnrichedGroupMember | null>(null);
    const [showRoster, setShowRoster] = useState(true);
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
    }, []);

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
                bottomInset={24}
                showControls={false}
                hikerLocations={enrichedHikerLocations}
                currentUserId={profile?.id}
                mountainId={currentGroup?.trail?.name || hike?.trail?.name || (currentGroup?.trail?.id !== 'diy' ? currentGroup?.trail?.id : undefined)}
            />

            {/* Top Desktop Floating Glassmorphic Header */}
            <View style={styles.topHeader}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={onBackPress}
                        accessibilityLabel="Return to Dashboard"
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={Palette.White} />
                    </TouchableOpacity>

                    <View style={styles.titleColumn}>
                        <Text style={styles.trailTitle} numberOfLines={1}>{trailName}</Text>
                        <Text style={styles.subtitleText} numberOfLines={1}>
                            {organizerName ? `Organized by ${organizerName}` : 'Desktop Spectator Dashboard'}
                        </Text>
                    </View>
                </View>

                {/* Telemetry Counter Pills */}
                <View style={styles.headerCenter}>
                    <View style={[styles.pill, styles.pillLive]}>
                        <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                        <Text style={styles.pillText}>{liveCount} Live</Text>
                    </View>
                    {lostCount > 0 && (
                        <View style={[styles.pill, styles.pillLost]}>
                            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                            <Text style={styles.pillText}>{lostCount} Signal Lost</Text>
                        </View>
                    )}
                    <View style={[styles.pill, styles.pillTracked]}>
                        <MaterialIcons name="people" size={14} color={Palette.Slate400} />
                        <Text style={styles.pillText}>{sortedMembers.length} Tracked</Text>
                    </View>
                </View>

                {/* Action Controls */}
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.glassButton}
                        onPress={() => mapRef.current?.centerOnUser()}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="my-location" size={18} color={Palette.White} />
                        <Text style={styles.glassButtonText}>My Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.glassButton}
                        onPress={() => mapRef.current?.toggleOffline()}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="layers" size={18} color={Palette.White} />
                        <Text style={styles.glassButtonText}>Basemap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.glassButton, showRoster && styles.glassButtonActive]}
                        onPress={() => setShowRoster((prev) => !prev)}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="group" size={18} color={showRoster ? Palette.Green300 : Palette.White} />
                        <Text style={[styles.glassButtonText, showRoster && styles.glassButtonTextActive]}>
                            Hikers ({sortedMembers.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Error Notification Banner */}
            {error && (
                <View style={styles.errorBanner}>
                    <MaterialIcons name="warning" size={16} color="#EF4444" />
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            )}

            {/* Collapsible Right-Side Hiker Roster Panel */}
            {showRoster && (
                <View style={styles.rosterPanel}>
                    <View style={styles.rosterHeader}>
                        <View>
                            <Text style={styles.rosterTitle}>Active Hikers</Text>
                            <Text style={styles.rosterSubtitle}>Real-time telemetry stream</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShowRoster(false)}
                            accessibilityLabel="Close roster panel"
                        >
                            <MaterialIcons name="close" size={20} color={Palette.Slate400} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.rosterList} contentContainerStyle={styles.rosterListContent}>
                        {sortedMembers.length === 0 ? (
                            <View style={styles.emptyRoster}>
                                <MaterialIcons name="location-searching" size={32} color={Palette.Slate600} />
                                <Text style={styles.emptyRosterTitle}>Waiting for Telemetry</Text>
                                <Text style={styles.emptyRosterSubtitle}>
                                    Hikers will appear on this board as soon as their devices broadcast active coordinates.
                                </Text>
                            </View>
                        ) : (
                            sortedMembers.map((member) => {
                                const isSelected = selectedMember?.id === member.id;
                                const hasLoc = member.locData && isValidCoord(member.locData.latitude, member.locData.longitude);
                                const statusColor = member.status === 'live' ? '#22C55E' : (member.status === 'signal_lost' ? '#F59E0B' : Palette.Slate500);

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
                                                <MaterialIcons name="my-location" size={16} color={Palette.Green400} />
                                            </TouchableOpacity>
                                        )}
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Selected Hiker Search & Rescue (SAR) Card */}
            {liveSelectedMember && liveSelectedMember.locData && isValidCoord(liveSelectedMember.locData.latitude, liveSelectedMember.locData.longitude) && (
                <View style={styles.sarCard}>
                    <View style={styles.sarHeader}>
                        <View style={styles.sarHeaderLeft}>
                            <MaterialIcons name="security" size={20} color={liveSelectedMember.status === 'signal_lost' ? '#F59E0B' : '#22C55E'} />
                            <Text style={styles.sarTitle}>
                                {liveSelectedMember.status === 'signal_lost' ? 'Last Known Data' : 'Live Data'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.sarCloseBtn}
                            onPress={() => setSelectedMember(null)}
                            accessibilityLabel="Dismiss target card"
                        >
                            <MaterialIcons name="close" size={16} color={Palette.Slate400} />
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
                            <MaterialIcons name="map" size={16} color={Palette.White} />
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
        backgroundColor: Palette.Slate900,
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
        borderRadius: 16,
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    titleColumn: {
        gap: 2,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    trailTitle: {
        color: Palette.White,
        fontSize: 16,
        fontWeight: "700",
        maxWidth: 240,
    },
    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(34, 197, 94, 0.16)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(34, 197, 94, 0.35)",
    },
    pulsingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#22C55E",
    },
    liveBadgeText: {
        color: "#4ADE80",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    subtitleText: {
        color: Palette.Slate400,
        fontSize: 12,
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
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    pillLive: {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        borderColor: "rgba(34, 197, 94, 0.3)",
    },
    pillLost: {
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        borderColor: "rgba(245, 158, 11, 0.3)",
    },
    pillTracked: {
        backgroundColor: "rgba(148, 163, 184, 0.08)",
        borderColor: "rgba(148, 163, 184, 0.15)",
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    pillText: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "600",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    glassButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        cursor: "pointer",
    },
    glassButtonActive: {
        backgroundColor: "rgba(34, 197, 94, 0.18)",
        borderColor: "rgba(34, 197, 94, 0.4)",
    },
    glassButtonText: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "600",
    },
    glassButtonTextActive: {
        color: Palette.Green300,
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
        borderRadius: 8,
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.4)",
    },
    errorBannerText: {
        color: "#FCA5A5",
        fontSize: 12,
        fontWeight: "600",
    },
    rosterPanel: {
        position: "absolute",
        top: 84,
        right: 16,
        bottom: 24,
        width: 360,
        zIndex: 40,
        borderRadius: 16,
        backgroundColor: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(16px)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        flexDirection: "column",
        overflow: "hidden",
    },
    rosterHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
    },
    rosterTitle: {
        color: Palette.White,
        fontSize: 15,
        fontWeight: "700",
    },
    rosterSubtitle: {
        color: Palette.Slate400,
        fontSize: 11,
    },
    closeBtn: {
        padding: 4,
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
        color: Palette.Slate300,
        fontSize: 14,
        fontWeight: "600",
        marginTop: 8,
    },
    emptyRosterSubtitle: {
        color: Palette.Slate500,
        fontSize: 12,
        textAlign: "center",
        lineHeight: 18,
    },
    hikerCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
        cursor: "pointer",
    },
    hikerCardSelected: {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        borderColor: "rgba(34, 197, 94, 0.4)",
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        position: "relative",
    },
    avatarInitials: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "700",
    },
    avatarStatusBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Palette.Slate900,
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
        color: Palette.White,
        fontSize: 13,
        fontWeight: "600",
        maxWidth: 150,
    },
    statusTag: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
    },
    statusTagLive: {
        backgroundColor: "rgba(34, 197, 94, 0.2)",
    },
    statusTagLost: {
        backgroundColor: "rgba(245, 158, 11, 0.2)",
    },
    statusTagOffline: {
        backgroundColor: "rgba(148, 163, 184, 0.2)",
    },
    statusTagTextLive: {
        color: "#4ADE80",
        fontSize: 9,
        fontWeight: "800",
    },
    statusTagTextLost: {
        color: "#FBBF24",
        fontSize: 9,
        fontWeight: "800",
    },
    statusTagTextOffline: {
        color: Palette.Slate400,
        fontSize: 9,
        fontWeight: "700",
    },
    telemetryRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    telemetrySnippet: {
        color: Palette.Slate300,
        fontSize: 11,
        fontFamily: "monospace",
    },
    telemetrySnippetMuted: {
        color: Palette.Slate500,
        fontSize: 11,
        fontStyle: "italic",
    },
    timeAgoSnippet: {
        color: Palette.Slate400,
        fontSize: 10,
    },
    crosshairBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        cursor: "pointer",
    },
    sarCard: {
        position: "absolute",
        bottom: 24,
        left: 16,
        width: 380,
        zIndex: 40,
        borderRadius: 16,
        backgroundColor: "rgba(15, 23, 42, 0.96)",
        backdropFilter: "blur(16px)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
        padding: 16,
        flexDirection: "column",
        gap: 10,
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
        color: Palette.Slate300,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    sarCloseBtn: {
        padding: 4,
        cursor: "pointer",
    },
    sarHikerName: {
        color: Palette.White,
        fontSize: 17,
        fontWeight: "700",
    },
    coordDisplayBox: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        gap: 4,
    },
    coordLabel: {
        color: Palette.Slate400,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    coordValues: {
        color: Palette.White,
        fontSize: 15,
        fontWeight: "700",
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
        color: Palette.Slate400,
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
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        cursor: "pointer",
    },
    sarActionBtnPrimary: {
        backgroundColor: "#16A34A",
        borderColor: "#22C55E",
    },
    sarActionBtnText: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "600",
    },
    sarActionBtnTextPrimary: {
        color: Palette.White,
        fontSize: 12,
        fontWeight: "700",
    },
});
