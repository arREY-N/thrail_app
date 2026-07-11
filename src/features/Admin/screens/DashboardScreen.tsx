/**
 * @file DashboardScreen.tsx
 * @description Screen displaying organization profile details, admin staff details, and action buttons.
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the DashboardScreen component.
 * 
 * @param businessAccount - The business profile information.
 * @param onManageAdminsPress - Callback to navigate to admin staff management.
 * @param onManageOffersPress - Callback to navigate to business offers management.
 * @param onManageTrailsPress - Callback to navigate to trail management list.
 * @param adminProfile - Profile information of the logged-in admin.
 * @param error - Optional error message to display.
 * @param onBackPress - Callback for the back navigation button.
 * @param isLoading - Optional loading state flag.
 * @param onRetryPress - Callback when retry button is pressed in error state.
 */
export interface DashboardScreenProps {
    businessAccount?: any; 
    onManageAdminsPress: () => void; 
    onManageOffersPress: () => void;
    onManageTrailsPress: () => void;
    adminProfile?: any; 
    error?: string | null;
    onBackPress: () => void; 
    isLoading?: boolean;
    onRetryPress?: () => void;
}

/**
 * DashboardScreen — Main admin dashboard displaying business profile, admin info, and quick actions.
 */
const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
    businessAccount, 
    onManageAdminsPress, 
    onManageOffersPress,
    onManageTrailsPress,
    adminProfile, 
    error,
    onBackPress,
    isLoading = false,
    onRetryPress
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    const insets = useSafeAreaInsets();

    const InfoRow = ({ label, value, noMargin }: { label: string, value: string | undefined | null, noMargin?: boolean }) => {
        const displayValue = value || 'N/A';
        return (
            <View style={[styles.inlineRow, noMargin && styles.noMargin]}>
                <CustomText style={styles.inlineLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</CustomText>
                <CustomText style={styles.inlineValue} numberOfLines={2} adjustsFontSizeToFit>{displayValue}</CustomText>
            </View>
        );
    };

    const formatAdminName = () => {
        if (!adminProfile) return '--';
        const fullName = `${adminProfile.firstname || ''} ${adminProfile.lastname || ''}`.trim();
        return fullName.length > 0 ? fullName : 'N/A';
    };

    const formatLocation = (locationData: string | string[]) => {
        if (!locationData) return 'N/A';
        if (Array.isArray(locationData)) {
            return locationData.join(', ');
        }
        return locationData; 
    };

    const renderBusinessCard = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <CustomIcon 
                    library="Feather" 
                    name="briefcase" 
                    size={18} 
                    color={Colors.PRIMARY} 
                />
                <CustomText variant="h3" style={styles.cardTitle}>
                    Business Profile
                </CustomText>
                <View style={[
                    styles.statusBadge, 
                    businessAccount?.active ? styles.statusActive : styles.statusArchived
                ]}>
                    <CustomText style={businessAccount?.active ? styles.statusTextActive : styles.statusTextArchived}>
                        {businessAccount?.active ? 'Active' : 'Archived'}
                    </CustomText>
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <InfoRow 
                    label="Business Name" 
                    value={businessAccount?.name} 
                />
                <InfoRow 
                    label="Address" 
                    value={businessAccount?.address} 
                />
                <InfoRow 
                    label="Serviced Location" 
                    value={formatLocation(businessAccount?.servicedLocation)}
                />
                <InfoRow 
                    label="Established" 
                    value={businessAccount?.establishedOn ? formatDate(businessAccount.establishedOn) : 'N/A'} 
                />
                <InfoRow 
                    label="Approved" 
                    value={businessAccount?.createdAt ? formatDate(businessAccount.createdAt) : 'N/A'} 
                    noMargin={true}
                />
            </View>
        </View>
    );

    const renderAdminCard = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <CustomIcon 
                    library="Feather" 
                    name="user" 
                    size={18} 
                    color={Colors.PRIMARY} 
                />
                <CustomText variant="h3" style={styles.cardTitle}>
                    My Admin Info
                </CustomText>
            </View>
            
            <View style={styles.cardBody}>
                <InfoRow 
                    label="Name" 
                    value={formatAdminName()} 
                />
                <InfoRow 
                    label="Username" 
                    value={adminProfile?.username} 
                />
                <InfoRow 
                    label="Email" 
                    value={adminProfile?.email} 
                />
                <InfoRow 
                    label="Address" 
                    value={adminProfile?.address} 
                    noMargin={true}
                />
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.webActionSection}>
            <CustomText variant="body" style={styles.actionTitle}>
                Quick Actions
            </CustomText>
            <View style={styles.webActionContainer}>
                <View style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Manage Trails & Maps"
                        onPress={onManageTrailsPress}
                        variant="secondary"
                    />
                </View>
                <View style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Manage Offers"
                        onPress={onManageOffersPress}
                        variant="primary"
                    />
                </View>
                <View style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Manage Personnel"
                        onPress={onManageAdminsPress}
                        variant="secondary" 
                    />
                </View>
            </View>
        </View>
    );

    const renderMobileStickyActions = () => {
        const safeBottomPadding = Math.max(insets.bottom, 16);

        return (
            <View style={[styles.stickyFooter, { paddingBottom: safeBottomPadding }]}>
                <CustomText variant="caption" style={styles.stickyFooterTitle}>
                    Quick Actions
                </CustomText>
                <View style={styles.stickyButtonRow}>
                    <TouchableOpacity 
                        style={[styles.stickyActionBtn, styles.secondaryStickyBtn]} 
                        onPress={onManageTrailsPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="map" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.secondaryStickyBtnText} numberOfLines={1} adjustsFontSizeToFit>Trails</CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.stickyActionBtn, styles.primaryStickyBtn]} 
                        onPress={onManageOffersPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Ionicons" name="pricetags" size={16} color={Colors.WHITE} />
                        <CustomText style={styles.primaryStickyBtnText} numberOfLines={1} adjustsFontSizeToFit>Offers</CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.stickyActionBtn, styles.secondaryStickyBtn]} 
                        onPress={onManageAdminsPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="users" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.secondaryStickyBtnText} numberOfLines={1} adjustsFontSizeToFit>Personnel</CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Admin Dashboard" 
                centerTitle={true}
                onBackPress={onBackPress} 
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <View style={styles.errorCard}>
                        <View style={styles.iconOuter}>
                            <View style={styles.iconInner}>
                                <CustomIcon
                                    library="Feather"
                                    name="alert-triangle"
                                    size={44}
                                    color={Colors.ERROR}
                                />
                            </View>
                        </View>

                        <CustomText variant="title" style={styles.errorTitle}>
                            Loading Failed
                        </CustomText>

                        <CustomText variant="body" style={styles.errorMessage}>
                            Failed to retrieve dashboard configurations. Please check your network connection and try again.
                            {"\n\n"}
                            <CustomText style={{ color: Colors.ERROR, fontWeight: '600' }}>
                                {error}
                            </CustomText>
                        </CustomText>

                        {onRetryPress && (
                            <View style={styles.errorButtonContainer}>
                                <CustomButton
                                    title="Try Again"
                                    onPress={onRetryPress}
                                    variant="primary"
                                />
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                <ResponsiveScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        isWideScreen ? styles.scrollContentWide : styles.scrollContentMobile
                    ]}
                >
                    {isWideScreen ? (
                        <View style={styles.desktopColumns}>
                            <View style={styles.columnWide}>
                                {renderBusinessCard()}
                            </View>
                            <View style={styles.columnWide}>
                                {renderAdminCard()}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.mobileStack}>
                            {renderBusinessCard()}
                            {renderAdminCard()}
                        </View>
                    )}

                    {isWideScreen && renderQuickActions()}
                </ResponsiveScrollView>
            )}

            {!isLoading && !error && !isWideScreen && renderMobileStickyActions()}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingTop: 16,
        paddingHorizontal: 16, 
        gap: 20,
    },
    scrollContentMobile: {
        paddingBottom: 130, 
    },
    scrollContentWide: {
        maxWidth: Layout.MAX_WIDTH, 
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 40,
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: Colors.BACKGROUND,
    },
    errorCard: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...GlobalStyles.dropShadow(3),
    },
    iconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.ERROR_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...GlobalStyles.dropShadow(2),
    },
    iconInner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    errorMessage: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
        marginBottom: 28,
        maxWidth: 380,
    },
    errorButtonContainer: {
        width: '100%',
        maxWidth: 320,
    },

    card: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(2),
    },
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 16,
    },
    cardTitle: { 
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 0,
    },
    cardBody: { 
        flexDirection: 'column',
    },

    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        flexWrap: 'wrap',
    },
    inlineLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
    },
    inlineValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
    },
    noMargin: {
        marginBottom: 0,
        paddingBottom: 0,
        borderBottomWidth: 0,
    },

    desktopColumns: {
        flexDirection: 'row',
        gap: 20,
    },
    mobileStack: {
        flexDirection: 'column',
        gap: 20,
    },
    columnWide: {
        flex: 1,
        gap: 20,
    },

    statusBadge: { 
        marginLeft: 'auto', 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 8,
    },
    statusActive: { 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
    },
    statusArchived: { 
        backgroundColor: Colors.STATUS_CANCELLED_BG, 
    },
    statusTextActive: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: Colors.STATUS_APPROVED_TEXT, 
    },
    statusTextArchived: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: Colors.STATUS_CANCELLED_TEXT, 
    },

    webActionSection: {
        marginTop: 8,
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    actionTitle: { 
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
    webActionContainer: { 
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 600,
    },
    webButtonWrapper: {
        flex: 1,
    },

    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        ...GlobalStyles.dropShadow(4),
        gap: 8,
    },
    stickyFooterTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stickyButtonRow: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stickyActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 16,
        gap: 6,
        height: 48,
    },
    primaryStickyBtn: {
        backgroundColor: Colors.PRIMARY,
    },
    secondaryStickyBtn: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    primaryStickyBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    secondaryStickyBtnText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default DashboardScreen;
