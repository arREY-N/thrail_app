/**
 * @file BusinessReviewCard.tsx
 * @description Presentation card component for displaying a hiker's verified review
 * of a tour organizer/business on the Business Profile Reviews tab.
 */

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { BusinessReview } from '@/src/core/models/BusinessReview/interfaces/BusinessReview';
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
 */
interface Props {
    review: BusinessReview;
}

/**
 * BusinessReviewCard — Renders a single verified organizer review card with reviewer
 * avatar, rating pill, 5-star visual row, expandable review text, and booked trail context.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the organizer review card, or null if review is missing
 */
const BusinessReviewCard = ({
    review,
}: Props): React.JSX.Element | null => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

    const hikeDateStr = review.hikeDate
        ? formatDateToStandard(review.hikeDate)
        : '';
    const hikedLabel = hikeDateStr ? `Hiked ${hikeDateStr}` : '--';

    const trailName = review.trail?.name?.trim() || '--';

    const numericRating = typeof review.rating === 'number' && !isNaN(review.rating)
        ? review.rating
        : 0;
    const ratingDisplay = numericRating > 0 ? numericRating.toFixed(1) : '--';

    const reviewText = review.review?.trim() || '';
    const isLong = reviewText.length > MAX_REVIEW_PREVIEW_LENGTH;
    const truncatedText = isLong
        ? `${reviewText.substring(0, MAX_REVIEW_PREVIEW_LENGTH).replace(/\s+$/, '')}...`
        : reviewText;
    const displayText = isExpanded ? reviewText : truncatedText;

    return (
        <View style={styles.card}>
            {/* Header: Reviewer Avatar + Identity + Rating Pill */}
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
                        <CustomText variant="caption" style={styles.dateText}>
                            {reviewedLabel}
                        </CustomText>
                    </View>
                </View>

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
            </View>

            {/* Review Body Text */}
            {Boolean(reviewText) && (
                <View style={styles.bodyContainer}>
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

            {/* Context Footer: Booked Trail Chip + Hike Date */}
            <View style={styles.footerDivider} />
            <View style={styles.footerRow}>
                <View style={styles.trailChip}>
                    <CustomIcon
                        library="FontAwesome6"
                        name="mountain"
                        size={11}
                        color={Colors.PRIMARY}
                    />
                    <CustomText
                        variant="caption"
                        style={styles.trailChipText}
                        numberOfLines={1}
                    >
                        {trailName}
                    </CustomText>
                </View>

                <View style={styles.hikeDateRow}>
                    <CustomIcon
                        library="Feather"
                        name="calendar"
                        size={12}
                        color={Colors.TEXT_SECONDARY}
                    />
                    <CustomText variant="caption" style={styles.hikeDateText}>
                        {hikedLabel}
                    </CustomText>
                </View>
            </View>
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
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 8 }),
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 12,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 999,
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
        marginBottom: 2,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    dateText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_WARNING_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_WARNING_BORDER,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 4,
    },
    ratingBadgeText: {
        color: Colors.STATUS_WARNING_TEXT,
        fontWeight: 'bold',
        fontSize: 13,
    },
    bodyContainer: {
        marginBottom: 12,
    },
    reviewBody: {
        color: Colors.TEXT_PRIMARY,
        lineHeight: 22,
    },
    showMoreAction: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    footerDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    trailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 6,
        flexShrink: 1,
    },
    trailChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
        flexShrink: 1,
    },
    hikeDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    hikeDateText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
});

export default React.memo(BusinessReviewCard);
