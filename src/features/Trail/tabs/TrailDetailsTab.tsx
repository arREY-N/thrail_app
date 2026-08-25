import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

import { ITrail, ITrailStats } from '@/src/core/models/Trail/Trail.types';
import { GlossaryTooltip, SectionHeader, StatItem, StyledListItem, Tag } from '@/src/features/Trail/components/TrailDetailsComponents';
import { ROUTE_GLOSSARY, getArray, getClassColor, getDifficultyColor, getStatusColor, getStatusIconInfo, isFeatureEnabled } from '@/src/features/Trail/utils/TrailDetailsHelpers';

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
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [activeStat, setActiveStat] = useState<string | null>(null);
    const [showRouteInfo, setShowRouteInfo] = useState(false);
    const [isMapPreviewVisible, setIsMapPreviewVisible] = useState(false);

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

    const computedDistance = trailStats ? `${(trailStats.distance / 1000).toFixed(1)} km` : stats?.distance || "--";
    const computedGain = trailStats ? `${Math.round(Math.max(trailStats.elevationGain, trailStats.elevationLoss))} m` : stats?.elevation || "--";
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

    const officialPlaceholder = require('@/src/assets/images/Mt.Tagapo.jpg');
    const routeMapImageSource = trail?.routeMapImage ? { uri: trail.routeMapImage } : officialPlaceholder;

    const handleStatPress = (id: string) => {
        setActiveStat(prev => prev === id ? null : id); 
    };

    const isRow1Active = ['distance', 'peak', 'gain'].includes(activeStat || "");
    const isRow2Active = ['class', 'difficulty', 'status'].includes(activeStat || "");

    return (
        <View style={styles.tabContent}>
            
            {/* 1. Critical Info */}
            {criticalInfo && (
                <View style={styles.criticalCard}>
                    <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.ERROR} />
                    <View style={styles.criticalTextContainer}>
                        <CustomText style={styles.criticalTitle}>Critical Trail Update</CustomText>
                        <CustomText style={styles.criticalText}>{criticalInfo}</CustomText>
                    </View>
                </View>
            )}

            {/* 2. Stats Dashboard */}
            {statsLoading ? (
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
                                            <CustomIcon library="Feather" name="hash" size={12} color={Colors.PRIMARY} style={{marginRight: 4}} />
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
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={() => setIsMapPreviewVisible(true)}>
                        <CustomImage 
                            source={routeMapImageSource} 
                            style={styles.mapImage}
                            resizeMode="cover"
                        />
                        <View style={styles.mapDarkenOverlay} />
                        <TouchableOpacity style={styles.mapRouteLabel} onPress={(e) => { e.stopPropagation(); setShowRouteInfo(!showRouteInfo); }} activeOpacity={0.8}>
                            <CustomIcon library="Feather" name="repeat" size={14} color={Colors.WHITE} />
                            <CustomText variant="caption" style={styles.mapRouteText}>{routeType}</CustomText>
                            <CustomIcon library="Feather" name={showRouteInfo ? "chevron-up" : "chevron-down"} size={14} color={Colors.WHITE} />
                        </TouchableOpacity>

                        <View style={styles.mapOverlay}>
                            <CustomText variant="caption" style={styles.mapOverlayText}>Tap to Expand</CustomText>
                            <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.WHITE} style={{marginLeft: 6}} />
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
                    <View style={styles.listWrapper}>
                        {lguRules.map((rule, index) => <StyledListItem key={`lgu-${index}`} text={rule} index={index} type="lgu" />)}
                    </View>
                </View>
            )}

            {/* 8. Rules of the Trail */}
            {guidelines.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="check-square" title="Rules of the Trail" />
                    <View style={styles.listWrapper}>
                        {guidelines.map((guide, index) => <StyledListItem key={`guide-${index}`} text={guide} index={index} type="guide" />)}
                    </View>
                </View>
            )}

            {/* 9. Safety Section */}
            {tips.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="shield" title="Keep Safe" color={Colors.TRAIL_SAFETY_ICON} />
                    <View style={styles.listWrapper}>
                        {tips.map((tip, index) => <StyledListItem key={`tip-${index}`} text={tip} index={index} type="safety" />)}
                    </View>
                </View>
            )}

            <ImagePreviewModal 
                visible={isMapPreviewVisible} 
                imageUrl={routeMapImageSource as any} 
                onClose={() => setIsMapPreviewVisible(false)}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: { gap: 28, paddingBottom: 20, width: '100%', maxWidth: 860, alignSelf: 'center' },
    section: { marginBottom: 4 },
    statsCard: { backgroundColor: Colors.WHITE, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, gap: 16, ...GlobalStyles.dropShadow(3) },
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
    mapCard: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, ...GlobalStyles.dropShadow(3), backgroundColor: '#EFEFEF', position: 'relative' },
    mapImage: { width: '100%', height: '100%' },
    mapDarkenOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.05)' },
    mapRouteLabel: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 2 },
    mapRouteText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 12 },
    mapOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    mapOverlayText: { color: Colors.WHITE, fontWeight: 'bold' },
    routeInfoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: 24, justifyContent: 'center', zIndex: 1 },
    routeInfoTitle: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
    routeInfoText: { color: Colors.GRAY_LIGHT, fontSize: 14, lineHeight: 22 },
    listWrapper: { gap: 12 },
    loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
    loadingText: { color: Colors.TEXT_SECONDARY },
});

export default TrailDetailsTab;