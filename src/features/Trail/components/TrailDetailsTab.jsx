import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const dropShadow = Platform.select({
    ios: { shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
    android: { elevation: 3 },
    web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' }
});

const STAT_GLOSSARY = {
    distance: { 
        title: "Distance", 
        points: [
            { label: "Total Length", text: "The full distance of the trail." }
        ], col: 0 
    },
    peak: { 
        title: "Peak (MASL)", 
        points: [
            { label: "MASL", text: "Meters Above Sea Level." },
            { label: "Summit", text: "The highest elevation point you will reach." }
        ], col: 1 
    },
    gain: { 
        title: "Elevation Gain", 
        points: [
            { label: "Ascent", text: "The total upward climb in meters." },
            { label: "Impact", text: "Higher gain means a steeper, more strenuous hike." }
        ], col: 2 
    },
    class: { 
        title: "Classification", 
        points: [
            { label: "Minor", text: "Easier day-hikes suitable for beginners." },
            { label: "Major", text: "Requires high endurance, prep, and multi-day trekking." }
        ], col: 0 
    },
    difficulty: { 
        title: "Difficulty (1-9)", 
        points: [
            { label: "1-2", text: "Beginner Friendly" },
            { label: "3-5", text: "Moderate / Intermediate" },
            { label: "6-7", text: "Hard / Steep Terrain" },
            { label: "8-9", text: "Extreme / Technical" }
        ], col: 1 
    },
    status: { 
        title: "Trail Status", 
        points: [
            { label: "Open", text: "Ready for visitors." },
            { label: "Closed", text: "Temporarily restricted by authorities." }
        ], col: 2 
    }
};

const ROUTE_GLOSSARY = {
    "Out and Back": "You will hike to the destination and return using the exact same path.",
    "Out-and-Back": "You will hike to the destination and return using the exact same path.",
    "Point-to-Point": "The hike starts at one location and ends at a completely different location.",
    "Circular": "The trail forms a loop, returning to the start without repeating the exact same path.",
    "Loop": "The trail forms a loop, returning to the start without repeating the exact same path.",
    "Traverse": "Traveling across a slope or ridge from side to side rather than going straight up or down"
};

const getClassColor = (classification) => {
    if (!classification) return Colors.TRAIL_STATS_GRAY;
    return classification.toLowerCase() === 'minor' ? Colors.TRAIL_STATS_GRAY : Colors.TRAIL_STATS_RED;
};

const getDifficultyColor = (diffString) => {
    if (!diffString || diffString === "--/9") return Colors.TRAIL_STATS_GRAY;
    const val = parseInt(diffString.split('/')[0]);
    if (val <= 2) return Colors.TRAIL_STATS_GREEN;
    if (val <= 5) return Colors.TRAIL_STATS_BLUE;
    if (val <= 7) return Colors.TRAIL_STATS_YELLOW;
    return Colors.TRAIL_STATS_RED;
};

const getStatusColor = (status) => {
    if (!status) return Colors.TRAIL_STATS_GRAY;
    return status.toLowerCase() === 'open' ? Colors.TRAIL_STATS_GREEN : Colors.TRAIL_STATS_RED;
};

const getStatusIconInfo = (status) => {
    if (!status) return { lib: "FontAwesome5", name: "minus-circle" };
    return status.toLowerCase() === 'open' 
        ? { lib: "FontAwesome5", name: "walking" } 
        : { lib: "FontAwesome5", name: "ban" };
};

const isFeatureEnabled = (nestedValue, flatValue) => {
    if (nestedValue === true || String(nestedValue).toLowerCase() === 'true') return true;
    if (flatValue === true || String(flatValue).toLowerCase() === 'true') return true;
    return false;
};

const getArray = (nestedValue, flatValue) => {
    if (Array.isArray(nestedValue) && nestedValue.length > 0) return nestedValue;
    if (Array.isArray(flatValue) && flatValue.length > 0) return flatValue;
    return [];
};

const getFeatureIcon = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('shelter')) return { library: 'MaterialCommunityIcons', name: 'tent' };
    if (lower.includes('rest')) return { library: 'FontAwesome5', name: 'wheelchair' }; 
    if (lower.includes('info')) return { library: 'Feather', name: 'info' };
    if (lower.includes('water') || lower.includes('drink') || lower.includes('lake') || lower.includes('fall')) return { library: 'Ionicons', name: 'water' };
    if (lower.includes('river')) return { library: 'MaterialCommunityIcons', name: 'waves' };
    if (lower.includes('monument')) return { library: 'FontAwesome6', name: 'monument' };
    if (lower.includes('community')) return { library: 'FontAwesome5', name: 'users' };
    if (lower.includes('scenic') || lower.includes('view') || lower.includes('hill')) return { library: 'FontAwesome6', name: 'mountain' };
    return { library: 'Feather', name: 'check-circle' }; 
};

const Tag = ({ label }) => {
    const iconData = getFeatureIcon(label);
    return (
        <View style={styles.tag}>
            <View style={styles.tagIcon}>
                <CustomIcon library={iconData.library} name={iconData.name} size={14} color={Colors.TRAIL_TAG_TEXT} />
            </View>
            <CustomText variant="caption" style={styles.tagText}>
                {label}
            </CustomText>
        </View>
    );
};

const StatItem = ({ id, iconLib, icon, label, value, color, isActive, onPress }) => (
    <TouchableOpacity 
        style={[styles.statItem, isActive && styles.statItemActive]} 
        onPress={() => onPress(id)}
        activeOpacity={0.6}
    >
        <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
            <CustomIcon library={iconLib} name={icon} size={20} color={color} />
        </View>
        <CustomText variant="body" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</CustomText>
        <CustomText variant="caption" style={styles.statLabel}>{label}</CustomText>
    </TouchableOpacity>
);

const StyledListItem = ({ text, index, type }) => {
    let bgStyle, borderStyle, bulletBg, bulletText;

    if (type === 'safety') {
        bgStyle = { backgroundColor: Colors.TRAIL_SAFETY_BG };
        borderStyle = { borderColor: Colors.TRAIL_SAFETY_BORDER };
        bulletBg = { backgroundColor: Colors.TRAIL_SAFETY_BULLET_BG };
        bulletText = { color: Colors.TRAIL_SAFETY_BULLET_TEXT };
    } else if (type === 'lgu') {
        bgStyle = { backgroundColor: Colors.STATUS_PENDING_BG };
        borderStyle = { borderColor: Colors.STATUS_PENDING_BORDER };
        bulletBg = { backgroundColor: Colors.BLUE + '20' };
        bulletText = { color: Colors.BLUE };
    } else { // guide
        bgStyle = { backgroundColor: Colors.TRAIL_RULES_BG };
        borderStyle = { borderColor: Colors.TRAIL_RULES_BORDER };
        bulletBg = { backgroundColor: Colors.TRAIL_RULES_BULLET_BG };
        bulletText = { color: Colors.TRAIL_RULES_BULLET_TEXT };
    }

    return (
        <View style={[styles.listItemContainer, bgStyle, borderStyle]}>
            <View style={[styles.listBullet, bulletBg]}>
                <CustomText style={[styles.listBulletText, bulletText]}>{index + 1}</CustomText>
            </View>
            <CustomText style={styles.listText}>{text}</CustomText>
        </View>
    );
};

const GlossaryTooltip = ({ activeStat }) => {
    if (!activeStat) return null;
    
    const data = STAT_GLOSSARY[activeStat];
    let pointerPosition = { left: '50%', marginLeft: -8 }; 
    if (data.col === 0) pointerPosition = { left: '16.6%', marginLeft: -8 };
    if (data.col === 2) pointerPosition = { left: '83.3%', marginLeft: -8 };

    return (
        <View style={styles.tooltipWrapper}>
            <View style={[styles.tooltipPointer, pointerPosition]} />
            <View style={styles.tooltipBody}>
                <CustomText variant="label" style={styles.tooltipTitle}>{data.title}</CustomText>
                
                {data.points.map((point, i) => (
                    <View key={i} style={styles.tooltipPointRow}>
                        <CustomText style={styles.tooltipPointLabel}>{point.label}: </CustomText>
                        <CustomText style={styles.tooltipPointText}>{point.text}</CustomText>
                    </View>
                ))}
            </View>
        </View>
    );
};

const SectionHeader = ({ iconLib, iconName, title, color = Colors.PRIMARY }) => (
    <View style={styles.sectionHeader}>
        <CustomIcon library={iconLib} name={iconName} size={20} color={color} />
        <CustomText variant="h3" style={styles.sectionTitle}>{title}</CustomText>
    </View>
);

const TrailDetailsTab = ({ stats, trailStats, statsLoading, trail }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [activeStat, setActiveStat] = useState(null);
    const [showRouteInfo, setShowRouteInfo] = useState(false);

    const viewpoints = getArray(trail?.tourism?.viewpoint, trail?.viewpoint);
    const guidelines = getArray(trail?.general?.guidelines, []);
    const tips = getArray(trail?.general?.safety_tips, []);
    const lguRules = getArray(trail?.general?.lgu_rules, []);
    const criticalInfo = trail?.general?.critical_info || null; 
    
    const slope = trail?.difficulty?.slope ? `${trail.difficulty.slope}%` : "--";
    const obstacles = trail?.difficulty?.obstacles ? `${trail.difficulty.obstacles}m` : "--";
    const qualityTags = getArray(trail?.difficulty?.quality, []);
    const routeType = trail?.difficulty?.circularity || "Route Type";

    const hasDifficultyData = slope !== "--" || obstacles !== "--" || qualityTags.length > 0;
    
    const tourismFeaturesActive = isFeatureEnabled(trail?.tourism?.shelter, trail?.shelter) ||
        isFeatureEnabled(trail?.tourism?.clean_water, trail?.clean_water) ||
        isFeatureEnabled(trail?.tourism?.resting, trail?.resting) ||
        isFeatureEnabled(trail?.tourism?.information_board, trail?.information_board) ||
        isFeatureEnabled(trail?.tourism?.community, trail?.community) ||
        isFeatureEnabled(trail?.tourism?.river, trail?.river) ||
        isFeatureEnabled(trail?.tourism?.lake, trail?.lake) ||
        isFeatureEnabled(trail?.tourism?.waterfall, trail?.waterfall) ||
        isFeatureEnabled(trail?.tourism?.monument, trail?.monument) ||
        viewpoints.length > 0;

    const computedDistance = trailStats ? `${(trailStats.distance / 1000).toFixed(1)} km` : stats.distance;
    const computedGain = trailStats ? `${Math.round(Math.max(trailStats.elevationGain, trailStats.elevationLoss))} m` : stats.elevation;
    const curatedMASL = trail?.geography?.masl ? `${trail.geography.masl} MASL` : "--";
    const curatedDiff = `${trail?.difficulty?.lascoRating ?? "--"}/9`;
    const classification = trail?.difficulty?.classification === 'minor' ? 'Minor' : 'Major';
    
    const status = trail?.general?.active ? 'Open' : 'Closed';
    const statusIcon = getStatusIconInfo(status);
    
    const description = trail?.general?.description || "No description available for this trail.";
    const CHARACTER_LIMIT = 200;
    const shouldTruncate = description.length > CHARACTER_LIMIT;
    const displayedDescription = isDescriptionExpanded || !shouldTruncate 
        ? description 
        : `${description.substring(0, CHARACTER_LIMIT).trim()}...`;

    const handleStatPress = (id) => {
        setActiveStat(prev => prev === id ? null : id); 
    };

    const isRow1Active = ['distance', 'peak', 'gain'].includes(activeStat);
    const isRow2Active = ['class', 'difficulty', 'status'].includes(activeStat);

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
                        <StatItem id="gain" iconLib="MaterialCommunityIcons" icon="trending-up" label="ELEV. GAIN" value={computedGain} color={Colors.TRAIL_STATS_GREEN} isActive={activeStat === 'gain'} onPress={handleStatPress} />
                    </View>
                    
                    {isRow1Active && <GlossaryTooltip activeStat={activeStat} />}

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <StatItem id="class" iconLib="FontAwesome5" icon="book-open" label="CLASS" value={classification} color={getClassColor(classification)} isActive={activeStat === 'class'} onPress={handleStatPress} />
                        <StatItem id="difficulty" iconLib="Ionicons" icon="barbell" label="DIFFICULTY" value={curatedDiff} color={getDifficultyColor(curatedDiff)} isActive={activeStat === 'difficulty'} onPress={handleStatPress} />
                        <StatItem id="status" iconLib={statusIcon.lib} icon={statusIcon.name} label="STATUS" value={status} color={getStatusColor(status)} isActive={activeStat === 'status'} onPress={handleStatPress} />
                    </View>

                    {isRow2Active && <GlossaryTooltip activeStat={activeStat} />}
                </View>
            )}

            {/* 3. About the Mountain */}
            <View style={styles.section}>
                <SectionHeader iconLib="Feather" iconName="book-open" title="About the Mountain" />
                <View style={styles.aboutCard}>
                    <CustomText style={styles.descriptionText}>
                        {displayedDescription}
                    </CustomText>
                    {shouldTruncate && (
                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)} style={styles.readMoreButton} activeOpacity={0.7}>
                            <CustomText style={styles.readMoreText}>
                                {isDescriptionExpanded ? "Read Less" : "Read More"}
                            </CustomText>
                            <CustomIcon library="Feather" name={isDescriptionExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 4. About the Difficulty */}
            {hasDifficultyData && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Ionicons" iconName="analytics-outline" title="About the Difficulty" />
                    <View style={styles.aboutDifficultyCard}>
                        
                        <View style={styles.diffMetricsRow}>
                            {slope !== "--" && (
                                <View style={styles.diffMetricBox}>
                                    <CustomText style={styles.diffMetricValue}>{slope}</CustomText>
                                    <CustomText style={styles.diffMetricLabel}>Steepness</CustomText>
                                </View>
                            )}
                            {obstacles !== "--" && (
                                <View style={styles.diffMetricBox}>
                                    <CustomText style={styles.diffMetricValue}>{obstacles}</CustomText>
                                    <CustomText style={styles.diffMetricLabel}>Max Obstacle</CustomText>
                                </View>
                            )}
                        </View>

                        {qualityTags.length > 0 && (
                            <>
                                <CustomText style={styles.diffTerrainLabel}>Terrain Conditions:</CustomText>
                                <View style={styles.qualityTagsRow}>
                                    {qualityTags.map((q, i) => (
                                        <View key={i} style={styles.qualityPill}>
                                            <CustomText style={styles.qualityPillText}>{q}</CustomText>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* 5. What to Expect Here */}
            {tourismFeaturesActive && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="archive" title="What to Expect Here" />
                    <View style={styles.tagContainer}>
                        {isFeatureEnabled(trail?.tourism?.shelter, trail?.shelter) && <Tag label="Shelter" />}
                        {isFeatureEnabled(trail?.tourism?.clean_water, trail?.clean_water) && <Tag label="Drinking Water" />}
                        {isFeatureEnabled(trail?.tourism?.resting, trail?.resting) && <Tag label="Resting Area" />}
                        {isFeatureEnabled(trail?.tourism?.information_board, trail?.information_board) && <Tag label="Info Board" />}
                        {isFeatureEnabled(trail?.tourism?.community, trail?.community) && <Tag label="Community" />}
                        {isFeatureEnabled(trail?.tourism?.river, trail?.river) && <Tag label="River" />}
                        {isFeatureEnabled(trail?.tourism?.lake, trail?.lake) && <Tag label="Lake" />}
                        {isFeatureEnabled(trail?.tourism?.waterfall, trail?.waterfall) && <Tag label="Waterfall" />}
                        {isFeatureEnabled(trail?.tourism?.monument, trail?.monument) && <Tag label="Monument" />}
                        {viewpoints?.map((vp, index) => <Tag key={`vp-${index}`} label={vp} />)}
                    </View>
                </View>
            )}

            {/* 6. Trail Route Section */}
            <View style={styles.section}>
                <SectionHeader iconLib="Feather" iconName="map" title="Trail Route" />
                <View style={styles.mapCard}>
                    <Image 
                        source={require('@/src/assets/images/Mt.Tagapo.jpg')} 
                        style={styles.mapImage}
                        resizeMode="cover"
                        defaultSource={require('@/src/assets/images/Mt.Tagapo.jpg')} 
                    />
                    
                    <TouchableOpacity 
                        style={styles.mapRouteLabel}
                        onPress={() => setShowRouteInfo(!showRouteInfo)}
                        activeOpacity={0.8}
                    >
                        <CustomIcon library="FontAwesome6" name="route" size={14} color={Colors.WHITE} />
                        <CustomText variant="caption" style={styles.mapRouteText}>{routeType}</CustomText>
                        <CustomIcon library="Feather" name={showRouteInfo ? "chevron-up" : "chevron-down"} size={14} color={Colors.WHITE} />
                    </TouchableOpacity>

                    <View style={styles.mapOverlay}>
                        <CustomText variant="caption" style={styles.mapOverlayText}>View Map</CustomText>
                        <CustomIcon library="Feather" name="external-link" size={12} color={Colors.WHITE} style={{marginLeft: 4}} />
                    </View>

                    {showRouteInfo && (
                        <View style={styles.routeInfoOverlay}>
                            <CustomText style={styles.routeInfoTitle}>What is a {routeType} route?</CustomText>
                            <CustomText style={styles.routeInfoText}>
                                {ROUTE_GLOSSARY[routeType] || "This describes the layout pattern of the trail."}
                            </CustomText>
                        </View>
                    )}
                </View>
            </View>

            {/* 7. LGU Rules Section */}
            {lguRules.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="FontAwesome5" iconName="file-signature" title="LGU Ordinances" color={Colors.BLUE} />
                    <View style={styles.listWrapper}>
                        {lguRules.map((rule, index) => (
                            <StyledListItem key={`lgu-${index}`} text={rule} index={index} type="lgu" />
                        ))}
                    </View>
                </View>
            )}

            {/* 8. Rules of the Trail */}
            {guidelines.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Feather" iconName="check-square" title="Rules of the Trail" />
                    <View style={styles.listWrapper}>
                        {guidelines.map((guide, index) => (
                            <StyledListItem key={`guide-${index}`} text={guide} index={index} type="guide" />
                        ))}
                    </View>
                </View>
            )}

            {/* 9. Safety Section */}
            {tips.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader iconLib="Ionicons" iconName="shield-checkmark-outline" title="Keep Safe" color={Colors.TRAIL_SAFETY_ICON} />
                    <View style={styles.listWrapper}>
                        {tips.map((tip, index) => (
                            <StyledListItem key={`tip-${index}`} text={tip} index={index} type="safety" />
                        ))}
                    </View>
                </View>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 28,
        paddingBottom: 20,
        width: '100%',
        maxWidth: 860,
        alignSelf: 'center',
    },

    statsCard: {
        backgroundColor: Colors.WHITE,
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
        ...dropShadow,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        zIndex: 2,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
    },
    statItemActive: {
        backgroundColor: Colors.TRAIL_ACTIVE_STAT_BG,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontWeight: '800',
        fontSize: 15,
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginHorizontal: 16,
        marginVertical: 4,
    },

    tooltipWrapper: {
        marginTop: -4,
        paddingHorizontal: 12,
        position: 'relative',
        zIndex: 1,
    },
    tooltipPointer: {
        position: 'absolute',
        top: -7,
        width: 14,
        height: 14,
        backgroundColor: Colors.TRAIL_TOOLTIP_BG,
        transform: [{ rotate: '45deg' }],
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: Colors.TRAIL_TOOLTIP_BORDER,
        zIndex: 2,
    },
    tooltipBody: {
        backgroundColor: Colors.TRAIL_TOOLTIP_BG,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.TRAIL_TOOLTIP_BORDER,
        zIndex: 1,
    },
    tooltipTitle: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginBottom: 8,
    },
    tooltipPointRow: {
        flexDirection: 'row',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    tooltipPointLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
    },
    tooltipPointText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        // lineHeight: 20,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0, 
    },
    section: {
        marginBottom: 4,
    },

    aboutCard: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    aboutDifficultyCard: {
        backgroundColor: Colors.WHITE,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
    },
    diffMetricsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    diffMetricBox: {
        flex: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    diffMetricValue: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    diffMetricLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    diffTerrainLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 8,
    },
    descriptionText: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 26,
        fontSize: 15,
        textAlign: 'justify', 
        letterSpacing: 0.2,
    },
    qualityTagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    qualityPill: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    qualityPillText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    readMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        gap: 4,
    },
    readMoreText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
    },

    criticalCard: {
        flexDirection: 'row',
        backgroundColor: Colors.ERROR_BG,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        padding: 16,
        borderRadius: 16,
        gap: 12,
        alignItems: 'flex-start',
    },
    criticalTextContainer: {
        flex: 1,
    },
    criticalTitle: {
        fontWeight: 'bold',
        color: Colors.ERROR,
        marginBottom: 4,
    },
    criticalText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        lineHeight: 20,
    },

    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.TRAIL_TAG_BG,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100, 
        borderWidth: 1,
        borderColor: Colors.TRAIL_TAG_BORDER,
    },
    tagIcon: {
        marginRight: 6,
    },
    tagText: {
        color: Colors.TRAIL_TAG_TEXT,
        fontSize: 13,
        fontWeight: '600',
    },

    mapCard: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...dropShadow,
        backgroundColor: Colors.GRAY_LIGHT,
        position: 'relative',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapRouteLabel: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 2,
    },
    mapRouteText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapOverlayText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    routeInfoOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 24,
        justifyContent: 'center',
        zIndex: 1,
    },
    routeInfoTitle: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
    },
    routeInfoText: {
        color: Colors.GRAY_LIGHT,
        fontSize: 14,
        lineHeight: 22,
    },

    listWrapper: {
        gap: 12,
    },
    listItemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16, 
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    guideBg: {
        backgroundColor: Colors.TRAIL_RULES_BG,
        borderColor: Colors.TRAIL_RULES_BORDER,
    },
    safetyBg: {
        backgroundColor: Colors.TRAIL_SAFETY_BG,
        borderColor: Colors.TRAIL_SAFETY_BORDER,
    },
    listBullet: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        marginTop: 0,
    },
    guideBullet: {
        backgroundColor: Colors.TRAIL_RULES_BULLET_BG,
    },
    safetyBullet: {
        backgroundColor: Colors.TRAIL_SAFETY_BULLET_BG,
    },
    listBulletText: {
        fontSize: 12,
        fontWeight: '900',
    },
    guideBulletText: {
        color: Colors.TRAIL_RULES_BULLET_TEXT,
    },
    safetyBulletText: {
        color: Colors.TRAIL_SAFETY_BULLET_TEXT,
    },
    listText: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        lineHeight: 22,
        opacity: 0.85,
    },

    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
    },
    loadingText: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default TrailDetailsTab;