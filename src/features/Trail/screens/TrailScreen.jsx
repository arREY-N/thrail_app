import React, { useState } from 'react';
import {
    Dimensions,
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

// const { width } = Dimensions.get('window');

const TrailScreen = ({ 
    trail, 
    onBackPress, 
    onDownloadPress, 
    onHikePress, 
    onBookPress 
}) => {
    const [activeTab, setActiveTab] = useState('Details');

    const name = trail.general?.name || "Unnamed Trail";
    const address = trail.general?.address || trail.general?.province?.[0] || "Unknown Location";
    const rating = trail.score || "0.0";
    const reviewsCount = trail.reviews || "0";

    const stats = {
        distance: trail.difficulty?.length ? `${trail.difficulty.length} km` : "--",
        time: trail.difficulty?.hours ? `${trail.difficulty.hours} hr` : "--",
        elevation: trail.geographical?.masl ? `${trail.geographical.masl} m` : "--",
    };

    const renderTabContent = () => {
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

                        <View style={styles.placeholderBox}>
                            <CustomText style={styles.placeholderText}>(Short Description)</CustomText>
                        </View>
                        <View style={styles.placeholderBox}>
                            <CustomText style={styles.placeholderText}>(AI Difficulty Explanation)</CustomText>
                        </View>
                    </View>
                );
            case 'Weather':
                return (
                    <View style={styles.tabContent}>
                        <View style={[styles.placeholderBox, { height: 150 }]}>
                            <CustomText style={styles.placeholderText}>Weather Forecast Widget</CustomText>
                        </View>
                    </View>
                );
            case 'Reviews':
                return (
                    <View style={styles.tabContent}>
                        <View style={[styles.placeholderBox, { height: 100 }]}>
                            <CustomText style={styles.placeholderText}>User Reviews List</CustomText>
                        </View>
                    </View>
                );
            default:
                return null;
        }
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
                        <CustomIcon library="Feather" name="chevron-left" size={28} color={Colors.TEXT_PRIMARY} />
                    </TouchableOpacity>

                    {/* <View style={styles.pagination}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View> */}
                </View>

                <View style={styles.bodyContainer}>
                    
                    <View style={styles.headerInfo}>
                        <View style={styles.titleRow}>
                            <View style={{ flex: 1 }}>
                                <CustomText variant="h2" style={styles.title}>{name}</CustomText>
                                <CustomText variant="body" style={styles.address}>{address}</CustomText>
                                <View style={styles.ratingRow}>
                                    <CustomIcon library="Ionicons" name="star" size={14} color={Colors.TEXT_PRIMARY} />
                                    <CustomText style={styles.ratingText}>{rating} ({reviewsCount})</CustomText>
                                </View>
                            </View>
                            
                            <TouchableOpacity style={styles.downloadButton} onPress={onDownloadPress}>
                                <CustomIcon library="Feather" name="download" size={20} color={Colors.GRAY_MEDIUM} />
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

                    {renderTabContent()}

                </View>
            </ResponsiveScrollView>

            <View style={styles.footer}>
                <View style={styles.buttonWrapper}>
                    <CustomButton 
                        title="Hike" 
                        onPress={onHikePress} 
                        style={styles.footerBtn}
                        variant="secondary"
                    />
                </View>

                <View style={styles.buttonWrapper}>
                    <CustomButton 
                        title="Book" 
                        onPress={onBookPress} 
                        style={styles.footerBtn}
                        variant="primary"
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
    backButton: {
        position: 'absolute',
        top: 32,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pagination: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    activeDot: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 20,
    },

    bodyContainer: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 20,
    },
    headerInfo: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
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
        marginBottom: 8,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 12,
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
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    placeholderBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
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
    },
    buttonWrapper: {
        flex: 1,
    },
    footerBtn: {
        width: '100%',
    }
});

export default TrailScreen;