/**
 * @file TopUserDetailModal.tsx
 * @description Interactive detail modal overlay displaying a top 1-3 hiker's complete stats breakdown and hike logs.
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { RankedUsers } from '@/src/core/models/Leaderboard/interfaces/ILeaderboard';
import { formatDateToStandard, getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties for TopUserDetailModal.
 * 
 * @param visible - Whether the modal is open
 * @param user - Currently selected top hiker data
 * @param onClose - Handler to dismiss the modal
 */
interface TopUserDetailModalProps {
    visible: boolean;
    user: RankedUsers<Date> | null;
    onClose: () => void;
    currentUserId?: string;
}

/**
 * TopUserDetailModal — Pop-up detail card presenting full stats breakdown when a top 3 mountain peak is tapped.
 * 
 * @param props - TopUserDetailModalProps
 * @returns {React.JSX.Element} The rendered detail modal.
 */
const TopUserDetailModal = ({
    visible,
    user,
    onClose,
    currentUserId,
}: TopUserDetailModalProps): React.JSX.Element => {
    if (!user) return <Modal visible={false} transparent animationType="fade" />;

    const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;
    const isCurrentUser = currentUserId ? user.userId === currentUserId : false;

    const rankBadgeColor =
        user.rank === 1
            ? Colors.LEADERBOARD_GOLD
            : user.rank === 2
            ? Colors.LEADERBOARD_SILVER
            : user.rank === 3
            ? Colors.LEADERBOARD_BRONZE
            : Colors.PRIMARY;

    const getRankTitle = () => {
        if (user.rank > 0 && user.rank <= 3) return `Peak #${user.rank} Champion`;
        if (user.rank > 3) return `Rank #${user.rank} Hiker`;
        return 'Unranked Hiker';
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContent}>
                    {/* Header Row with Close Button */}
                    <View style={styles.headerRow}>
                        <View style={[styles.rankBadgeHeader, { backgroundColor: rankBadgeColor }]}>
                            <CustomText variant="caption" style={styles.rankBadgeHeaderText}>
                                {getRankTitle()}
                            </CustomText>
                        </View>

                        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                            <CustomIcon library="Feather" name="x" size={22} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        {/* Avatar & User Details */}
                        <View style={styles.userHeader}>
                            <View style={[styles.avatarRing, { borderColor: rankBadgeColor }]}>
                                {user.profileImage ? (
                                    <CustomImage source={{ uri: user.profileImage }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarInitials}>
                                        <CustomText variant="h2" style={styles.avatarInitialsText}>
                                            {getInitials(fullName)}
                                        </CustomText>
                                    </View>
                                )}
                            </View>

                            <CustomText variant="h2" style={styles.nameText} numberOfLines={1}>
                                {fullName} {isCurrentUser && '(You)'}
                            </CustomText>
                            {fullName !== user.username && (
                                <CustomText variant="caption" style={styles.usernameText}>
                                    @{user.username}
                                </CustomText>
                            )}
                        </View>

                        {/* 3 Key Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <CustomIcon library="MaterialCommunityIcons" name="map-marker-distance" size={22} color={Colors.PRIMARY} />
                                <CustomText variant="h2" style={styles.statValue}>
                                    {user.totalDistance.toFixed(1)}
                                </CustomText>
                                <CustomText variant="caption" style={styles.statLabel}>
                                    km Hiked
                                </CustomText>
                            </View>

                            <View style={styles.statCard}>
                                <CustomIcon library="MaterialCommunityIcons" name="image-filter-hdr" size={22} color={Colors.PRIMARY} />
                                <CustomText variant="h2" style={styles.statValue}>
                                    {user.totalElevation.toLocaleString()}
                                </CustomText>
                                <CustomText variant="caption" style={styles.statLabel}>
                                    m Elevation
                                </CustomText>
                            </View>

                            <View style={styles.statCard}>
                                <CustomIcon library="MaterialCommunityIcons" name="hiking" size={22} color={Colors.PRIMARY} />
                                <CustomText variant="h2" style={styles.statValue}>
                                    {user.totalHikes}
                                </CustomText>
                                <CustomText variant="caption" style={styles.statLabel}>
                                    Completed
                                </CustomText>
                            </View>
                        </View>

                        {/* Recent Hike Records */}
                        <View style={styles.recordsSection}>
                            <CustomText variant="label" style={styles.sectionTitle}>
                                Monthly Hike Logs
                            </CustomText>

                            {user.hikingRecords && user.hikingRecords.length > 0 ? (
                                user.hikingRecords.map((record, idx) => (
                                    <View key={record.hikeId || idx} style={styles.recordRow}>
                                        <View style={styles.recordIconBox}>
                                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                        </View>
                                        <View style={styles.recordInfo}>
                                            <CustomText variant="body" style={styles.recordHikeId} numberOfLines={1}>
                                                Hike #{record.hikeId}
                                            </CustomText>
                                            <CustomText variant="caption" style={styles.recordDate}>
                                                {formatDateToStandard(record.hikeDate)}
                                            </CustomText>
                                        </View>
                                        <View style={styles.recordMetrics}>
                                            <CustomText variant="caption" style={styles.recordMetricText}>
                                                {record.distance.toFixed(1)} km • {record.elevation} m
                                            </CustomText>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <CustomText variant="caption" style={styles.noRecordsText}>
                                    No detailed hike logs recorded for this month.
                                </CustomText>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
    },
    modalContent: {
        width: '100%',
        maxWidth: 480,
        maxHeight: '82%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        ...GlobalStyles.dropShadow(5),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    rankBadgeHeader: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rankBadgeHeaderText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    scrollBody: {
        paddingBottom: 8,
    },
    userHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarRing: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(3),
    },
    avatarImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarInitials: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialsText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 0,
    },
    nameText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    usernameText: {
        color: Colors.TEXT_SECONDARY,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    statValue: {
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        marginTop: 4,
        marginBottom: 0,
        fontSize: 18,
    },
    statLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    recordsSection: {
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        paddingTop: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 8,
    },
    recordIconBox: {
        marginRight: 10,
    },
    recordInfo: {
        flex: 1,
    },
    recordHikeId: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    recordDate: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    recordMetrics: {
        alignItems: 'flex-end',
    },
    recordMetricText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    noRecordsText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
});

export default TopUserDetailModal;
