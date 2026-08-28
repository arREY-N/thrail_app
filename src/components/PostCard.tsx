/**
 * @file PostCard.tsx
 * @description A comprehensive card component used to display user reviews,
 * photos, stats, and tags within the community feed or user profile.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ImageSourcePropType,
    Platform,
    Pressable,
    ScrollView,
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { getHeroImageSource } from "@/src/features/Trail/utils/TrailDetailsHelpers";
import { formatDateToStandard, formatDuration } from "@/src/utils/dateFormatter";

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IReview, Review } from '@/src/core/models/Review/Review';
import { useScrollFades } from '@/src/hooks/useScrollFades';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * Props for the PostCard component.
 * 
 * @param review - The review or post object containing data.
 * @param onLike - Callback fired when the like button is pressed.
 * @param isLiked - Helper function to check if the current user has liked the post.
 * @param onEdit - Callback fired when the edit button is pressed (only visible in 'profile' variant).
 * @param variant - The visual variant of the post card ('community' or 'profile').
 */
interface PostCardProps {
    review: Review | IReview;
    onLike?: () => void;
    isLiked?: (review: Review) => boolean;
    onEdit?: () => void;
    variant?: 'community' | 'profile';
}

/**
 * PostCard — A comprehensive card component used to display user reviews,
 * photos, stats, and tags within the community feed or user profile.
 */
const PostCard: React.FC<PostCardProps> = ({ 
    review, 
    onLike, 
    isLiked, 
    onEdit, 
    variant = 'community' 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const {
        showLeftFade,
        showRightFade,
        scrollProps
    } = useScrollFades();

    const liked = useMemo(() => isLiked && review ? isLiked(review as Review) : false, [review, isLiked]);

    const legacyTrailId = review?.trail?.id;
    const legacyTrailName = review?.trail?.name;

    const trailData = useTrailsStore(
        useCallback(
            (s) => {
                if (!legacyTrailId && !legacyTrailName) return undefined;
                return s.data.find(
                    (t) =>
                        (legacyTrailId && t.id === legacyTrailId) ||
                        (legacyTrailName && t.general?.name?.toLowerCase() === legacyTrailName?.toLowerCase())
                );
            },
            [legacyTrailId, legacyTrailName]
        )
    );

    const hasTags = Boolean(
        review && (
            (review.perceivedDifficulty && review.perceivedDifficulty !== 'undefined') ||
            (review.trailMaintenance && review.trailMaintenance !== 'undefined') ||
            (review.difficultyFactors && review.difficultyFactors.length > 0) ||
            (review.favoredFactors && review.favoredFactors.length > 0)
        )
    );

    // Enable drag-to-scroll functionality on Web platforms
    useWebDragScroll(scrollRef, hasTags);

    if (!review) return null;

    const fallbackImage = getHeroImageSource(trailData);
    const imagesList = review?.image?.length > 0 ? review.image : [fallbackImage];
    const displayImage = imagesList[0];

    const getImgSource = (img: string | ImageSourcePropType): ImageSourcePropType => {
        return typeof img === 'string' ? { uri: img } : img;
    };

    const getInitials = (name: string): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatStat = (val: unknown, type: string): string => {
        if (val === undefined || val === null || val === '--' || isNaN(Number(val))) return '--';

        const numVal = Number(val);

        if (type === 'distance') {
            if (numVal < 1000) return `${Math.round(numVal)} m`;
            return `${(numVal / 1000).toFixed(2)} km`;
        }

        if (type === 'elevation') {
            return `${Math.round(numVal)} m`;
        }

        if (type === 'duration') {
            return formatDuration(numVal);
        }

        return String(val);
    };

    const getDifficultyStyle = (diff: string) => {
        switch (diff) {
            case 'Easy':
            case 'Just Right':
                return { bg: Colors.STATUS_APPROVED_BG, border: Colors.STATUS_APPROVED_BORDER, text: Colors.STATUS_APPROVED_TEXT, icon: 'emoticon-happy-outline' as const };
            case 'Moderate':
                return { bg: Colors.STATUS_WARNING_BG, border: Colors.STATUS_WARNING_BORDER, text: Colors.STATUS_WARNING_TEXT, icon: 'emoticon-neutral-outline' as const };
            case 'Hard':
            case 'Extreme':
                return { bg: Colors.STATUS_CANCELLED_BG, border: Colors.STATUS_CANCELLED_BORDER, text: Colors.STATUS_CANCELLED_TEXT, icon: 'emoticon-sad-outline' as const };
            default:
                return { bg: Colors.STATUS_PENDING_BG, border: Colors.STATUS_PENDING_BORDER, text: Colors.STATUS_PENDING_TEXT, icon: 'image-filter-hdr' as const };
        }
    };

    const getMaintenanceStyle = (maint: string) => {
        switch (maint) {
            case 'Easy':
                return { label: 'Well-maintained', bg: Colors.STATUS_APPROVED_BG, border: Colors.STATUS_APPROVED_BORDER, text: Colors.STATUS_APPROVED_TEXT, icon: 'check-circle' };
            case 'Moderate':
                return { label: 'Damaged but usable', bg: Colors.STATUS_WARNING_BG, border: Colors.STATUS_WARNING_BORDER, text: Colors.STATUS_WARNING_TEXT, icon: 'alert-triangle' };
            case 'Extreme':
                return { label: 'Critical / Unusable', bg: Colors.STATUS_CANCELLED_BG, border: Colors.STATUS_CANCELLED_BORDER, text: Colors.STATUS_CANCELLED_TEXT, icon: 'x-circle' };
            default:
                return { label: maint, bg: Colors.STATUS_PENDING_BG, border: Colors.STATUS_PENDING_BORDER, text: Colors.STATUS_PENDING_TEXT, icon: 'info' };
        }
    };

    const allTags: any[] = [];
    if (review.perceivedDifficulty && review.perceivedDifficulty !== 'undefined') {
        allTags.push({ id: `diff-main`, type: 'difficulty', value: review.perceivedDifficulty, style: getDifficultyStyle(review.perceivedDifficulty) });
    }
    if (review.trailMaintenance && review.trailMaintenance !== 'undefined') {
        allTags.push({ id: `maint-main`, type: 'maintenance', label: getMaintenanceStyle(review.trailMaintenance).label, style: getMaintenanceStyle(review.trailMaintenance) });
    }
    review.difficultyFactors?.forEach((f: string) => allTags.push({ id: `factor-diff-${f}`, type: 'factor-diff', value: f }));
    review.favoredFactors?.forEach((f: string) => allTags.push({ id: `factor-fav-${f}`, type: 'factor-fav', value: f }));

    const likeCount = Array.isArray(review.likes)
        ? review.likes.length
        : Number(review.likes) || 0;

    const reviewText = review?.review || "";
    const maxLength = 110;
    const isLong = reviewText.length > maxLength;
    const truncatedText = isLong ? reviewText.substring(0, maxLength).replace(/\s+$/, '') + '...' : reviewText;
    const displayText = isExpanded ? reviewText : truncatedText;

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
                            {formatDateToStandard(review?.createdAt || review?.hikeDate || new Date())}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.headerRight}>

                    <View style={styles.headerRatingBadge}>
                        <CustomIcon library="Ionicons" name="star" size={14} color={Colors.YELLOW} />
                        <CustomText variant="label" style={styles.headerRatingText}>
                            {review?.overallRating ? review.overallRating.toFixed(1) : '--'}
                        </CustomText>
                    </View>

                    <Pressable
                        onPress={onLike}
                        style={[styles.headerLikeBadge, liked ? styles.headerLikeBadgeActive : styles.headerLikeBadgeInactive]}
                    >
                        <CustomIcon
                            library="Ionicons"
                            name={liked ? "heart" : "heart-outline"}
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

                    {variant === 'profile' && (
                        <TouchableOpacity onPress={onEdit} style={styles.editIconButton} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="edit-2" size={18} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={styles.imageWrapper}
                activeOpacity={0.9}
                onPress={() => setIsPreviewVisible(true)}
            >
                <CustomImage source={getImgSource(displayImage)} style={styles.postImage} resizeMode="cover" />

                <LinearGradient colors={['transparent', `${Colors.BLACK}99`, `${Colors.BLACK}E6`]} style={styles.gradientOverlay}>
                    <View style={styles.headerTextColumn}>
                        <CustomText variant="h2" style={styles.mountainTitleOverlay}>
                            {review.trail?.name || (review as any).trailName || "Mountain Name"}
                        </CustomText>

                        <View style={styles.locationRow}>
                            <CustomIcon library="FontAwesome6" name="location-dot" size={10} color={Colors.TEXT_INVERSE} />
                            <CustomText variant="caption" style={styles.locationTextOverlay} numberOfLines={1}>
                                {review.trail?.location || (review as any).location || "Philippines"}
                            </CustomText>
                        </View>
                    </View>

                    {imagesList.length > 1 && (
                        <View style={styles.imageCountBadge}>
                            <CustomText variant='label' style={styles.imageCountText}>{`+${imagesList.length}`}</CustomText>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
                <StatItem
                    label="Distance"
                    value={formatStat(review.distance, 'distance')}
                    icon="map-outline"
                    lib="Ionicons"
                    style={styles.threeColStat}
                />
                <View style={styles.verticalDivider} />
                <StatItem
                    label="Elevation"
                    value={formatStat(review.elevation, 'elevation')}
                    icon="trending-up"
                    lib="Feather"
                    style={styles.threeColStat}
                />
                <View style={styles.verticalDivider} />
                <StatItem
                    label="Duration"
                    value={formatStat(review.duration, 'duration')}
                    icon="time-outline"
                    lib="Ionicons"
                    style={styles.threeColStat}
                />
            </View>

            {(hasTags || !!reviewText) && <View style={styles.horizontalDivider} />}

            {hasTags && (
                <View style={[styles.tagsWrapper, !reviewText && { marginBottom: 0 }]}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsContainer}
                        {...scrollProps}
                    >
                        {allTags.map(tag => {
                            if (tag.type === 'difficulty') {
                                return (
                                    <View key={tag.id} style={[styles.statusPill, { backgroundColor: tag.style.bg, borderColor: tag.style.border }]}>
                                        <CustomIcon library="MaterialCommunityIcons" name={tag.style.icon} size={14} color={tag.style.text} />
                                        <CustomText style={[styles.statusPillText, { color: tag.style.text }]}>{tag.value}</CustomText>
                                    </View>
                                );
                            }
                            if (tag.type === 'maintenance') {
                                return (
                                    <View key={tag.id} style={[styles.statusPill, { backgroundColor: tag.style.bg, borderColor: tag.style.border }]}>
                                        <CustomIcon library="Feather" name={tag.style.icon} size={12} color={tag.style.text} />
                                        <CustomText style={[styles.statusPillText, { color: tag.style.text }]}>{tag.label}</CustomText>
                                    </View>
                                );
                            }
                            if (tag.type === 'factor-diff') {
                                return (
                                    <View key={tag.id} style={styles.difficultyChip}>
                                        <CustomText style={styles.difficultyChipText}>{tag.value}</CustomText>
                                    </View>
                                );
                            }
                            if (tag.type === 'factor-fav') {
                                return (
                                    <View key={tag.id} style={styles.favoredChip}>
                                        <CustomText style={styles.favoredChipText}>{tag.value}</CustomText>
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </ScrollView>

                    {showLeftFade && (
                        <LinearGradient
                            colors={[Colors.WHITE, Colors.WHITE_FADE, Colors.WHITE_TRANSPARENT]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.leftFade}
                            pointerEvents="none"
                        />
                    )}

                    {showRightFade && (
                        <LinearGradient
                            colors={[Colors.WHITE_TRANSPARENT, Colors.WHITE_FADE, Colors.WHITE]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.rightFade}
                            pointerEvents="none"
                        />
                    )}
                </View>
            )}

            {!!reviewText && (
                <View style={styles.textBody}>
                    <CustomText variant="body" style={styles.reviewContent}>
                        {displayText}
                        {isLong && !isExpanded && (
                            <CustomText style={styles.showMoreActionInline} onPress={() => setIsExpanded(true)}>
                                {" "}Show More
                            </CustomText>
                        )}
                        {isExpanded && isLong && (
                            <CustomText style={styles.showMoreActionInline} onPress={() => setIsExpanded(false)}>
                                {" "}Show Less
                            </CustomText>
                        )}
                    </CustomText>
                </View>
            )}

            <ImagePreviewModal visible={isPreviewVisible} images={imagesList as any} onClose={() => setIsPreviewVisible(false)} />
        </View>
    );
};

const StatItem = ({
    label,
    value,
    icon,
    lib,
    iconColor = Colors.PRIMARY,
    style
}: {
    label: string,
    value: string,
    icon: string,
    lib: IconLibrary,
    iconColor?: string,
    style?: StyleProp<ViewStyle>
}) => (
    <View style={[styles.statBox, style]}>
        <View style={styles.statTopRow}>
            <CustomIcon library={lib} name={icon} size={16} color={iconColor} />
            <CustomText variant="caption" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>
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
        ...GlobalStyles.dropShadow(3, 0.05, Colors.SHADOW, { radius: 8 }),
        overflow: 'hidden',
        padding: 16,
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
    headerRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_WARNING_BG,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    headerRatingText: {
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
    editIconButton: {
        padding: 4,
        marginLeft: 4,
    },
    imageWrapper: {
        position: 'relative',
        height: 200,
        width: '100%',
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
        textShadowColor: `${Colors.BLACK}BF`,
        textShadowOffset: {
            width: 0,
            height: 1,
        },
        textShadowRadius: 4,
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
        textShadowColor: `${Colors.BLACK}BF`,
        textShadowOffset: {
            width: 0,
            height: 1,
        },
        textShadowRadius: 4,
    },
    imageCountBadge: {
        backgroundColor: `${Colors.BLACK}A6`,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountText: {
        color: Colors.TEXT_INVERSE,
        marginTop: -2,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
        backgroundColor: Colors.GRAY_LIGHT,
        flex: 0,
        marginHorizontal: 4,
    },
    threeColStat: {
        flex: 1,
    },
    horizontalDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        width: '100%',
        marginBottom: 12,
    },
    tagsWrapper: {
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        ...Platform.select({
            web: {
                isolation: 'isolate',
            },
        }),
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    leftFade: {
        position: 'absolute',
        left: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    rightFade: {
        position: 'absolute',
        right: -2,
        top: 0,
        bottom: 0,
        width: 40,
        zIndex: 2,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    difficultyChip: {
        backgroundColor: Colors.STATUS_WARNING_BG,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_WARNING_BORDER,
    },
    difficultyChipText: {
        fontSize: 11,
        color: Colors.STATUS_WARNING_TEXT,
        fontWeight: '600',
    },
    favoredChip: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    favoredChipText: {
        fontSize: 11,
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '600',
    },
    moreTagsChip: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    moreTagsText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    textBody: {
        paddingBottom: 0,
        width: '100%',
    },
    reviewContent: {
        fontSize: 12,
        lineHeight: 22,
        color: Colors.TEXT_SECONDARY,
        flexShrink: 1,
    },
    showMoreActionInline: {
        fontSize: 12,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: Colors.PRIMARY,
    },
});

export default React.memo(PostCard, (prevProps, nextProps) => {
    const prevLiked = prevProps.isLiked && prevProps.review ? prevProps.isLiked(prevProps.review as Review) : false;
    const nextLiked = nextProps.isLiked && nextProps.review ? nextProps.isLiked(nextProps.review as Review) : false;

    return prevProps.review === nextProps.review &&
        prevProps.variant === nextProps.variant &&
        prevLiked === nextLiked;
});
