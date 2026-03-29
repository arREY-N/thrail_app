import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

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

const formatList = (list) => {
    if (!list) return '';
    return Array.isArray(list) ? list.join(', ') : list;
};

const Tag = ({ label }) => (
    <View style={styles.tag}>
        <CustomText variant="caption" style={styles.tagText}>
            {label}
        </CustomText>
    </View>
);

const TrailDetailsTab = ({ stats, trail, location }) => {
    const qualityList = getArray(trail?.difficulty?.quality, trail?.quality);
    const diffPoints = getArray(trail?.difficulty?.difficulty_points, trail?.difficulty_points);
    const viewpoints = getArray(trail?.tourism?.viewpoint, trail?.viewpoint);
    const circularity = trail?.difficulty?.circularity || trail?.circularity || '';

    return (
        <View style={styles.tabContent}>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <CustomText variant="body" style={styles.statValue}>
                        {stats.distance}
                    </CustomText>
                    <CustomText variant="caption" style={styles.statLabel}>
                        Distance
                    </CustomText>
                </View>

                <View style={styles.statItem}>
                    <CustomText variant="body" style={styles.statValue}>
                        {stats.time}
                    </CustomText>
                    <CustomText variant="caption" style={styles.statLabel}>
                        Est. Time
                    </CustomText>
                </View>

                <View style={styles.statItem}>
                    <CustomText variant="body" style={styles.statValue}>
                        {stats.elevation}
                    </CustomText>
                    <CustomText variant="caption" style={styles.statLabel}>
                        Elevation
                    </CustomText>
                </View>
            </View>

            <View style={styles.section}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    About
                </CustomText>

                <CustomText style={styles.descriptionText}>
                    This is a {formatList(qualityList) || 'scenic'} {circularity} trail located in {location}.
                    {"\n\n"}
                    {diffPoints.length > 0 
                        ? `Expect features such as ${formatList(diffPoints)}.` 
                        : 'A great trail for outdoor enthusiasts.'}
                </CustomText>
            </View>

            <View style={styles.section}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    Features & Facilities
                </CustomText>

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
                    
                    {viewpoints?.map((vp, index) => (
                        <Tag key={`vp-${index}`} label={vp} />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 18,
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    descriptionText: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        marginBottom: -16,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        color: Colors.TEXT_INVERSE,
        fontSize: 12,
    },
});

export default TrailDetailsTab;