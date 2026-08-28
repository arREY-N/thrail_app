/**
 * @file PersonnelListScreen.tsx
 * @description Displays the list of admins for a business, allowing the business owner to add admins and refresh the list with visual indicators for the current user and roles.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Easing, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { IAdmin } from '@/src/core/models/Admin/Admin';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties of the PersonnelListScreen component.
 * 
 * @param businessId - The associated business entity ID.
 * @param businessAdmins - The array of current business admins.
 * @param ownerId - The ID of the business owner.
 * @param currentUserId - The ID of the currently logged-in administrator.
 * @param onReloadPress - Callback handler to refresh/reload the admins list.
 * @param onBackPress - Callback handler to navigate back.
 * @param onAddAdminPress - Callback handler to navigate to the Add Admin screen.
 */
export interface PersonnelListScreenProps {
    businessId: string;
    businessAdmins: IAdmin[];
    ownerId?: string;
    currentUserId?: string;
    onReloadPress: (businessId: string) => Promise<void>;
    onBackPress: () => void;
    onAddAdminPress: () => void;
}

/**
 * PersonnelListScreen — Displays the list of admins for the business.
 */
const PersonnelListScreen: React.FC<PersonnelListScreenProps> = ({
    businessId,
    businessAdmins,
    ownerId,
    currentUserId,
    onReloadPress,
    onBackPress,
    onAddAdminPress
}) => {

    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [isReloading, setIsReloading] = useState<boolean>(false);
    const [spinAnim] = useState(() => new Animated.Value(0));

    const sortedAdmins = useMemo(() => {
        return [...businessAdmins].sort((a, b) => {
            const aIsOwner = ownerId ? a.id === ownerId : false;
            const bIsOwner = ownerId ? b.id === ownerId : false;

            if (aIsOwner) return -1;
            if (bIsOwner) return 1;

            const aName = `${a.firstname || ''} ${a.lastname || ''}`.trim() || a.username || '';
            const bName = `${b.firstname || ''} ${b.lastname || ''}`.trim() || b.username || '';

            return aName.localeCompare(bName);
        });
    }, [businessAdmins, ownerId]);

    const startSpin = useCallback(() => {
        spinAnim.setValue(0);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [spinAnim]);

    const stopSpin = useCallback(() => {
        spinAnim.stopAnimation();
        spinAnim.setValue(0);
    }, [spinAnim]);

    const handleReload = async () => {
        if (isReloading) return;
        setIsReloading(true);
        startSpin();
        try {
            await onReloadPress(businessId);
        } finally {
            stopSpin();
            setIsReloading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        startSpin();
        try {
            await onReloadPress(businessId);
        } finally {
            stopSpin();
            setRefreshing(false);
        }
    }, [businessId, onReloadPress, startSpin, stopSpin]);

    const AdminCard = ({ admin }: { admin: IAdmin }) => {
        const isOwner = ownerId ? admin.id === ownerId : false;
        const isMe = currentUserId ? admin.id === currentUserId : false;

        const fullName = (admin.firstname || admin.lastname)
            ? `${admin.firstname || ''} ${admin.lastname || ''}`.trim()
            : '--';

        const initials = getInitials(fullName !== '--' ? fullName : admin.username);

        return (
            <View style={[styles.card, isMe && styles.cardHighlight]}>
                <View style={[styles.avatar, isMe && styles.avatarHighlight]}>
                    <CustomText style={styles.avatarText}>
                        {initials}
                    </CustomText>
                </View>

                <View style={styles.adminInfo}>
                    <View style={styles.nameRow}>
                        <CustomText variant="subtitle" style={styles.name} numberOfLines={1}>
                            {fullName}
                        </CustomText>
                        {isMe && (
                            <CustomText style={styles.meText}>
                                (You)
                            </CustomText>
                        )}
                    </View>

                    <CustomText variant="caption" style={styles.subtext}>
                        @{admin.username || '--'}
                    </CustomText>
                    <CustomText variant="caption" style={styles.subtext}>
                        {admin.email || '--'}
                    </CustomText>
                </View>

                <View style={styles.cardRight}>
                    {isOwner ? (
                        <View style={styles.ownerBadge}>
                            <CustomText style={styles.ownerText}>
                                OWNER
                            </CustomText>
                        </View>
                    ) : (
                        <View style={styles.roleBadge}>
                            <CustomText style={styles.roleText}>
                                ADMIN
                            </CustomText>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <CustomHeader
                title="Personnel"
                centerTitle={true}
                onBackPress={onBackPress}
                rightActions={
                    <CustomButton
                        title="Add"
                        onPress={onAddAdminPress}
                        variant="primary"
                        style={styles.headerAddBtn}
                        textStyle={styles.headerAddBtnText}
                    />
                }
            />

            <ResponsiveScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.PRIMARY]}
                    />
                }
            >
                <View style={styles.constrainer}>
                    {businessAdmins.length === 0 ? (
                        <View style={styles.emptyState}>
                            <CustomIcon
                                library="Feather"
                                name="users"
                                size={40}
                                color={Colors.GRAY_MEDIUM}
                            />
                            <CustomText style={styles.emptyText}>
                                No admins found.
                            </CustomText>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {sortedAdmins.map((admin) => (
                                <AdminCard key={admin.id} admin={admin} />
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.reloadContainer}
                        onPress={handleReload}
                        disabled={isReloading}
                    >
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <CustomIcon
                                library="Feather"
                                name="refresh-cw"
                                size={14}
                                color={Colors.TEXT_SECONDARY}
                            />
                        </Animated.View>
                        <CustomText style={styles.reloadText}>
                            {isReloading ? "RELOADING..." : "RELOAD ADMINS"}
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        flex: 1,
    },
    headerAddBtn: {
        paddingHorizontal: 16,
        paddingVertical: 0,
        height: 32,
        width: 70,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    headerAddBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        // marginTop: -2,
    },
    list: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.STATUS_APPROVED_BG,
    },
    avatarText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 18,
    },
    adminInfo: {
        flex: 1,
        gap: 2,
    },

    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        flexShrink: 1,
        marginBottom: 0,
    },
    subtext: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    cardHighlight: {
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    avatarHighlight: {
        borderColor: Colors.PRIMARY,
    },
    meText: {
        color: Colors.PRIMARY,
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    ownerBadge: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ownerText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    roleBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    roleText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardRight: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    },
    reloadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    reloadText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});

export default PersonnelListScreen;
