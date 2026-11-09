/**
 * @file GuideProfileModal.tsx
 * @description Card modal presenting public credentials, role badges, verified Government Valid ID,
 * and outdoor experience for tour organizers and mountain guides. Dismissible via backdrop tap or top-right close icon.
 */

import React, { useEffect, useState } from 'react';
import {
    Animated,
    Image,
    ImageSourcePropType,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { User, UserRepo } from '@/src/core/models/User/User';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Configurable blur intensity when previewing Owner and Admin Valid ID images in ImagePreviewModal.
 * Set to 0 for no blur, 5–8 for moderate privacy blur, or 12+ for heavy blur.
 */
export const VALID_ID_PREVIEW_BLUR_RADIUS = 6;

/**
 * Props for the GuideProfileModal component.
 *
 * @param visible - Whether the modal dialog is currently visible.
 * @param onClose - Callback to close/dismiss the modal.
 * @param userId - Firestore document ID of the user to inspect.
 * @param businessName - Name of the affiliated tour business.
 * @param roleBadge - Role distinction: 'OWNER' or 'COORDINATOR'.
 * @param initialData - Fallback profile data to display while loading.
 * @param validIdTitle - Title of the verified government ID on file (e.g., Postal ID, Multi-Purpose ID, National ID).
 * @param validIdSource - Local image source for the verified government ID.
 */
export interface GuideProfileModalProps {
    visible: boolean;
    onClose: () => void;
    userId?: string;
    businessName?: string;
    roleBadge?: 'OWNER' | 'COORDINATOR';
    initialData?: {
        name?: string;
        username?: string;
        email?: string;
    };
    validIdTitle?: string;
    validIdSource?: ImageSourcePropType;
}

/**
 * GuideProfileModal — Lightweight public credentials card for tour coordinators and organizers.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the profile modal dialog
 */
const GuideProfileModal: React.FC<GuideProfileModalProps> = ({
    visible,
    onClose,
    userId,
    businessName,
    roleBadge = 'COORDINATOR',
    initialData,
    validIdTitle,
    validIdSource,
}) => {
    const [fetchedData, setFetchedData] = useState<{ id: string; user: User | null } | null>(null);
    const [previewIdSource, setPreviewIdSource] = useState<ImageSourcePropType | null>(null);
    const [renderModal, setRenderModal] = useState<boolean>(visible);
    if (visible && !renderModal) {
        setRenderModal(true);
    }
    const [animValue] = useState(() => new Animated.Value(0));

    const [prevVisible, setPrevVisible] = useState(visible);
    if (visible !== prevVisible) {
        setPrevVisible(visible);
        if (visible) {
            setRenderModal(true);
        } else {
            setPreviewIdSource(null);
        }
    }

    useEffect(() => {
        if (visible) {
            animValue.setValue(0);
            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, animValue]);

    // Physical Escape key dismissal on Web
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, onClose]);

    // Retain last-known member profile data so during exit animation (when parent clears selectedMember),
    // the modal preserves the current profile rather than flashing empty/default fallback states.
    const [lastKnown, setLastKnown] = useState<{
        userId?: string;
        roleBadge: 'OWNER' | 'COORDINATOR';
        initialData?: GuideProfileModalProps['initialData'];
        validIdTitle?: string;
        validIdSource?: ImageSourcePropType;
    }>({
        userId,
        roleBadge,
        initialData,
        validIdTitle,
        validIdSource,
    });

    if (
        visible &&
        (userId !== lastKnown.userId ||
            roleBadge !== lastKnown.roleBadge ||
            initialData !== lastKnown.initialData ||
            validIdTitle !== lastKnown.validIdTitle ||
            validIdSource !== lastKnown.validIdSource)
    ) {
        setLastKnown({
            userId,
            roleBadge,
            initialData,
            validIdTitle,
            validIdSource,
        });
    }

    const effectiveUserId = visible ? userId : lastKnown.userId;
    const effectiveRoleBadge = visible ? roleBadge : lastKnown.roleBadge;
    const effectiveInitialData = visible ? initialData : lastKnown.initialData;
    const effectiveValidIdTitle = visible ? validIdTitle : lastKnown.validIdTitle;
    const effectiveValidIdSource = visible ? validIdSource : lastKnown.validIdSource;

    const user = (fetchedData && fetchedData.id === effectiveUserId) ? fetchedData.user : null;
    const isLoading = Boolean(visible && effectiveUserId && (!fetchedData || fetchedData.id !== effectiveUserId));

    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;

    useEffect(() => {
        if (!visible || !userId) return;

        let isMounted = true;

        UserRepo.fetchById(userId)
            .then((fetchedUser) => {
                if (isMounted) {
                    setFetchedData({ id: userId, user: fetchedUser });
                }
            })
            .catch(() => {
                if (isMounted) {
                    setFetchedData({ id: userId, user: null });
                }
            });

        return () => {
            isMounted = false;
        };
    }, [visible, userId]);

    if (!renderModal) return null;

    // Derived identity values
    const rawFullName = user
        ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
        : effectiveInitialData?.name || 'Tour Coordinator';
    const fullName = rawFullName || 'Tour Coordinator';

    const username = user?.username || effectiveInitialData?.username || '';
    const email = user?.email || effectiveInitialData?.email || '';
    const profileImage = user?.profileImage;
    const initials = getInitials(fullName);

    // Derived outdoor background values from preferences
    const experienceLevel = user?.preferences?.experience
        ? `${user.preferences.experience} Hiker`
        : 'Experienced Mountain Guide';
    const hikerStatus = user?.preferences?.hiked
        ? 'Active Mountain Hiker'
        : 'Registered Guide Personnel';

    const provinces = Array.isArray(user?.preferences?.province)
        ? user.preferences.province
        : typeof user?.preferences?.province === 'string'
            ? [user.preferences.province]
            : [];

    const isOwner = effectiveRoleBadge === 'OWNER';

    return (
        <Modal
            transparent={true}
            visible={renderModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.backdropAnimated, { opacity: animValue }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={onClose}
                        accessibilityLabel="Close profile modal backdrop"
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.modalCard,
                        isWide && styles.modalCardWide,
                        {
                            opacity: animValue,
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [40, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {/* TOP-RIGHT CLOSE BUTTON */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Close profile modal"
                    >
                        <CustomIcon
                            library="Feather"
                            name="x"
                            size={20}
                            color={Colors.TEXT_SECONDARY}
                        />
                    </TouchableOpacity>

                    {/* 1. AVATAR & HEADER IDENTITY */}
                    <View style={styles.headerSection}>
                        {isLoading && !user ? (
                            <SkeletonEffect style={styles.skeletonAvatar} />
                        ) : profileImage ? (
                            <Image
                                source={{ uri: profileImage }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <View style={[styles.avatarCircle, isOwner && styles.avatarCircleOwner]}>
                                <CustomText style={[styles.avatarInitials, isOwner && styles.avatarInitialsOwner]}>
                                    {initials}
                                </CustomText>
                            </View>
                        )}

                        <CustomText
                            variant="h3"
                            style={styles.fullNameText}
                            numberOfLines={1}
                        >
                            {fullName}
                        </CustomText>

                        {Boolean(username) && (
                            <CustomText
                                variant="caption"
                                style={styles.usernameText}
                                numberOfLines={1}
                            >
                                {`@${username}`}
                            </CustomText>
                        )}

                        {/* BADGES ROW */}
                        <View style={styles.badgeRow}>
                            <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
                                <CustomIcon
                                    library="Feather"
                                    name={isOwner ? 'shield' : 'check-circle'}
                                    size={11}
                                    color={isOwner ? Colors.WHITE : Colors.SUCCESS}
                                />
                                <CustomText
                                    variant="caption"
                                    style={[styles.roleBadgeText, isOwner && styles.roleBadgeTextOwner]}
                                >
                                    {isOwner ? 'Business Owner' : 'Certified Guide'}
                                </CustomText>
                            </View>

                            {Boolean(businessName) && (
                                <View style={styles.orgBadge}>
                                    <CustomIcon
                                        library="Feather"
                                        name="briefcase"
                                        size={11}
                                        color={Colors.TEXT_SECONDARY}
                                    />
                                    <CustomText
                                        variant="caption"
                                        style={styles.orgBadgeText}
                                        numberOfLines={1}
                                    >
                                        {businessName}
                                    </CustomText>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* 2. ROLE & CREDENTIALS SECTION */}
                    <View style={styles.contentSection}>
                        <CustomText
                            variant="caption"
                            style={styles.sectionTitle}
                        >
                            ROLE &amp; CREDENTIALS
                        </CustomText>

                        <View style={styles.dataRow}>
                            <CustomText
                                variant="caption"
                                style={styles.dataLabel}
                            >
                                Position
                            </CustomText>
                            <CustomText
                                variant="label"
                                style={styles.dataValue}
                            >
                                {isOwner
                                    ? 'Registered Business Representative'
                                    : 'Tour Coordinator & Guide'}
                            </CustomText>
                        </View>

                        {Boolean(email) && (
                            <View style={styles.dataRow}>
                                <CustomText
                                    variant="caption"
                                    style={styles.dataLabel}
                                >
                                    Official Email
                                </CustomText>
                                <CustomText
                                    variant="label"
                                    style={styles.dataValue}
                                    numberOfLines={1}
                                >
                                    {email}
                                </CustomText>
                            </View>
                        )}

                        {Boolean(effectiveValidIdSource) && (
                            <View style={styles.validIdRow}>
                                <View style={styles.validIdLeft}>
                                    <View style={styles.validIdTitleWrap}>
                                        <CustomText
                                            variant="caption"
                                            style={styles.dataLabel}
                                        >
                                            Valid ID
                                        </CustomText>
                                        <View style={styles.verifiedIdChip}>
                                            <CustomIcon
                                                library="Feather"
                                                name="check"
                                                size={10}
                                                color={Colors.SUCCESS}
                                            />
                                            <CustomText
                                                variant="caption"
                                                style={styles.verifiedIdChipText}
                                            >
                                                Verified
                                            </CustomText>
                                        </View>
                                    </View>
                                    <CustomText
                                        variant="label"
                                        style={styles.validIdTypeText}
                                    >
                                        {effectiveValidIdTitle || 'Government Valid ID'}
                                    </CustomText>
                                </View>

                                <TouchableOpacity
                                    style={styles.viewIdButton}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (effectiveValidIdSource) {
                                            setPreviewIdSource(effectiveValidIdSource);
                                        }
                                    }}
                                >
                                    <CustomText
                                        variant="caption"
                                        style={styles.viewIdButtonText}
                                    >
                                        View ID
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* 3. OUTDOOR BACKGROUND SECTION */}
                    <View style={styles.contentSection}>
                        <CustomText
                            variant="caption"
                            style={styles.sectionTitle}
                        >
                            OUTDOOR BACKGROUND
                        </CustomText>

                        {isLoading && !user ? (
                            <View style={styles.skeletonSection}>
                                <SkeletonEffect style={styles.skeletonLine} />
                                <SkeletonEffect style={styles.skeletonLineShort} />
                            </View>
                        ) : (
                            <>
                                <View style={styles.dataRow}>
                                    <CustomText
                                        variant="caption"
                                        style={styles.dataLabel}
                                    >
                                        Experience Level
                                    </CustomText>
                                    <CustomText
                                        variant="label"
                                        style={styles.dataValue}
                                    >
                                        {experienceLevel}
                                    </CustomText>
                                </View>

                                <View style={styles.dataRow}>
                                    <CustomText
                                        variant="caption"
                                        style={styles.dataLabel}
                                    >
                                        Hiker Status
                                    </CustomText>
                                    <CustomText
                                        variant="label"
                                        style={styles.dataValue}
                                    >
                                        {hikerStatus}
                                    </CustomText>
                                </View>

                                {provinces.length > 0 && (
                                    <View style={styles.provincesBlock}>
                                        <CustomText
                                            variant="caption"
                                            style={styles.provincesTitle}
                                        >
                                            Familiar Mountain Areas
                                        </CustomText>
                                        <View style={styles.tagsWrap}>
                                            {provinces.map((prov) => (
                                                <View
                                                    key={`prov-${prov}`}
                                                    style={styles.tagPill}
                                                >
                                                    <CustomText
                                                        variant="caption"
                                                        style={styles.tagText}
                                                    >
                                                        {prov}
                                                    </CustomText>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </Animated.View>

                {/* Blurred Valid ID Full-Screen Image Preview Modal */}
                <ImagePreviewModal
                    visible={Boolean(previewIdSource)}
                    images={previewIdSource ? [previewIdSource] : []}
                    initialIndex={0}
                    blurRadius={VALID_ID_PREVIEW_BLUR_RADIUS}
                    onClose={() => setPreviewIdSource(null)}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdropAnimated: {
        ...StyleSheet.absoluteFill,
        backgroundColor: Colors.MODAL_OVERLAY,
    },
    backdropTouch: {
        flex: 1,
    },
    modalCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 24,
        width: '100%',
        maxWidth: 380,
        ...GlobalStyles.dropShadow(5, 0.12, Colors.SHADOW, { radius: 14 }),
    },
    modalCardWide: {
        maxWidth: 420,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 28,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 6,
        borderRadius: 999,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        zIndex: 10,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
        marginBottom: 10,
    },
    avatarCircleOwner: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.STATUS_APPROVED_BG,
    },
    avatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginBottom: 10,
    },
    skeletonAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginBottom: 10,
    },
    avatarInitials: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        letterSpacing: 1,
    },
    avatarInitialsOwner: {
        color: Colors.WHITE,
    },
    fullNameText: {
        textAlign: 'center',
        marginBottom: 2,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    usernameText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 8,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    roleBadgeOwner: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    roleBadgeTextOwner: {
        color: Colors.WHITE,
    },
    orgBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    orgBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    contentSection: {
        gap: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    dataLabel: {
        color: Colors.TEXT_SECONDARY,
        minWidth: 100,
        flexShrink: 0,
    },
    dataValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },
    validIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
    },
    validIdLeft: {
        flex: 1,
        gap: 2,
    },
    validIdTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    verifiedIdChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    verifiedIdChipText: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.SUCCESS,
    },
    validIdTypeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    viewIdButton: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    viewIdButtonText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
    },
    provincesBlock: {
        marginTop: 4,
        gap: 6,
    },
    provincesTitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    tagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tagPill: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tagText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    skeletonSection: {
        gap: 8,
        paddingVertical: 4,
    },
    skeletonLine: {
        width: '100%',
        height: 16,
        borderRadius: 8,
    },
    skeletonLineShort: {
        width: '60%',
        height: 16,
        borderRadius: 8,
    },
});

export default GuideProfileModal;
