import React, { useState } from 'react';
import {
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

    const name = trail?.name || "Unnamed Trail";

    const location = Array.isArray(trail?.province) 
        ? trail.province.join(', ') 
        : (trail?.province || "Unknown Location");  

    const address = trail?.address || location;
    const rating = trail?.score || "0.0"; 
    const reviewsCount = trail?.reviews || "0";

    const stats = {
        distance: trail?.length ? `${trail.length} km` : "--",
        time: trail?.hours ? `${trail.hours} hr` : "--",
        elevation: trail?.masl ? `${trail.masl} m` : "--",
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ResponsiveScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                style={styles.container}
            >
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder} /> 
                    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                        <CustomIcon 
                            library="Feather" 
                            name="chevron-left" 
                            size={28} 
                            color={Colors.TEXT_PRIMARY} 
                        />
                    </TouchableOpacity>
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
                                    color={Colors.GRAY_MEDIUM} 
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
                        style={styles.footerBtn}
                        // style={[styles.footerBtn, {backgroundColor: Colors.SECONDARY}]}
                        variant="secondary"
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
    switch (activeTab) {
        case 'Details':
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
                            This is a {formatList(trail?.quality) || 'scenic'} {trail?.circularity || ''} trail located in {location}.
                            {"\n\n"}
                            {trail?.difficulty_points && trail.difficulty_points.length > 0 
                                ? `Expect features such as ${formatList(trail.difficulty_points)}.` 
                                : 'A great trail for outdoor enthusiasts.'}
                        </CustomText>
                    </View>

                    <View style={styles.section}>
                        <CustomText variant="h3" style={styles.sectionTitle}>
                            Features & Facilities
                        </CustomText>

                        <View style={styles.tagContainer}>
                            {trail?.shelter && <Tag label="Shelter" />}
                            {trail?.clean_water && <Tag label="Drinking Water" />}
                            {trail?.resting && <Tag label="Resting Area" />}
                            {trail?.information_board && <Tag label="Info Board" />}
                            {trail?.community && <Tag label="Community" />}
                            
                            {trail?.river && <Tag label="River" />}
                            {trail?.lake && <Tag label="Lake" />}
                            {trail?.waterfall && <Tag label="Waterfall" />}
                            {trail?.monument && <Tag label="Monument" />}
                            
                            {Array.isArray(trail?.viewpoint) && trail.viewpoint.map((vp, index) => (
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
                        <CustomIcon 
                            library="Feather" 
                            name="cloud" 
                            size={32} 
                            color={Colors.GRAY_MEDIUM} 
                        />

                        <CustomText style={styles.placeholderText}>
                            Weather Forecast Widget
                        </CustomText>
                    </View>
                </View>
            );
        case 'Reviews':
            return (
                <View style={styles.tabContent}>
                    <View style={[styles.placeholderBox, { height: 100 }]}>
                        <CustomIcon 
                            library="Feather" 
                            name="message-square" 
                            size={32} 
                            color={Colors.GRAY_MEDIUM} 
                        />
                        
                        <CustomText style={styles.placeholderText}>
                            User Reviews List
                        </CustomText>
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
        paddingBottom: 0,
    },

    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    backButton: {
        position: 'absolute',
        top: 32,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
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
    },
    headerInfo: {
        marginBottom: 20,
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
        marginBottom: 8,
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
        borderColor: Colors.GRAY_LIGHT,
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
        borderBottomColor: Colors.TEXT_PRIMARY,
    },
    tabText: {
        fontSize: 16,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.TEXT_PRIMARY,
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
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        color: Colors.TEXT_PRIMARY,
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