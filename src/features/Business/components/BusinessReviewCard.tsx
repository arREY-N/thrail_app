/**
 * @file BusinessReviewCard.tsx
 * @description Presentation card component for displaying a hiker's verified review
 * of a tour organizer/business on the Business Profile Reviews tab, featuring PostCard-style
 * likes, multi-photo gallery preview, thumbnail strip, and inline date/mountain attribution.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { BusinessReview } from '@/src/core/models/BusinessReview/BusinessReview';
import { formatDateToStandard, getInitials } from '@/src/utils/dateFormatter';

interface UserAvatarCandidate {
    avatar?: string;
    photoUrl?: string;
    profileImage?: string;
}

const getUserPhotoUri = (userCandidate: unknown): string | null => {
    if (!userCandidate || typeof userCandidate !== 'object') return null;
    const candidate = userCandidate as UserAvatarCandidate;
    if (typeof candidate.avatar === 'string' && candidate.avatar.trim().length > 0) {
        return candidate.avatar.trim();
    }
    if (typeof candidate.photoUrl === 'string' && candidate.photoUrl.trim().length > 0) {
        return candidate.photoUrl.trim();
    }
    if (typeof candidate.profileImage === 'string' && candidate.profileImage.trim().length > 0) {
        return candidate.profileImage.trim();
    }
    return null;
};

const MAX_REVIEW_PREVIEW_LENGTH = 160;

/**
 * Props for the BusinessReviewCard component.
 *
 * @param review - The BusinessReview entity submitted by a hiker for a booked hike.
 * @param onLike - Callback fired when the like button is pressed.
 * @param isLiked - Helper function to check if the current user has liked the review.
 */
interface Props {
    review: BusinessReview;
    onLike?: () => void;
    isLiked?: (review: BusinessReview) => boolean;
}

/**
 * BusinessReviewCard — Renders a verified organizer review card with reviewer avatar,
 * Date • Mountain attribution, rating + like pills, expandable review text, and optional
 * PostCard-style photo viewer and thumbnail strip.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the organizer review card, or null if review is missing
 */
const BusinessReviewCard = ({
    review,
    onLike,
    isLiked,
}: Props): React.JSX.Element | null => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

    const liked = useMemo(
        () => (isLiked && review ? isLiked(review) : false),
        [review, isLiked]
    );

    if (!review) return null;

    const userPhotoUri = getUserPhotoUri(review.user);
    const hasUserName = Boolean(
        review.user?.username ||
        review.user?.firstname ||
        review.user?.lastname
    );
    const userName =
        review.user?.username ||
        review.user?.firstname ||
        (review.user?.lastname ? `Hiker ${review.user.lastname}` : '--');
    const userInitials = hasUserName
        ? getInitials(review.user?.firstname || review.user?.username, review.user?.lastname)
        : null;

    const createdDateStr = review.createdAt
        ? formatDateToStandard(review.createdAt)
        : '';
    const reviewedLabel = createdDateStr || '--';

    const trailName = review.trail?.name?.trim() || '--';
    const trailLocation = review.trail?.location?.trim() || 'Philippines';

    const imagesList: string[] = Array.isArray(review.image)
        ? review.image.filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        : [];
    const safeActiveIndex =
        activeImageIndex >= 0 && activeImageIndex < imagesList.length ? activeImageIndex : 0;
    const displayImage = imagesList.length > 0 ? imagesList[safeActiveIndex] : null;

    const numericRating = typeof review.rating === 'number' && !isNaN(review.rating)
        ? review.rating
        : 0;
    const ratingDisplay = numericRating > 0 ? numericRating.toFixed(1) : '--';

    const likeCount = Array.isArray(review.likes)
        ? review.likes.length
        : Number(review.likes) || 0;

    const reviewText = review.review?.trim() || '';
    const isLong = reviewText.length > MAX_REVIEW_PREVIEW_LENGTH;
    const truncatedText = isLong
        ? `${reviewText.substring(0, MAX_REVIEW_PREVIEW_LENGTH).replace(/\s+$/, '')}...`
        : reviewText;
    const displayText = isExpanded ? reviewText : truncatedText;

    return (
        <View style={styles.card}>
            {/* Header: Reviewer Avatar + Identity + Rating & Like Pills */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {userPhotoUri ? (
                        <CustomImage
                            source={{ uri: userPhotoUri }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                        />
                    ) : userInitials ? (
                        <View style={styles.avatarPlaceholder}>
                            <CustomText variant="label" style={styles.avatarText}>
                                {userInitials}
                            </CustomText>
                        </View>
                    ) : (
                        <View style={styles.avatarFallback}>
                            <CustomIcon
                                library="Ionicons"
                                name="person"
                                size={20}
                                color={Colors.GRAY_MEDIUM}
                            />
                        </View>
                    )}

                    <View style={styles.userInfo}>
                        <CustomText
                            variant="h3"
                            style={styles.userName}
                            numberOfLines={1}
                        >
                            {userName}
                        </CustomText>
                        <CustomText
                            variant="caption"
                            style={styles.dateText}
                            numberOfLines={1}
                        >
                            {reviewedLabel}
                            {!displayImage && Boolean(review.trail?.name?.trim()) && (
                                <CustomText variant="caption" style={styles.inlineMountainText}>
                                    {` • ${trailName}`}
                                </CustomText>
                            )}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <View style={styles.ratingBadge}>
                        <CustomIcon
                            library="Ionicons"
                            name="star"
                            size={14}
                            color={Colors.YELLOW}
                        />
                        <CustomText variant="label" style={styles.ratingBadgeText}>
                            {ratingDisplay}
                        </CustomText>
                    </View>

                    <Pressable
                        onPress={onLike}
                        style={[
                            styles.headerLikeBadge,
                            liked ? styles.headerLikeBadgeActive : styles.headerLikeBadgeInactive,
                        ]}
                    >
                        <CustomIcon
                            library="Ionicons"
                            name={liked ? 'heart' : 'heart-outline'}
                            size={14}
                            color={liked ? Colors.ERROR : Colors.TEXT_SECONDARY}
                        />
                        <CustomText
                            variant="label"
                            style={liked ? styles.headerLikeTextActive : styles.headerLikeTextInactive}
                        >
                            {likeCount}
                        </CustomText>
                    </Pressable>
                </View>
            </View>

            {/* Review Body Text */}
            {Boolean(reviewText) && (
                <View style={[styles.bodyContainer, Boolean(displayImage) && styles.bodyContainerWithImage]}>
                    <CustomText variant="body" style={styles.reviewBody}>
                        {displayText}
                        {isLong && !isExpanded && (
                            <CustomText
                                style={styles.showMoreAction}
                                onPress={() => setIsExpanded(true)}
                            >
                                {' Show More'}
                            </CustomText>
                        )}
                        {isLong && isExpanded && (
                            <CustomText
                                style={styles.showMoreAction}
                                onPress={() => setIsExpanded(false)}
                            >
                                {' Show Less'}
                            </CustomText>
                        )}
                    </CustomText>
                </View>
            )}

            {/* Uploaded Business Review Photo Gallery (PostCard Parity) */}
            {Boolean(displayImage) && (
                <TouchableOpacity
                    style={styles.imageWrapper}
                    activeOpacity={0.9}
                    onPress={() => setIsPreviewVisible(true)}
                >
                    <CustomImage
                        source={{ uri: displayImage as string }}
                        style={styles.postImage}
                        resizeMode="cover"
                    />

                    <LinearGradient
                        colors={['transparent', Colors.IMAGE_PREVIEW_COUNTER_BG, Colors.MAP_MODAL_BACKDROP]}
                        style={styles.gradientOverlay}
                    >
                        <View style={styles.headerTextColumn}>
                            <CustomText
                                variant="h2"
                                style={styles.mountainTitleOverlay}
                                numberOfLines={1}
                            >
                                {trailName}
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
                                    {trailLocation}
                                </CustomText>
                            </View>
                        </View>

                        {imagesList.length > 1 && (
                            <View style={styles.imageCountBadge}>
                                <CustomIcon
                                    library="Feather"
                                    name="image"
                                    size={11}
                                    color={Colors.TEXT_INVERSE}
                                    style={styles.imageCountIcon}
                                />
                                <CustomText variant="label" style={styles.imageCountText}>
                                    {`${safeActiveIndex + 1}/${imagesList.length}`}
                                </CustomText>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Thumbnail Strip (Shown only when 2+ photos are uploaded) */}
            {imagesList.length > 1 && (
                <View style={styles.thumbnailStripWrapper}>
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailStripContent}
                    >
                        {imagesList.map((imgUrl, idx) => {
                            const isSelected = idx === safeActiveIndex;
                            return (
                                <TouchableOpacity
                                    key={`biz-review-thumb-${idx}`}
                                    style={[
                                        styles.thumbnailItem,
                                        isSelected && styles.thumbnailItemActive,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => setActiveImageIndex(idx)}
                                    accessibilityLabel={`Select photo ${idx + 1}`}
                                >
                                    <CustomImage
                                        source={{ uri: imgUrl }}
                                        style={styles.thumbnailItemImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {isPreviewVisible && imagesList.length > 0 && (
                <ImagePreviewModal
                    visible={isPreviewVisible}
                    images={imagesList}
                    initialIndex={safeActiveIndex}
                    onClose={() => setIsPreviewVisible(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        ...GlobalStyles.dropShadow(3, 0.05, Colors.SHADOW, { radius: 8 }),
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        gap: 8,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
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
    inlineMountainText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_WARNING_BG,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    ratingBadgeText: {
        color: Colors.STATUS_WARNING_TEXT,
        fontWeight: 'bold',
        fontSize: 13,
    },
    headerLikeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    headerLikeBadgeActive: {
        backgroundColor: Colors.ERROR_BG,
    },
    headerLikeBadgeInactive: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    headerLikeTextActive: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 13,
    },
    headerLikeTextInactive: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 13,
    },
    bodyContainer: {
        paddingBottom: 2,
    },
    bodyContainerWithImage: {
        paddingBottom: 12,
    },
    reviewBody: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
    },
    showMoreAction: {
        fontSize: 12,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: Colors.PRIMARY,
    },
    imageWrapper: {
        position: 'relative',
        height: 200,
        width: '100%',
        borderRadius: 16,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTextColumn: {
        flex: 1,
        paddingRight: 16,
    },
    mountainTitleOverlay: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        marginBottom: 2,
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        gap: 6,
    },
    locationTextOverlay: {
        color: Colors.TEXT_INVERSE,
        fontWeight: '500',
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    imageCountBadge: {
        flexDirection: 'row',
        backgroundColor: Colors.IMAGE_PREVIEW_COUNTER_BG,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountIcon: {
        marginRight: 4,
    },
    imageCountText: {
        color: Colors.TEXT_INVERSE,
        fontSize: 12,
        fontWeight: 'bold',
    },
    thumbnailStripWrapper: {
        marginTop: 12,
    },
    thumbnailStripContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    thumbnailItem: {
        width: 48,
        height: 48,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        opacity: 0.75,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    thumbnailItemActive: {
        borderColor: Colors.PRIMARY,
        borderWidth: 2,
        opacity: 1,
    },
    thumbnailItemImage: {
        width: '100%',
        height: '100%',
    },
});

export default React.memo(BusinessReviewCard, (prevProps, nextProps) => {
    const prevLiked = prevProps.isLiked && prevProps.review ? prevProps.isLiked(prevProps.review) : false;
    const nextLiked = nextProps.isLiked && nextProps.review ? nextProps.isLiked(nextProps.review) : false;

    return (
        prevProps.review === nextProps.review &&
        prevLiked === nextLiked
    );
});
