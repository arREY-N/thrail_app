import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';

import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const PostCard = ({ 
    review, 
    onLike, 
    isLiked, 
    onEdit,
    variant = 'community' // 'community' | 'profile'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const placeholderImage = review.image?.[0] ?? require('@/src/assets/images/Mt.Tagapo.jpg'); 

    let previewUrl = null;
    if (typeof placeholderImage === 'string') {
        previewUrl = placeholderImage;
    } else if (placeholderImage?.uri) {
        previewUrl = placeholderImage.uri;
    } else {
        previewUrl = Image.resolveAssetSource(placeholderImage)?.uri;
    }

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatStat = (val, unit) => {
        if (val === undefined || val === null || val === '--') return '--';
        const strVal = String(val).trim();
        if (strVal.toLowerCase().includes(unit)) return strVal;
        return `${strVal} ${unit}`;
    };

    const reviewText = review.review || "No review text provided for this hike.";
    const maxLength = 90; 
    const isLong = reviewText.length > maxLength;
    const displayText = isExpanded ? reviewText : (isLong ? `${reviewText.substring(0, maxLength).trim()}` : reviewText);

    return (
        <View style={styles.card}>
            
            <View style={styles.header}>
                
                <View style={styles.headerLeft}>
                    <View style={styles.avatarPlaceholder}>
                        <CustomText variant="label" style={styles.avatarText}>
                            {getInitials(review?.user?.username || review?.user?.firstname)}
                        </CustomText>
                    </View>
                    <View style={styles.userInfo}>
                        <CustomText variant="h3" style={styles.userName}>
                            {review?.user?.username || review?.user?.firstname || "Hiker Name"}
                        </CustomText>
                        <CustomText variant="caption" style={styles.dateText}>
                            {formatDate(review?.createdAt || review?.hikeDate || new Date())}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    
                    <Pressable onPress={onLike} style={styles.likeButton}>
                        <CustomIcon 
                            library={isLiked ? "Ionicons" : "Feather"} 
                            name={isLiked ? "heart" : "heart"} 
                            size={18} 
                            color={isLiked ? Colors.ERROR : Colors.BLACK} 
                        />
                        <CustomText 
                            variant="label" 
                            style={[styles.likeCount, isLiked ? { color: Colors.ERROR } : { color: Colors.BLACK }]}
                        >
                            {review.likes?.length || review.likes || 0}
                        </CustomText>
                    </Pressable>

                    {variant === 'profile' && (
                        <TouchableOpacity onPress={onEdit} style={styles.editIconButton} activeOpacity={0.7}>
                            <CustomIcon 
                                library="Feather" 
                                name="edit-2" 
                                size={18} 
                                color={Colors.PRIMARY} 
                            />
                        </TouchableOpacity>
                    )}

                </View>
            </View>

            <TouchableOpacity 
                style={styles.imageWrapper}
                activeOpacity={0.9}
                onPress={() => setIsPreviewVisible(true)}
            >
                <Image 
                    source={placeholderImage} 
                    style={styles.postImage} 
                    resizeMode="cover" 
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradientOverlay}
                >
                    <CustomText variant="h2" style={styles.mountainTitleOverlay}>
                        {review.trail?.name || review.trailName || "Mountain Name"}
                    </CustomText>
                    
                    <View style={styles.locationRow}>
                        <CustomIcon
                            library="FontAwesome6"
                            name="location-dot"
                            size={10}
                            color={Colors.TEXT_INVERSE}
                        />
                        <CustomText
                            variant="caption"
                            style={styles.locationTextOverlay}
                            numberOfLines={1}
                        >
                            {review.location || "Philippines"}
                        </CustomText>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
                <StatItem 
                    label="Rate" 
                    value={review.overallRating || review.rate?.toFixed(1) || '--'} 
                    icon="star" 
                    lib="Ionicons"
                    iconColor={Colors.YELLOW} 
                    style={styles.rateStat}
                />
                <View style={styles.verticalDivider} />
                <StatItem 
                    label="Distance" 
                    value={formatStat(review.distance, 'km')} 
                    icon="map-outline" 
                    lib="Ionicons"
                    style={styles.otherStat}
                />
                <View style={styles.verticalDivider} />
                <StatItem 
                    label="Elevation" 
                    value={formatStat(review.elevation, 'm')} 
                    icon="trending-up" 
                    lib="Feather"
                    style={styles.otherStat}
                />
                <View style={styles.verticalDivider} />
                <StatItem 
                    label="Duration" 
                    value={formatStat(review.duration, 'hr')} 
                    icon="time-outline" 
                    lib="Ionicons"
                    style={styles.otherStat}
                />
            </View>

            <View style={styles.horizontalDivider} />

            <View style={styles.textBody}>
                <CustomText variant="body" style={styles.reviewContent}>
                    {displayText}
                    {isLong && !isExpanded && (
                        <CustomText style={styles.showMoreAction} onPress={() => setIsExpanded(true)}>
                            ... Show More
                        </CustomText>
                    )}
                    {isLong && isExpanded && (
                        <CustomText style={styles.showMoreAction} onPress={() => setIsExpanded(false)}>
                            {" "}Show Less
                        </CustomText>
                    )}
                </CustomText>
            </View>
            
            <ImagePreviewModal 
                visible={isPreviewVisible} 
                imageUrl={previewUrl} 
                onClose={() => setIsPreviewVisible(false)} 
            />
        </View>
    );
};

const StatItem = ({ label, value, icon, lib, iconColor = Colors.PRIMARY, style }) => (
    <View style={[styles.statBox, style]}>
        <View style={styles.statTopRow}>
            <CustomIcon library={lib} name={icon} size={16} color={iconColor} />
            <CustomText variant="caption" style={styles.statValue} numberOfLines={1}>
                {value}
            </CustomText>
        </View>
        <CustomText variant="caption" style={styles.statLabel}>
            {label}
        </CustomText>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        marginBottom: 0, 
        borderRadius: 24, 
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    userName: {
        marginBottom: -2,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    dateText: {
        color: Colors.TEXT_SECONDARY,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 4,
    },
    likeCount: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    editIconButton: {
        padding: 4,
    },
    
    imageWrapper: {
        position: 'relative',
        height: 200,
        width: 'auto',
        marginHorizontal: 16,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    mountainTitleOverlay: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 2,
        gap: 6,
    },
    locationTextOverlay: {
        color: Colors.TEXT_INVERSE,
        fontWeight: "500",
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    
    statsContainer: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    statBox: {
        alignItems: 'center',
        justifyContent: 'center', 
        paddingHorizontal: 4,
    },
    statTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    statValue: {
        fontWeight: '900',
        color: Colors.TEXT_PRIMARY,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginTop: 2,
    },
    
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.WARNING,
        flex: 0,
        marginHorizontal: 4, 
    },

    rateStat: {
        flex: 0.8,
    },
    otherStat: {
        flex: 1.1,
    },
    
    horizontalDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    textBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    reviewContent: {
        fontSize: 12,
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
    },
    showMoreAction: {
        fontSize: 12,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: Colors.PRIMARY, 
    },
});

export default PostCard;