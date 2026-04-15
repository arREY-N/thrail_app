import React, { useCallback, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const PersonnelListScreen = ({ 
    businessId, 
    businessAdmins, 
    onReloadPress, 
    onBackPress,
    onAddAdminPress
}) => {
    
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await onReloadPress(businessId);
        setRefreshing(false);
    }, [businessId, onReloadPress]);

    const AdminCard = ({ admin }) => {
        const initials = `${admin.firstname?.charAt(0) || ''}${admin.lastname?.charAt(0) || ''}`.trim().toUpperCase();
        
        const fullName = (admin.firstname || admin.lastname) 
            ? `${admin.firstname || ''} ${admin.lastname || ''}`.trim() 
            : '--';

        return (
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <CustomText style={styles.avatarText}>
                        {initials || '?'}
                    </CustomText>
                </View>
                
                <View style={styles.adminInfo}>
                    <CustomText variant="subtitle" style={styles.name}>
                        {fullName}
                    </CustomText>
                    <CustomText variant="caption" style={styles.subtext}>
                        @{admin.username || '--'}
                    </CustomText>
                    <CustomText variant="caption" style={styles.subtext}>
                        {admin.email || '--'}
                    </CustomText>
                    
                    <View style={styles.roleBadge}>
                        <CustomText style={styles.roleText}>
                            ADMIN
                        </CustomText>
                    </View>
                </View>
            </View>
        );
    };

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
                        {businessAdmins.map((admin) => (
                            <AdminCard key={admin.id} admin={admin} />
                        ))}
                    </View>
                )}

                <TouchableOpacity 
                    style={styles.reloadContainer} 
                    onPress={() => onReloadPress(businessId)}
                >
                    <CustomIcon 
                        library="Feather" 
                        name="refresh-cw" 
                        size={14} 
                        color={Colors.TEXT_SECONDARY} 
                    />
                    <CustomText style={styles.reloadText}>
                        RELOAD ADMINS
                    </CustomText>
                </TouchableOpacity>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const dropShadow = Platform.select({
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 6 
    },
    android: { elevation: 2 },
    web: { boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)' }
});

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40, 
    },
    headerAddBtn: { 
        paddingHorizontal: 16, 
        height: 32, 
        borderRadius: 16, 
        minWidth: 60, 
    },
    headerAddBtnText: { 
        fontSize: 13, 
        fontWeight: 'bold', 
    },
    list: { 
        gap: 12, 
    },
    card: { 
        flexDirection: 'row', 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 16, 
        alignItems: 'flex-start', 
        gap: 16, 
        ...dropShadow, 
    },
    avatar: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center', 
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
    name: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 16, 
    },
    subtext: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 12, 
    },
    roleBadge: { 
        alignSelf: 'flex-start', 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6, 
        marginTop: 4, 
    },
    roleText: { 
        color: Colors.STATUS_APPROVED_TEXT, 
        fontSize: 10, 
        fontWeight: 'bold', 
        textTransform: 'uppercase', 
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