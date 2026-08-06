/**
 * @file TrailCard.tsx
 * @description Modular presentation card component for Trail domain objects. Features balanced top-right status/classification badges with semantic color tokens, real-data-only conditional chip rendering, LinearGradient scroll fades overlays, 3-column web desktop grid support, pressable preview card container, and crisp side-by-side CustomButton action triggers.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Trail } from '@/src/core/models/Trail/Trail';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';

/**
 * Interface representing the properties of the TrailCard component.
 * 
 * @param trail - Trail domain entity object.
 * @param onViewTrail - Callback handler fired when previewing trail details.
 * @param onWriteTrail - Callback handler fired when editing trail information.
 * @param onEditMapPins - Callback handler fired when editing trail map pins.
 * @param isDesktop - Flag indicating if screen layout is desktop width.
 */
interface Props {
    trail: Trail;
    onViewTrail: (id: string) => void;
    onWriteTrail: (id?: string | null) => void;
    onEditMapPins: (id: string) => void;
    isDesktop?: boolean;
}

/**
 * Modular card component for displaying Trail details and administrative action buttons.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered TrailCard.
 */
const TrailCard = ({
    trail,
    onViewTrail,
    onWriteTrail,
    onEditMapPins,
    isDesktop = false,
}: Props): React.JSX.Element => {
    const pointCount = trail.offlinePoints?.length || 0;
    const provinces = Array.isArray(trail.general?.province)
        ? trail.general.province.join(', ')
        : 'Unknown Location';
    const mountains = Array.isArray(trail.general?.mountain) && trail.general.mountain.length > 0
        ? trail.general.mountain.join(', ')
        : null;

    const isActive = trail.general?.active !== false;
    const rawClass = trail.difficulty?.classification?.toLowerCase();
    const isMajor = rawClass === 'major';
    const isMinor = rawClass === 'minor';
    const lasco = trail.difficulty?.lascoRating ?? 0;
    const distance = trail.difficulty?.length ?? 0;
    const hours = trail.difficulty?.hours ?? 0;
    const gain = trail.difficulty?.gain ?? 0;
    const masl = trail.geography?.masl ?? 0;
    const circularity = trail.difficulty?.circularity || null;

    const badgeScrollRef = useRef<ScrollView>(null);
    const { showLeftFade, showRightFade, scrollProps } = useScrollFades();
    useWebDragScroll(badgeScrollRef, true);

    return (
        <TouchableOpacity
            style={[styles.card, isDesktop && styles.cardDesktop]}
            onPress={() => onViewTrail(trail.id)}
            activeOpacity={0.9}
        >
            {/* 1. Header (Top Row with Category Accent & Symmetrical Top-Right Badges) */}
            <View style={styles.cardHeader}>
                <View style={styles.headerTopRow}>
                    <CustomText variant="label" style={styles.trailCategoryLabel}>
                        TRAIL
                    </CustomText>

                    <View style={styles.badgeGroupRight}>
                        {/* Status Tag Badge */}
                        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
                            <CustomText style={[styles.statusBadgeText, isActive ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                                {isActive ? 'Active' : 'Inactive'}
                            </CustomText>
                        </View>

                        {/* Major / Minor Classification Badge (Only rendered if present in Firestore) */}
                        {isMajor || isMinor ? (
                            <View style={[styles.classBadge, isMajor ? styles.majorClassBadge : styles.minorClassBadge]}>
                                <CustomText style={[styles.classBadgeText, isMajor ? styles.majorClassBadgeText : styles.minorClassBadgeText]}>
                                    {rawClass!.toUpperCase()}
                                </CustomText>
                            </View>
                        ) : null}

                        {/* Quick Preview Eye Icon Button */}
                        <TouchableOpacity
                            style={styles.previewIconButton}
                            onPress={() => onViewTrail(trail.id)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <CustomIcon library="Feather" name="eye" size={14} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Trail Name (Tight Title) */}
                <CustomText variant="h3" style={styles.trailName} numberOfLines={1}>
                    {trail.general?.name || 'Unnamed Trail'}
                </CustomText>

                {/* Location Subtitle (Tightly paired directly under title) */}
                <View style={styles.locationRow}>
                    <CustomIcon library="Feather" name="map-pin" size={13} color={Colors.TEXT_SECONDARY} />
                    <CustomText variant="caption" style={styles.locationText} numberOfLines={1}>
                        {provinces}{mountains ? ` • ${mountains}` : ''}
                    </CustomText>
                </View>
            </View>

            {/* 2. Divider */}
            <View style={styles.divider} />

            {/* 3. Real-Data-Only Metadata Chips Track with Scroll Fades (Matching OfferCard.tsx) */}
            <View style={styles.badgeContainer}>
                <ScrollView
                    ref={badgeScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.detailsGrid}
                    {...scrollProps}
                >
                    {/* Primary Highlight: Map Pins Badge */}
                    <View style={styles.detailRowHighlight}>
                        <CustomIcon library="Feather" name="map-pin" size={12} color={Colors.TRAIL_STATUS_ACTIVE_TEXT} />
                        <CustomText variant="caption" style={styles.detailTextHighlight}>
                            {pointCount} map pin{pointCount !== 1 ? 's' : ''}
                        </CustomText>
                    </View>

                    {/* Distance Chip */}
                    {distance > 0 ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="Feather" name="activity" size={12} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                {distance} km
                            </CustomText>
                        </View>
                    ) : null}

                    {/* Est. Duration Chip */}
                    {hours > 0 ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="Feather" name="clock" size={12} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                {hours} hrs
                            </CustomText>
                        </View>
                    ) : null}

                    {/* Elevation Gain Chip */}
                    {gain > 0 ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="Feather" name="trending-up" size={12} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                +{gain}m gain
                            </CustomText>
                        </View>
                    ) : null}

                    {/* Peak MASL Altitude Chip */}
                    {masl > 0 ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="FontAwesome5" name="mountain" size={11} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                {masl} MASL
                            </CustomText>
                        </View>
                    ) : null}

                    {/* LASCO Rating Chip */}
                    {lasco > 0 ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="Feather" name="award" size={12} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                LASCO {lasco}/9
                            </CustomText>
                        </View>
                    ) : null}

                    {/* Circularity Type Chip */}
                    {circularity ? (
                        <View style={styles.detailRow}>
                            <CustomIcon library="Feather" name="repeat" size={12} color={Colors.PRIMARY} />
                            <CustomText variant="caption" style={styles.detailText}>
                                {circularity}
                            </CustomText>
                        </View>
                    ) : null}
                </ScrollView>

                {showLeftFade && (
                    <LinearGradient
                        colors={[Colors.WHITE, Colors.WHITE_FADE_HALF, Colors.WHITE_TRANSPARENT]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.leftFade}
                        pointerEvents="none"
                    />
                )}

                {showRightFade && (
                    <LinearGradient
                        colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE_FADE_HALF, Colors.WHITE]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.rightFade}
                        pointerEvents="none"
                    />
                )}
            </View>

            {/* 4. Action Buttons Row (Crisp 2-Button Horizontal Layout: Map Pins + Edit Info) */}
            <View style={styles.buttonRow}>
                <View style={styles.actionButtonHalf}>
                    <CustomButton
                        title="Map Pins"
                        onPress={() => onEditMapPins(trail.id)}
                        variant="primary"
                        icon="map"
                        iconLibrary="Feather"
                        style={styles.actionButton}
                    />
                </View>

                <View style={styles.actionButtonHalf}>
                    <CustomButton
                        title="Edit Info"
                        onPress={() => onWriteTrail(trail.id)}
                        variant="outline"
                        icon="edit"
                        iconLibrary="Feather"
                        style={styles.actionButton}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        width: '100%',
        ...GlobalStyles.dropShadow(2),
    },
    cardDesktop: {
        width: 'calc(50% - 8px)' as unknown as number,
    },
    cardHeader: {
        width: '100%',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        minHeight: 20,
    },
    trailCategoryLabel: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
    },
    badgeGroupRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    activeBadge: {
        backgroundColor: Colors.TRAIL_STATUS_ACTIVE_BG,
        borderColor: Colors.TRAIL_STATUS_ACTIVE_BORDER,
    },
    inactiveBadge: {
        backgroundColor: Colors.TRAIL_STATUS_INACTIVE_BG,
        borderColor: Colors.TRAIL_STATUS_INACTIVE_BORDER,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    activeBadgeText: {
        color: Colors.TRAIL_STATUS_ACTIVE_TEXT,
    },
    inactiveBadgeText: {
        color: Colors.TRAIL_STATUS_INACTIVE_TEXT,
    },
    classBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    majorClassBadge: {
        backgroundColor: Colors.TRAIL_CLASSIFICATION_MAJOR_BG,
        borderColor: Colors.TRAIL_CLASSIFICATION_MAJOR_BORDER,
    },
    minorClassBadge: {
        backgroundColor: Colors.TRAIL_CLASSIFICATION_MINOR_BG,
        borderColor: Colors.TRAIL_CLASSIFICATION_MINOR_BORDER,
    },
    classBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    majorClassBadgeText: {
        color: Colors.TRAIL_CLASSIFICATION_MAJOR_TEXT,
    },
    minorClassBadgeText: {
        color: Colors.TRAIL_CLASSIFICATION_MINOR_TEXT,
    },
    previewIconButton: {
        padding: 4,
        borderRadius: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trailName: {
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    badgeContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 24,
    },
    leftFade: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    detailText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
        fontSize: 12,
    },
    detailRowHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.TRAIL_STATUS_ACTIVE_BG,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.TRAIL_STATUS_ACTIVE_BORDER,
        gap: 6,
    },
    detailTextHighlight: {
        color: Colors.TRAIL_STATUS_ACTIVE_TEXT,
        fontWeight: 'bold',
        fontSize: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
        marginTop: 4,
        width: '100%',
    },
    actionButtonHalf: {
        flex: 1,
    },
    actionButton: {
        paddingVertical: 8,
        height: '100%',
    },
});

export default TrailCard;
