import React, { useMemo, useState } from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const TrailScreen = ({ 
    trail, 
    onBackPress, 
    onDownloadPress, 
    onHikePress, 
    onBookPress 
}) => {
    const [activeTab, setActiveTab] = useState('Details');

    const heroImage = useMemo(() => {
        const images = [
            require('@/src/assets/images/MT1.jpg'),
            require('@/src/assets/images/MT2.jpg'),
            require('@/src/assets/images/MT3.jpg'),
            require('@/src/assets/images/MT4.jpg'),
            require('@/src/assets/images/MT5.jpg'),
            // require('@src/assetsimages/Mt.Tagapo.jpg'),
        ];
        
        const uniqueString = trail?.id ? String(trail.id) : (trail?.name || "Unnamed Trail");

        let hash = 0;
        for (let i = 0; i < uniqueString.length; i++) {
            const char = uniqueString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; 
        }

        const positiveHash = Math.abs(hash);
        const imageIndex = positiveHash % images.length;
        
        return images[imageIndex];
    }, [trail]);

    const name = trail?.general?.name || "Unnamed Trail";

    const location = Array.isArray(trail?.general?.province) 
        ? trail.general.province.join(', ') 
        : (trail?.general?.province || "Unknown Location");  

    const address = trail?.general?.address || location;
    const rating = trail?.general?.rating || "0.0"; 
    const reviewsCount = trail?.general?.reviewCount || "0";

    const stats = {
        distance: trail?.difficulty?.length ? `${trail.difficulty.length} km` : "--",
        time: trail?.difficulty?.hours ? `${trail.difficulty.hours} hr` : "--",
        elevation: trail?.geography?.masl ? `${trail.geography.masl} m` : "--",
    };

return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                <CustomIcon 
                    library="Feather" 
                    name="chevron-left" 
                    size={28} 
                    color={Colors.WHITE} 
                />
            </TouchableOpacity>
            
            <ResponsiveScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                style={styles.container}
            >
                <View style={styles.imageContainer}>
                    <Image 
                        source={heroImage} 
                        style={styles.headerImage}
                        resizeMode="cover"
                    />
                </View>

                <View style={styles.bodyContainer}>
                    <View style={styles.headerInfo}>
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>
                                <CustomText variant="h2" style={styles.title}>
                                    {name}
                                </CustomText>

                                <CustomText variant="body" style={styles.address}>
                                    {address}
                                </CustomText>

                                <View style={styles.ratingRow}>
                                    <CustomIcon 
                                        library="Ionicons" 
                                        name="star" 
                                        size={14} 
                                        color={Colors.YELLOW} 
                                    />

                                    <CustomText style={styles.ratingText}>
                                        {rating} ({reviewsCount})
                                    </CustomText>
                                </View>
                            </View>
                            
                            <TouchableOpacity style={styles.downloadButton} onPress={() => onDownloadPress(trail?.id)}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="download" 
                                    size={20}
                                    color={Colors.WHITE} 
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.tabContainer}>
                        {['Details', 'Weather', 'Reviews'].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <CustomText style={[
                                    styles.tabText, 
                                    activeTab === tab && styles.activeTabText
                                ]}>
                                    {tab}
                                </CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.divider} />

                    <TrailContent 
                        activeTab={activeTab} 
                        stats={stats} 
                        trail={trail} 
                        location={location} 
                    />

                </View>
            </ResponsiveScrollView>

            <View style={styles.footer}>
                <View style={styles.buttonWrapper}>
                    <CustomButton 
                        title="Hike" 
                        onPress={() => onHikePress(trail?.id)} 
                        variant="secondary"
                        style={[
                            styles.footerBtn, 
                            { borderWidth: 1.5, borderColor: Colors.PRIMARY }
                        ]}
                        textStyle={{ color: Colors.PRIMARY }}
                    />
                </View>

                <View style={styles.buttonWrapper}>
                    <CustomButton 
                        title="Book" 
                        onPress={() => onBookPress(trail?.id)} 
                        style={styles.footerBtn}
                        variant="primary"
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};

const TrailContent = ({ activeTab, stats, trail, location }) => {
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

    const qualityList = getArray(trail?.difficulty?.quality, trail?.quality);
    const diffPoints = getArray(trail?.difficulty?.difficulty_points, trail?.difficulty_points);
    const viewpoints = getArray(trail?.tourism?.viewpoint, trail?.viewpoint);
    const circularity = trail?.difficulty?.circularity || trail?.circularity || '';

    switch (activeTab) {
        case 'Details':
            return (
                <View style={styles.tabContent}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <CustomText variant="body" style={styles.statValue}>{stats.distance}</CustomText>
                            <CustomText variant="caption" style={styles.statLabel}>Distance</CustomText>
                        </View>

                        <View style={styles.statItem}>
                            <CustomText variant="body" style={styles.statValue}>{stats.time}</CustomText>
                            <CustomText variant="caption" style={styles.statLabel}>Est. Time</CustomText>
                        </View>

                        <View style={styles.statItem}>
                            <CustomText variant="body" style={styles.statValue}>{stats.elevation}</CustomText>
                            <CustomText variant="caption" style={styles.statLabel}>Elevation</CustomText>
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
        case 'Weather':
            return (
                <View style={styles.tabContent}>
                    <View style={[styles.placeholderBox, { height: 150 }]}>
                        <CustomIcon library="Feather" name="cloud" size={32} color={Colors.GRAY_MEDIUM} />
                        <CustomText style={styles.placeholderText}>Weather Forecast Widget</CustomText>
                    </View>
                </View>
            );
        case 'Reviews':
            return (
                <View style={styles.tabContent}>
                    <View style={[styles.placeholderBox, { height: 100 }]}>
                        <CustomIcon library="Feather" name="message-square" size={32} color={Colors.GRAY_MEDIUM} />
                        <CustomText style={styles.placeholderText}>User Reviews List</CustomText>
                    </View>
                </View>
            );
        default:
            return null;
    }
};

const Tag = ({ label }) => (
    <View style={styles.tag}>
        <CustomText variant="caption" style={styles.tagText}>
            {label}
        </CustomText>
    </View>
);

const formatList = (list) => {
    if (!list) return '';
    return Array.isArray(list) ? list.join(', ') : list;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 8,
    },

    imageContainer: {
        height: 350,
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 24,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    
    bodyContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 96,
        paddingTop: 24,
        paddingHorizontal: 24,

        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },
    headerInfo: {
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    address: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 0,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    downloadButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },

    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 0,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.PRIMARY,
    },
    tabText: {
        fontSize: 16,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginBottom: 24,
    },

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

    placeholderBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    placeholderText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,

        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,

        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        gap: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,

    },
    buttonWrapper: {
        flex: 1,
    },
    footerBtn: {
        width: '100%',
    }
});

export default TrailScreen;