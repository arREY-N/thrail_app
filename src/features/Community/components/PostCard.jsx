import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const PostCard = ({ 
    review, 
    onLike, 
    isLiked, 
    isOwned, 
    onEdit 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const placeholderImage = require('@/src/assets/images/Mt.Tagapo.jpg'); 

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const reviewText = review.review || "No review text provided for this hike.";
    const maxLength = 90; 
    const isLong = reviewText.length > maxLength;
    const displayText = isExpanded ? reviewText : (isLong ? `${reviewText.substring(0, maxLength).trim()}...` : reviewText);

    return (
        <View style={styles.card}>
            
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <CustomText variant="label" style={styles.avatarText}>
                        {getInitials(review.userName)}
                    </CustomText>
                </View>
                
                <View style={styles.userInfo}>
                    <CustomText variant="h3" style={styles.userName}>
                        {review.userName || "Hiker Name"}
                    </CustomText>
                    <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                        {review.location || "Location"} | {review.date || "Date"}
                    </CustomText>
                </View>

                <Pressable 
                    onPress={onLike} 
                    style={[
                        styles.likePill, 
                        !isLiked && { backgroundColor: Colors.GRAY_ULTRALIGHT }
                    ]}
                >
                    <CustomIcon 
                        library="Ionicons" 
                        name={isLiked ? "heart" : "heart-outline"} 
                        size={16} 
                        color={isLiked ? Colors.ERROR : Colors.TEXT_SECONDARY} 
                    />
                    <CustomText 
                        variant="label" 
                        style={[
                            styles.likeCount, 
                            isLiked ? { color: Colors.ERROR } : { color: Colors.TEXT_SECONDARY }
                        ]}
                    >
                        {review.likes?.length || 0}
                    </CustomText>
                </Pressable>
            </View>

            <View style={styles.imageWrapper}>
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
                        {review.mountainName || "Mountain Name"}
                    </CustomText>
                </LinearGradient>
            </View>

            <View style={styles.statsContainer}>
                <StatItem label="Rate" value={`★ ${review.rating || '--'}`} highlight={Colors.YELLOW} />
                <View style={styles.verticalDivider} />
                
                <StatItem label="Dist" value={`${review.distance || '--'} km`} />
                <View style={styles.verticalDivider} />
                
                <StatItem label="Elev" value={`${review.elevation || '--'} m`} />
                <View style={styles.verticalDivider} />
                
                <StatItem label="Dur" value={`${review.duration || '--'} hr`} />
            </View>

            <View style={styles.textBody}>
                <CustomText variant="body" style={styles.reviewContent}>
                    {displayText}
                    {isLong && (
                        <CustomText 
                            variant="label" 
                            style={styles.showMoreAction}
                            onPress={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? " Show Less" : " Show More"}
                        </CustomText>
                    )}
                </CustomText>
            </View>

            {isOwned && (
                <Pressable onPress={onEdit} style={styles.editAction}>
                    <CustomIcon library="Feather" name="edit-2" size={14} color={Colors.PRIMARY} />
                    <CustomText variant="caption" color={Colors.PRIMARY} style={styles.editText}>
                        Edit My Review
                    </CustomText>
                </Pressable>
            )}
        </View>
    );
};

const StatItem = ({ label, value, highlight }) => (
    <View style={styles.statBox}>
        <CustomText variant="caption" style={styles.statLabel}>{label}</CustomText>
        <CustomText 
            variant="label" 
            style={[styles.statValue, highlight && { color: highlight }]}
        >
            {value}
        </CustomText>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        marginBottom: 20, 
        borderRadius: 24, 
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    },
    userName: {
        marginBottom: 2,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    likePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    likeCount: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    imageWrapper: {
        position: 'relative',
        width: 'auto',
        marginHorizontal: 16,
        height: 200,
        borderRadius: 16,
        marginBottom: 16,
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
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        marginBottom: 4,
        fontWeight: '600',
    },
    statValue: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    textBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    reviewContent: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
    },
    showMoreAction: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: Colors.PRIMARY, 
    },
    editAction: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    editText: {
        fontWeight: '600',
    }
});

export default PostCard;