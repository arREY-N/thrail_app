import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const StatCard = ({ title, count, icon, library, color = Colors.PRIMARY, onPress }) => (
    <TouchableOpacity 
        style={styles.statCard} 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
            <CustomIcon library={library} name={icon} size={20} color={color} />
        </View>
        <CustomText variant="h2" style={styles.statCount}>
            {count}
        </CustomText>
        <CustomText variant="caption" style={styles.statTitle}>
            {title}
        </CustomText>
    </TouchableOpacity>
);

const NavItem = ({ title, subtitle, icon, library = "Feather", onPress, badgeCount, color = Colors.PRIMARY }) => (
    <TouchableOpacity 
        style={styles.navItem} 
        onPress={onPress} 
        activeOpacity={0.7}
    >
        <View style={[styles.navIconWrapper, { backgroundColor: `${color}15` }]}>
            <CustomIcon library={library} name={icon} size={20} color={color} />
        </View>
        <View style={styles.navTextWrapper}>
            <CustomText variant="body" style={styles.navTitle}>
                {title}
            </CustomText>
            <CustomText variant="caption" style={styles.navSubtitle}>
                {subtitle}
            </CustomText>
        </View>
        
        {badgeCount > 0 && (
            <View style={styles.badge}>
                <CustomText variant="caption" style={styles.badgeText}>
                    {badgeCount}
                </CustomText>
            </View>
        )}
        
        <CustomIcon 
            library="Feather" 
            name="chevron-right" 
            size={20} 
            color={Colors.GRAY_MEDIUM} 
        />
    </TouchableOpacity>
);

const DashboardScreen = ({
    businesses,
    trails,
    superadmin,
    admin,
    users,
    mountains,
    pendingApplication,
    onManageBusinessPress,
    onManageTrailsPress,
    onManageUsersPress,
    onManageMountainPress,
    onManageApplicationPress,
    onBackPress
}) => {
    
    const totalUsers = (users?.length || 0) + (admin?.length || 0) + (superadmin?.length || 0);
    const pendingCount = pendingApplication?.length || 0;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Superadmin Dashboard" 
                centerTitle={true} 
                onBackPress={onBackPress}
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                {pendingCount > 0 ? (
                    <TouchableOpacity 
                        style={styles.alertBanner} 
                        activeOpacity={0.8}
                        onPress={onManageApplicationPress}
                    >
                        <View style={styles.alertIcon}>
                            <CustomIcon 
                                library="Feather" 
                                name="bell" 
                                size={20} 
                                color={Colors.STATUS_PENDING_TEXT} 
                            />
                        </View>
                        <View style={styles.alertTextWrapper}>
                            <CustomText variant="label" style={styles.alertTitle}>
                                Action Required
                            </CustomText>
                            <CustomText variant="caption" style={styles.alertSubtitle}>
                                You have {pendingCount} pending {pendingCount === 1 ? 'application' : 'applications'} to review.
                            </CustomText>
                        </View>
                        <CustomIcon 
                            library="Feather" 
                            name="arrow-right" 
                            size={18} 
                            color={Colors.STATUS_PENDING_TEXT} 
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.successBanner}>
                        <CustomIcon 
                            library="Feather" 
                            name="check-circle" 
                            size={18} 
                            color={Colors.SUCCESS} 
                        />
                        <CustomText variant="caption" style={styles.successText}>
                            All caught up! No pending applications.
                        </CustomText>
                    </View>
                )}

                <CustomText variant="h3" style={styles.sectionTitle}>
                    Platform Metrics
                </CustomText>
                
                <View style={styles.statsGrid}>
                    <StatCard 
                        title="Total Users" 
                        count={totalUsers} 
                        icon="users" 
                        library="Feather" 
                        color={Colors.PRIMARY}
                        onPress={onManageUsersPress}
                    />
                    <StatCard 
                        title="Tour Guides" 
                        count={businesses?.length || 0} 
                        icon="briefcase" 
                        library="Feather" 
                        color="#0284C7" 
                        onPress={onManageBusinessPress}
                    />
                    <StatCard 
                        title="Active Trails" 
                        count={trails?.length || 0} 
                        icon="map" 
                        library="Feather" 
                        color="#D97706" 
                        onPress={onManageTrailsPress}
                    />
                    <StatCard 
                        title="Mountains" 
                        count={mountains?.length || 0} 
                        icon="mountain" 
                        library="FontAwesome5" 
                        color="#059669" 
                        onPress={onManageMountainPress}
                    />
                </View>

                <View style={styles.divider} />

                <CustomText variant="h3" style={styles.sectionTitle}>
                    Management
                </CustomText>
                
                <View style={styles.navContainer}>
                    <NavItem 
                        title="Applications" 
                        subtitle="Review guide and partnership requests"
                        icon="file-text"
                        color={pendingCount > 0 ? Colors.ERROR : Colors.PRIMARY}
                        badgeCount={pendingCount}
                        onPress={onManageApplicationPress}
                    />
                    <NavItem 
                        title="Tour Businesses" 
                        subtitle="Manage verified providers and guides"
                        icon="briefcase"
                        color="#0284C7"
                        onPress={onManageBusinessPress}
                    />
                    <NavItem 
                        title="Trails & Routes" 
                        subtitle="Edit trail details, difficulty, and paths"
                        icon="map"
                        color="#D97706"
                        onPress={onManageTrailsPress}
                    />
                    <NavItem 
                        title="Mountains Database" 
                        subtitle="Manage mountain peaks and locations"
                        icon="mountain"
                        library="FontAwesome5"
                        color="#059669"
                        onPress={onManageMountainPress}
                    />
                    <NavItem 
                        title="User Accounts" 
                        subtitle="Manage hikers, admins, and access levels"
                        icon="users"
                        color={Colors.PRIMARY}
                        onPress={onManageUsersPress}
                    />
                </View>
                
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    
    // Alert Banners
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_PENDING_BG,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
    },
    alertIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertTextWrapper: {
        flex: 1,
    },
    alertTitle: {
        color: Colors.STATUS_PENDING_TEXT,
        marginBottom: 2,
    },
    alertSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        gap: 8,
    },
    successText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '500',
    },

    // Typography
    sectionTitle: {
        marginBottom: 16,
        color: Colors.TEXT_PRIMARY,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%', 
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statCount: {
        fontSize: 28,
        marginBottom: 4,
    },
    statTitle: {
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 0.5,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 24,
    },

    // Nav List
    navContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    navIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    navTextWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    navTitle: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    navSubtitle: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 12,
        lineHeight: 16,
        paddingRight: 8,
    },
    
    // Fixed Badge Styling
    badge: {
        backgroundColor: Colors.ERROR,
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        paddingHorizontal: 6,
    },
    badgeText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
        textAlign: 'center',
        includeFontPadding: false,
        lineHeight: 16,
    }
});

export default DashboardScreen;