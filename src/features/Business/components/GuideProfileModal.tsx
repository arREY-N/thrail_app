/**
 * @file GuideProfileModal.tsx
 * @description Card modal presenting public credentials, role badges, and outdoor experience
 * for tour organizers and mountain guides. Dismissible via backdrop tap or top-right close icon.
 */

import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import SkeletonEffect from '@/src/components/SkeletonEffect';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { User, UserRepo } from '@/src/core/models/User/User';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Props for the GuideProfileModal component.
 *
 * @param visible - Whether the modal dialog is currently visible.
 * @param onClose - Callback to close/dismiss the modal.
 * @param userId - Firestore document ID of the user to inspect.
 * @param businessName - Name of the affiliated tour business.
 * @param roleBadge - Role distinction: 'OWNER' or 'COORDINATOR'.
 * @param initialData - Fallback profile data to display while loading.
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
}) => {
    const [fetchedData, setFetchedData] = useState<{ id: string; user: User | null } | null>(null);

    const user = (fetchedData && fetchedData.id === userId) ? fetchedData.user : null;
    const isLoading = Boolean(visible && userId && (!fetchedData || fetchedData.id !== userId));

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

    if (!visible) return null;

    // Derived identity values
    const rawFullName = user
        ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
        : initialData?.name || 'Tour Coordinator';
    const fullName = rawFullName || 'Tour Coordinator';

    const username = user?.username || initialData?.username || '';
    const email = user?.email || initialData?.email || '';
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

    const isOwner = roleBadge === 'OWNER';

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
                accessibilityLabel="Close profile modal backdrop"
            >
                <TouchableOpacity
                    style={[styles.modalCard, isWide && styles.modalCardWide]}
                    activeOpacity={1}
                    onPress={(e) => {
                        e.stopPropagation?.();
                    }}
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
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
