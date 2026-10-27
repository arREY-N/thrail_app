import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Modal, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getPinConfig, getStaticMapAsset, IWaypointPoint, StaticTrailMap, TrailMap } from '@/src/features/Map/Map';

import { Layout } from '@/src/constants/layout';
import { ITrail, ITrailStats, computeTrailMidpoint } from '@/src/core/models/Trail/Trail';
import { GlossaryTooltip, SectionHeader, StatItem, StyledListItem, Tag } from '@/src/features/Trail/components/TrailDetailsComponents';
import { getArray, getClassColor, getDifficultyColor, getStatusColor, getStatusIconInfo, isFeatureEnabled, ROUTE_GLOSSARY } from '@/src/features/Trail/utils/TrailDetailsHelpers';

/** All static trail map PNG assets are standard 800x600 (4:3 aspect ratio) */
const MAP_ASPECT_RATIO = 800 / 600;

export interface TrailDetailsTabProps {
    stats: { distance: string | number; elevation: string | number };
    trailStats?: ITrailStats | null;
    statsLoading: boolean;
    trail?: ITrail | null;
}

interface LegacyTrail extends ITrail {
    viewpoint?: string[];
    shelter?: boolean;
    clean_water?: boolean;
    resting?: boolean;
    information_board?: boolean;
    community?: boolean;
    river?: boolean;
    lake?: boolean;
    waterfall?: boolean;
    monument?: boolean;
}

const TrailDetailsTab: React.FC<TrailDetailsTabProps> = ({ stats, trailStats, statsLoading, trail }) => {
    const insets = useSafeAreaInsets();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [activeStat, setActiveStat] = useState<string | null>(null);
    const [showRouteInfo, setShowRouteInfo] = useState(false);
    const [isMapPreviewVisible, setIsMapPreviewVisible] = useState(false);
    const [mapCardLayout, setMapCardLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const handleMapCardLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
            setMapCardLayout(prev => {
                if (prev.width === width && prev.height === height) return prev;
                return { width, height };
            });
        }
    }, []);

    const offlinePoints = useMemo(() => trail?.offlinePoints ?? [], [trail?.offlinePoints]);
    const hasOfflinePoints = offlinePoints.length > 0;

    const viewpoints = getArray<string>(trail?.tourism?.viewpoint, (trail as LegacyTrail)?.viewpoint);
    const guidelines = getArray<string>(trail?.general?.guidelines, []);
    const tips = getArray<string>(trail?.general?.safety_tips, []);
    const lguRules = getArray<string>(trail?.general?.lgu_rules, []);
    const criticalInfo = trail?.general?.critical_info || null;

    const slope = trail?.difficulty?.slope ? `${trail.difficulty.slope}%` : "--";
    const obstacles = trail?.difficulty?.obstacles ? `${trail.difficulty.obstacles}m` : "--";
    const qualityTags = getArray<string>(trail?.difficulty?.quality, []);
    const routeType = trail?.difficulty?.circularity || "Route Type";

    const hasDifficultyData = slope !== "--" || obstacles !== "--" || qualityTags.length > 0;

    const tourismFeaturesActive = isFeatureEnabled(trail?.tourism?.shelter, (trail as LegacyTrail)?.shelter) ||
        isFeatureEnabled(trail?.tourism?.clean_water, (trail as LegacyTrail)?.clean_water) ||
        isFeatureEnabled(trail?.tourism?.resting, (trail as LegacyTrail)?.resting) ||
        isFeatureEnabled(trail?.tourism?.information_board, (trail as LegacyTrail)?.information_board) ||
        isFeatureEnabled(trail?.tourism?.community, (trail as LegacyTrail)?.community) ||
        isFeatureEnabled(trail?.tourism?.river, (trail as LegacyTrail)?.river) ||
        isFeatureEnabled(trail?.tourism?.lake, (trail as LegacyTrail)?.lake) ||
        isFeatureEnabled(trail?.tourism?.waterfall, (trail as LegacyTrail)?.waterfall) ||
        isFeatureEnabled(trail?.tourism?.monument, (trail as LegacyTrail)?.monument) ||
        viewpoints.length > 0;

    const curatedDistance = (trail?.difficulty?.length !== undefined && trail?.difficulty?.length !== null && Number(trail.difficulty.length) > 0)
        ? `${trail.difficulty.length} km`
        : null;
    const computedDistance = curatedDistance
        || (trailStats ? `${(trailStats.distance / 1000).toFixed(1)} km` : null)
        || stats?.distance
        || "--";

    const curatedGain = (trail?.difficulty?.gain !== undefined && trail?.difficulty?.gain !== null && Number(trail.difficulty.gain) > 0)
        ? `${trail.difficulty.gain} m`
        : null;
    const computedGain = curatedGain
        || (trailStats ? `${Math.round(Math.max(trailStats.elevationGain, trailStats.elevationLoss))} m` : null)
        || stats?.elevation
        || "--";

    const curatedMASL = trail?.geography?.masl ? `${trail.geography.masl} MASL` : "--";
    const curatedDiff = `${trail?.difficulty?.lascoRating ?? "--"}/9`;
    const rawClass = trail?.difficulty?.classification?.toLowerCase();
    const classification = rawClass === 'minor' ? 'Minor' : rawClass === 'major' ? 'Major' : '--';

    const status = trail?.general?.active ? 'Open' : 'Closed';
    const statusIcon = getStatusIconInfo(status);

    const description = trail?.general?.description || "No description available for this trail.";
    const CHARACTER_LIMIT = 200;
    const shouldTruncate = description.length > CHARACTER_LIMIT;
    const displayedDescription = isDescriptionExpanded || !shouldTruncate
        ? description
        : `${description.substring(0, CHARACTER_LIMIT).trim()}...`;

    const trailRouteMapImage = trail?.routeMapImage;
    const trailId = trail?.id;
    const trailName = trail?.general?.name;

    const trailMidpoint = useMemo(() => computeTrailMidpoint(trail), [trail]);
    const trailLon = trailMidpoint?.longitude;
    const trailLat = trailMidpoint?.latitude;
    const hasValidCoords = Boolean(
        typeof trailLat === 'number' &&
        typeof trailLon === 'number' &&
        !isNaN(trailLat) &&
        !isNaN(trailLon) &&
        (trailLat !== 0 || trailLon !== 0)
    );

    const mountainName = Array.isArray(trail?.general?.mountain)
        ? trail.general.mountain[0]
        : (trail?.general?.mountain || trail?.general?.name);

    const routeMapImageSource = useMemo(() => {
        if (trailRouteMapImage && typeof trailRouteMapImage === 'string' && trailRouteMapImage.trim().length > 0) {
            return { uri: trailRouteMapImage };
        }
        return getStaticMapAsset(trailId || '', trailName);
    }, [trailRouteMapImage, trailId, trailName]);

    const handleStatPress = (id: string) => {
        setActiveStat(prev => prev === id ? null : id);
    };

    const isRow1Active = ['distance', 'peak', 'gain'].includes(activeStat || "");
    const isRow2Active = ['class', 'difficulty', 'status'].includes(activeStat || "");

    const renderedMiniPins = useMemo(() => {
        if (!hasOfflinePoints || mapCardLayout.width <= 0 || mapCardLayout.height <= 0) return null;

        const containerW = mapCardLayout.width;
        const containerH = mapCardLayout.height;
        const containerAspect = containerW / containerH;

        return (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {offlinePoints.map((rawPoint) => {
                    const point = rawPoint as IWaypointPoint;
                    const config = getPinConfig(point.type, point.color, point.customCategory, point.icon);

                    let percentX = point.x;
                    let percentY = point.y;

                    if (containerAspect > MAP_ASPECT_RATIO) {
                        // Container is wider than 4:3 (e.g. desktop widescreen or mobile landscape):
                        // The image fills the width and overflows/crops vertically (top and bottom).
                        const scale = containerAspect / MAP_ASPECT_RATIO;
                        percentX = point.x;
                        percentY = (point.y - 50) * scale + 50;
                    } else {
                        // Container is taller than 4:3 (e.g. narrow mobile portrait):
                        // The image fills the height and overflows/crops horizontally (left and right).
                        const scale = MAP_ASPECT_RATIO / containerAspect;
                        percentX = (point.x - 50) * scale + 50;
                        percentY = point.y;
                    }

                    // If point falls completely outside the cropped viewport boundary, skip rendering
                    if (percentX < -5 || percentX > 105 || percentY < -5 || percentY > 105) {
                        return null;
                    }

                    return (
                        <View
                            key={`thumb-pin-${point.id}`}
                            style={[
                                styles.miniPinWrapper,
                                { left: `${percentX}%`, top: `${percentY}%` },
                            ]}
                        >
                            <View style={[styles.miniPinDot, { backgroundColor: config.color }]}>
                                <CustomIcon
                                    library="Feather"
                                    name={config.icon}
                                    size={8}
                                    color={Colors.WHITE}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    }, [hasOfflinePoints, offlinePoints, mapCardLayout.width, mapCardLayout.height]);

    return (
        <View style={styles.tabContent}>

            {/* 2. Stats Dashboard */}
            {statsLoading && !curatedDistance && !curatedGain ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                    <CustomText variant="caption" style={styles.loadingText}>Synchronizing trail data...</CustomText>
                </View>
            ) : (
                <View style={styles.statsCard}>
                    <View style={styles.statsRow}>
                        <StatItem id="distance" iconLib="MaterialCommunityIcons" icon="ruler" label="DISTANCE" value={computedDistance} color={Colors.TRAIL_STATS_YELLOW} isActive={activeStat === 'distance'} onPress={handleStatPress} />
                        <StatItem id="peak" iconLib="FontAwesome6" icon="mountain" label="PEAK" value={curatedMASL} color={Colors.TRAIL_STATS_GREEN} isActive={activeStat === 'peak'} onPress={handleStatPress} />
                        <StatItem id="gain" iconLib="MaterialCommunityIcons" icon="trending-up" label="ELEV. GAIN" value={computedGain} color={Colors.TRAIL_STATS_ORANGE} isActive={activeStat === 'gain'} onPress={handleStatPress} />
                    </View>
                    {isRow1Active && <GlossaryTooltip activeStat={activeStat} trail={trail} />}
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                        <StatItem id="class" iconLib="FontAwesome5" icon="book-open" label="CLASS" value={classification} color={getClassColor(classification)} isActive={activeStat === 'class'} onPress={handleStatPress} />
                        <StatItem id="difficulty" iconLib="MaterialCommunityIcons" icon="dumbbell" label="DIFFICULTY" value={curatedDiff} color={getDifficultyColor(curatedDiff)} isActive={activeStat === 'difficulty'} onPress={handleStatPress} />
                        <StatItem id="status" iconLib={statusIcon.lib as import('@/src/types/ui.types').IconLibrary} icon={statusIcon.name} label="STATUS" value={status} color={getStatusColor(status)} isActive={activeStat === 'status'} onPress={handleStatPress} />
                    </View>
                    {isRow2Active && <GlossaryTooltip activeStat={activeStat} trail={trail} />}
                </View>
            )}

            {/* 1. Critical Info */}
            {criticalInfo && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="alert-triangle" title="Critical Trail Info" color={Colors.ERROR}/>
                    <View style={styles.aboutCard}>
                        <CustomText style={styles.descriptionText}>{criticalInfo}</CustomText>
                        {shouldTruncate && (
                            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)} style={styles.readMoreButton} activeOpacity={0.7}>
                                <CustomText style={styles.readMoreText}>{isDescriptionExpanded ? "Read Less" : "Read More"}</CustomText>
                                <CustomIcon library="Feather" name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                // <View style={styles.criticalCard}>
                //     <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.ERROR} />
                //     <View style={styles.criticalTextContainer}>
                //         <CustomText style={styles.criticalTitle}>Critical Trail Update</CustomText>
                //         <CustomText style={styles.criticalText}>{criticalInfo}</CustomText>
                //     </View>
                // </View>
            )}

            {/* 3. About the Mountain */}
            <View style={styles.section}>
                <SectionHeader iconLib="FontAwesome6" iconName="mountain" title="About the Mountain" />
                <View style={styles.aboutCard}>
                    <CustomText style={styles.descriptionText}>{displayedDescription}</CustomText>
                    {shouldTruncate && (
                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)} style={styles.readMoreButton} activeOpacity={0.7}>
                            <CustomText style={styles.readMoreText}>{isDescriptionExpanded ? "Read Less" : "Read More"}</CustomText>
                            <CustomIcon library="Feather" name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 4. Trail Conditions & Terrain */}
            {hasDifficultyData && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Ionicons" iconName="analytics-outline" title="Trail Conditions & Terrain" />
                    <View style={styles.difficultyDashboard}>
                        <View style={styles.diffMetricsContainer}>
                            {slope !== "--" && (
                                <View style={styles.diffWidget}>
                                    <View style={[styles.diffIconWrapper, { backgroundColor: Colors.TRAIL_STATS_ORANGE + '15' }]}>
                                        <CustomIcon library="MaterialCommunityIcons" name="slope-uphill" size={24} color={Colors.TRAIL_STATS_ORANGE} />
                                    </View>
                                    <View style={styles.diffTextContent}>
                                        <CustomText style={styles.diffWidgetValue}>{slope}</CustomText>
                                        <CustomText style={styles.diffWidgetLabel}>Steepness</CustomText>
                                    </View>
                                </View>
                            )}
                            {slope !== "--" && obstacles !== "--" && <View style={styles.diffVerticalDivider} />}
                            {obstacles !== "--" && (
                                <View style={styles.diffWidget}>
                                    <View style={[styles.diffIconWrapper, { backgroundColor: Colors.TRAIL_STATS_BLUE + '15' }]}>
                                        <CustomIcon library="MaterialCommunityIcons" name="kettlebell" size={24} color={Colors.TRAIL_STATS_BLUE} />
                                    </View>
                                    <View style={styles.diffTextContent}>
                                        <CustomText style={styles.diffWidgetValue}>{obstacles}</CustomText>
                                        <CustomText style={styles.diffWidgetLabel}>Max Obstacle</CustomText>
                                    </View>
                                </View>
                            )}
                        </View>
                        {qualityTags.length > 0 && (
                            <View style={styles.terrainConditionsWrapper}>
                                <CustomText style={styles.diffTerrainLabel}>Surface Types:</CustomText>
                                <View style={styles.qualityTagsRow}>
                                    {qualityTags.map((q, i) => (
                                        <View key={i} style={styles.qualityPill}>
                                            <CustomIcon library="Feather" name="hash" size={12} color={Colors.PRIMARY} style={{ marginRight: 4 }} />
                                            <CustomText style={styles.qualityPillText}>{q}</CustomText>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* 5. Amenities & Facilities */}
            {tourismFeaturesActive && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="archive" title="Amenities & Facilities" />
                    <View style={styles.tagContainer}>
                        {isFeatureEnabled(trail?.tourism?.shelter, (trail as LegacyTrail)?.shelter) && <Tag label="Shelter" />}
                        {isFeatureEnabled(trail?.tourism?.clean_water, (trail as LegacyTrail)?.clean_water) && <Tag label="Drinking Water" />}
                        {isFeatureEnabled(trail?.tourism?.resting, (trail as LegacyTrail)?.resting) && <Tag label="Resting Area" />}
                        {isFeatureEnabled(trail?.tourism?.information_board, (trail as LegacyTrail)?.information_board) && <Tag label="Info Board" />}
                        {isFeatureEnabled(trail?.tourism?.community, (trail as LegacyTrail)?.community) && <Tag label="Community" />}
                        {isFeatureEnabled(trail?.tourism?.river, (trail as LegacyTrail)?.river) && <Tag label="River" />}
                        {isFeatureEnabled(trail?.tourism?.lake, (trail as LegacyTrail)?.lake) && <Tag label="Lake" />}
                        {isFeatureEnabled(trail?.tourism?.waterfall, (trail as LegacyTrail)?.waterfall) && <Tag label="Waterfall" />}
                        {isFeatureEnabled(trail?.tourism?.monument, (trail as LegacyTrail)?.monument) && <Tag label="Monument" />}
                        {viewpoints?.map((vp, index) => <Tag key={`vp-${index}`} label={vp} />)}
                    </View>
                </View>
            )}

            {/* 6. Trail Route Section */}
            <View style={styles.section}>
                <SectionHeader iconLib="Feather" iconName="map" title="Trail Route Map" />
                <View style={styles.mapCard}>
                    {/* Live Vector Map rendered to trail's coordinate location when preview modal is not active */}
                    {hasValidCoords && !isMapPreviewVisible ? (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <TrailMap
                                initialLon={trailLon}
                                initialLat={trailLat}
                                geoJsonPath={trail?.geography?.geoJsonPath}
                                mountainId={mountainName}
                                showControls={false}
                                showRecenter={false}
                                bottomInset={0}
                            />
                        </View>
                    ) : (
                        /* Fallback to static image when coordinates are not available or modal is open */
                        <CustomImage
                            source={routeMapImageSource}
                            style={styles.mapImage}
                            resizeMode="cover"
                        />
                    )}

                    <View style={styles.mapDarkenOverlay} pointerEvents="none" />

                    {/* Mini Waypoint Pins Rendered on Route Thumbnail Card only when static image fallback is active */}
                    {(!hasValidCoords || isMapPreviewVisible) && renderedMiniPins}

                    <TouchableOpacity
                        style={styles.mapCardTouch}
                        activeOpacity={0.85}
                        onPress={() => setIsMapPreviewVisible(true)}
                        onLayout={handleMapCardLayout}
                    >
                        <View style={styles.mapLabelsRow}>
                            <TouchableOpacity style={styles.mapRouteLabel} onPress={(e) => { e.stopPropagation(); setShowRouteInfo(!showRouteInfo); }} activeOpacity={0.8}>
                                <CustomIcon library="Feather" name="repeat" size={13} color={Colors.WHITE} />
                                <CustomText variant="caption" style={styles.mapBadgeText}>{routeType}</CustomText>
                                <CustomIcon library="Feather" name={showRouteInfo ? "chevron-up" : "chevron-down"} size={13} color={Colors.WHITE} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mapOverlay}>
                            <CustomText variant="caption" style={styles.mapBadgeText}>Tap to Explore Route Map</CustomText>
                            <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.WHITE} style={{ marginLeft: 6 }} />
                        </View>

                        {showRouteInfo && (
                            <View style={styles.routeInfoOverlay}>
                                <CustomText style={styles.routeInfoTitle}>What is a {routeType} route?</CustomText>
                                <CustomText style={styles.routeInfoText}>{ROUTE_GLOSSARY[routeType] || "This describes the layout pattern of the trail."}</CustomText>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* 7. LGU Rules */}
            {lguRules.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="file-text" title="LGU Ordinances" color={Colors.TRAIL_LGU_ICON} />
                    <View style={styles.rulesCard}>
                        {lguRules.map((rule, index) => (
                            <React.Fragment key={`lgu-${index}`}>
                                <StyledListItem text={rule} index={index} type="lgu" />
                                {index < lguRules.length - 1 && <View style={styles.ruleDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            )}

            {/* 8. Rules of the Trail */}
            {guidelines.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="check-square" title="Rules of the Trail" />
                    <View style={styles.rulesCard}>
                        {guidelines.map((guide, index) => (
                            <React.Fragment key={`guide-${index}`}>
                                <StyledListItem text={guide} index={index} type="guide" />
                                {index < guidelines.length - 1 && <View style={styles.ruleDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            )}

            {/* 9. Safety Section */}
            {tips.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="shield" title="Keep Safe" color={Colors.TRAIL_SAFETY_ICON} />
                    <View style={styles.rulesCard}>
                        {tips.map((tip, index) => (
                            <React.Fragment key={`tip-${index}`}>
                                <StyledListItem text={tip} index={index} type="safety" />
                                {index < tips.length - 1 && <View style={styles.ruleDivider} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            )}

            {/* Interactive Trail Route Map Viewer Modal (Translucent Dark Theme) - Lazy Mounted */}
            {isMapPreviewVisible && (
                <Modal
                    visible={isMapPreviewVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                        setIsMapPreviewVisible(false);
                    }}
                >
                    <StatusBar barStyle="light-content" backgroundColor="transparent" />
                <View style={[styles.modalRootContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    {/* Dark Translucent Frosted Header */}
                    <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top + 10, 16) }]}>
                        <View style={styles.modalHeaderSpacer} />
                        <View style={styles.modalHeaderInfo}>
                            <CustomText variant="subtitle" style={styles.modalTitle}>
                                {trail?.general?.name || "Trail Route Map"}
                            </CustomText>
                            <CustomText variant="caption" style={styles.modalSubtitle}>
                                Interactive Route Map
                            </CustomText>
                        </View>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setIsMapPreviewVisible(false);
                            }}
                            activeOpacity={0.7}
                            accessibilityLabel="Close Map Viewer"
                            accessibilityRole="button"
                        >
                            <CustomIcon library="Feather" name="x" size={20} color={Colors.WHITE} />
                        </TouchableOpacity>
                    </View>

                    {/* Main Modal Viewport - Terrain Map */}
                    <View style={styles.modalMapWrapper}>
                        {hasValidCoords ? (
                            <TrailMap
                                initialLon={trailLon}
                                initialLat={trailLat}
                                geoJsonPath={trail?.geography?.geoJsonPath}
                                mountainId={mountainName}
                                showControls={true}
                                showRecenter={true}
                                bottomInset={Math.max(insets.bottom, 16)}
                            />
                        ) : (
                            <StaticTrailMap
                                trailId={trail?.id || ''}
                                trailName={trail?.general?.name}
                                offlinePoints={offlinePoints}
                                isEditable={false}
                                suppressDetailsModal={true}
                                routeMapImage={trail?.routeMapImage || undefined}
                                theme="dark"
                            />
                        )}
                    </View>
                </View>
            </Modal>
        )}

        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 24,
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center'
    },
    section: { marginBottom: 4 },
    statsCard: { backgroundColor: Colors.WHITE, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, gap: 24, ...GlobalStyles.dropShadow(3) },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', zIndex: 2 },
    divider: { height: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, marginHorizontal: 16, marginVertical: 4 },
    aboutCard: { backgroundColor: Colors.WHITE, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...GlobalStyles.dropShadow(3) },
    descriptionText: { color: Colors.TEXT_SECONDARY, lineHeight: 26, fontSize: 15, textAlign: 'justify', letterSpacing: 0.2 },
    readMoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.GRAY_ULTRALIGHT, gap: 4 },
    readMoreText: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 14 },
    difficultyDashboard: { backgroundColor: Colors.WHITE, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...GlobalStyles.dropShadow(3) },
    diffMetricsContainer: { flexDirection: 'row', padding: 20 },
    diffWidget: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    diffIconWrapper: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    diffTextContent: { flex: 1, justifyContent: 'center' },
    diffWidgetValue: { fontSize: 22, fontWeight: '900', color: Colors.TEXT_PRIMARY, marginBottom: 2 },
    diffWidgetLabel: { fontSize: 11, color: Colors.TEXT_SECONDARY, fontWeight: '700', textTransform: 'uppercase' },
    diffVerticalDivider: { width: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, marginHorizontal: 16 },
    terrainConditionsWrapper: { padding: 20, paddingTop: 16, borderTopWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, backgroundColor: Colors.BACKGROUND, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    diffTerrainLabel: { fontSize: 13, fontWeight: 'bold', color: Colors.TEXT_PRIMARY, marginBottom: 10 },
    qualityTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    qualityPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.WHITE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    qualityPillText: { fontSize: 13, color: Colors.TEXT_PRIMARY, fontWeight: '600' },
    criticalCard: { flexDirection: 'row', backgroundColor: Colors.ERROR_BG, borderWidth: 1, borderColor: Colors.ERROR_BORDER, padding: 16, borderRadius: 16, gap: 12, alignItems: 'flex-start' },
    criticalTextContainer: { flex: 1 },
    criticalTitle: { fontWeight: 'bold', color: Colors.ERROR, marginBottom: 4 },
    criticalText: { color: Colors.TEXT_PRIMARY, fontSize: 14, lineHeight: 20 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mapCard: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...GlobalStyles.dropShadow(3), backgroundColor: Colors.GRAY_ULTRALIGHT, position: 'relative' },
    mapCardTouch: { flex: 1, position: 'relative' },
    mapImage: { width: '100%', height: '100%' },
    mapDarkenOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.05)' },
    miniPinWrapper: { position: 'absolute', transform: [{ translateX: -8 }, { translateY: -8 }], zIndex: 1 },
    miniPinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.WHITE, alignItems: 'center', justifyContent: 'center', ...GlobalStyles.dropShadow(2) },
    mapLabelsRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
    mapRouteLabel: { backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    mapOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    mapBadgeText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 12 },
    routeInfoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: 24, justifyContent: 'center', zIndex: 1 },
    routeInfoTitle: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
    routeInfoText: { color: Colors.GRAY_LIGHT, fontSize: 14, lineHeight: 22 },
    modalRootContainer: { flex: 1, backgroundColor: Colors.MAP_MODAL_BACKDROP },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'rgba(10, 10, 10, 0.98)', borderBottomWidth: 1, borderBottomColor: Colors.MAP_CARD_BORDER, ...GlobalStyles.dropShadow(3), zIndex: 5 },
    modalHeaderSpacer: { width: 36, height: 36 },
    modalHeaderInfo: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.WHITE, textAlign: 'center', marginBottom: 0 },
    modalSubtitle: { fontSize: 12, color: Colors.GRAY_LIGHT, marginTop: 2, textAlign: 'center' },
    modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center' },
    modalMapWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },
    rulesCard: {
        backgroundColor: Colors.WHITE,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    ruleDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
    loadingText: { color: Colors.TEXT_SECONDARY },
});

export default TrailDetailsTab;