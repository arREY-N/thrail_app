/**
 * @file DashboardScreen.tsx
 * @description Screen displaying organization profile details, admin staff details, and action buttons.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomInfoRow from '@/src/components/CustomInfoRow';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import {
    CustomTutorialModal,
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    TutorialHelpButton,
    useTutorialGuide,
} from '@/src/components/Tutorial/Tutorial';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Business, IBusinessPaymentConfig } from '@/src/core/models/Business/Business';
import { User } from '@/src/core/models/User/User';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { OwnerQRModal } from './components/OwnerQRModal';

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
    businessAccount?: Business | null; 
    onManageAdminsPress: () => void; 
    onManageOffersPress: () => void;
    onManageTrailsPress: () => void;
    adminProfile?: User | null; 
    error?: string | null;
    onBackPress: () => void; 
    isLoading?: boolean;
    onRetryPress?: () => void;
    isOwner?: boolean;
    onSavePaymentConfig?: (config: IBusinessPaymentConfig<Date> | null) => Promise<boolean>;
}

/**
 * DashboardScreen — Main admin dashboard displaying business profile, admin info, and quick actions.
 */
const DashboardScreen = ({ 
    businessAccount, 
    onManageAdminsPress, 
    onManageOffersPress,
    onManageTrailsPress,
    adminProfile, 
    error,
    onBackPress,
    isLoading = false,
    onRetryPress,
    isOwner = false,
    onSavePaymentConfig,
}: DashboardScreenProps): React.JSX.Element => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;
    const insets = useSafeAreaInsets();
    const tutorial = useTutorialGuide('admin_dashboard', !isLoading && !error);

    const [showQRModal, setShowQRModal] = useState<boolean>(false);
    const isNavigatingRef = useRef<boolean>(false);
    const overviewRef = useRef<View>(null);
    const trailsBtnRef = useRef<View>(null);
    const offersBtnRef = useRef<View>(null);
    const personnelBtnRef = useRef<View>(null);

    const measureOverviewNow = useCallback(() => {
        overviewRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_dash_overview', { x, y, width, height });
            }
        });
    }, []);

    const measureTrailsBtnNow = useCallback(() => {
        trailsBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_action_0', { x, y, width, height });
            }
        });
    }, []);

    const measureOffersBtnNow = useCallback(() => {
        offersBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_action_1', { x, y, width, height });
            }
        });
    }, []);

    const measurePersonnelBtnNow = useCallback(() => {
        personnelBtnRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('admin_action_2', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unsubOverview = registerMeasureCallback('admin_dash_overview', measureOverviewNow);
        const unsub0 = registerMeasureCallback('admin_action_0', measureTrailsBtnNow);
        const unsub1 = registerMeasureCallback('admin_action_1', measureOffersBtnNow);
        const unsub2 = registerMeasureCallback('admin_action_2', measurePersonnelBtnNow);
        return () => {
            unsubOverview();
            unsub0();
            unsub1();
            unsub2();
        };
    }, [measureOverviewNow, measureTrailsBtnNow, measureOffersBtnNow, measurePersonnelBtnNow]);

    useFocusEffect(
        useCallback(() => {
            isNavigatingRef.current = false;
        }, [])
    );

    const handleNavPress = (action: () => void) => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        action();
    };

    const formatAdminName = () => {
        if (!adminProfile) return '--';
        const fullName = `${adminProfile.firstname || ''} ${adminProfile.lastname || ''}`.trim();
        return fullName.length > 0 ? fullName : 'N/A';
    };

    const formatLocation = (locationData?: string | string[] | null) => {
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
                <CustomInfoRow 
                    label="Business Name" 
                    value={businessAccount?.name} 
                    compact={true}
                />
                <CustomInfoRow 
                    label="Address" 
                    value={businessAccount?.address} 
                    compact={true}
                />
                <CustomInfoRow 
                    label="Serviced Location" 
                    value={formatLocation(businessAccount?.servicedLocation)}
                    compact={true}
                />
                <CustomInfoRow 
                    label="Established" 
                    value={businessAccount?.establishedOn ? formatDate(businessAccount.establishedOn) : 'N/A'} 
                    compact={true}
                />
                <CustomInfoRow 
                    label="Approved" 
                    value={businessAccount?.createdAt ? formatDate(businessAccount.createdAt) : 'N/A'} 
                    compact={true}
                    isLast={!isOwner}
                />

                {isOwner && (
                    <View style={styles.paymentConfigSection}>
                        <View style={styles.paymentConfigHeader}>
                            <View style={styles.paymentConfigTitleRow}>
                                <CustomIcon library="MaterialCommunityIcons" name="qrcode-scan" size={16} color={Colors.PRIMARY} />
                                <CustomText style={styles.paymentConfigTitle}>Manual Payment QR</CustomText>
                            </View>
                            <TouchableOpacity 
                                style={styles.paymentConfigEditBtn}
                                onPress={() => setShowQRModal(true)}
                                activeOpacity={0.7}
                            >
                                <CustomText style={styles.paymentConfigEditBtnText}>
                                    {businessAccount?.paymentConfig?.qrCodeUrl ? 'Manage QR' : 'Setup QR'}
                                </CustomText>
                                <CustomIcon library="Feather" name="chevron-right" size={14} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </View>
                        <CustomText style={styles.paymentConfigSubtitle}>
                            {businessAccount?.paymentConfig?.qrCodeUrl 
                                ? `Active QR: ${businessAccount.paymentConfig.accountName || 'Configured'} (${businessAccount.paymentConfig.accountNumber || ''})`
                                : 'No master QR configured. Hikers will not be able to pay manually.'}
                        </CustomText>
                    </View>
                )}
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
                <CustomInfoRow 
                    label="Name" 
                    value={formatAdminName()} 
                    compact={true}
                />
                <CustomInfoRow 
                    label="Username" 
                    value={adminProfile?.username} 
                    compact={true}
                />
                <CustomInfoRow 
                    label="Email" 
                    value={adminProfile?.email} 
                    enableCopy={Boolean(adminProfile?.email)}
                    compact={true}
                />
                <CustomInfoRow 
                    label="Address" 
                    value={adminProfile?.address} 
                    compact={true}
                    isLast={true}
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
                <View ref={isWideScreen ? trailsBtnRef : undefined} collapsable={false} style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Trails"
                        onPress={() => handleNavPress(onManageTrailsPress)}
                        variant="secondary"
                        icon="map"
                        iconLibrary="Feather"
                    />
                </View>
                <View ref={isWideScreen ? offersBtnRef : undefined} collapsable={false} style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Offers"
                        onPress={() => handleNavPress(onManageOffersPress)}
                        variant="primary"
                        icon="pricetags"
                        iconLibrary="Ionicons"
                    />
                </View>
                <View ref={isWideScreen ? personnelBtnRef : undefined} collapsable={false} style={styles.webButtonWrapper}>
                    <CustomButton 
                        title="Personnel"
                        onPress={() => handleNavPress(onManageAdminsPress)}
                        variant="secondary" 
                        icon="users"
                        iconLibrary="Feather"
                    />
                </View>
            </View>
        </View>
    );

    const renderMobileStickyActions = () => {
        const safeBottomPadding = Math.max(insets.bottom, 20);

        return (
            <View style={[styles.stickyFooter, { paddingBottom: safeBottomPadding }]}>
                <CustomText variant="caption" style={styles.stickyFooterTitle}>
                    Quick Actions
                </CustomText>
                <View style={styles.stickyButtonRow}>
                    <View ref={!isWideScreen ? trailsBtnRef : undefined} collapsable={false} style={styles.stickyButtonWrapper}>
                        <CustomButton 
                            title="Trails"
                            onPress={() => handleNavPress(onManageTrailsPress)}
                            variant="secondary"
                            icon="map"
                            iconLibrary="Feather"
                            iconSize={16}
                            style={styles.mobileCustomButton}
                            textStyle={styles.mobileButtonText}
                        />
                    </View>

                    <View ref={!isWideScreen ? offersBtnRef : undefined} collapsable={false} style={styles.stickyButtonWrapper}>
                        <CustomButton 
                            title="Offers"
                            onPress={() => handleNavPress(onManageOffersPress)}
                            variant="primary"
                            icon="pricetags"
                            iconLibrary="Ionicons"
                            iconSize={16}
                            style={styles.mobileCustomButton}
                            textStyle={styles.mobileButtonText}
                        />
                    </View>

                    <View ref={!isWideScreen ? personnelBtnRef : undefined} collapsable={false} style={styles.stickyButtonWrapper}>
                        <CustomButton 
                            title="Personnel"
                            onPress={() => handleNavPress(onManageAdminsPress)}
                            variant="secondary" 
                            icon="users"
                            iconLibrary="Feather"
                            iconSize={16}
                            style={styles.mobileCustomButton}
                            textStyle={styles.mobileButtonText}
                        />
                    </View>
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
                rightActions={<TutorialHelpButton onPress={tutorial.onReplayTour} />} 
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
                        <View
                            ref={overviewRef}
                            collapsable={false}
                            onLayout={() => {
                                if (isTutorialMeasurementActive()) measureOverviewNow();
                            }}
                            style={styles.desktopColumns}
                        >
                            <View style={styles.columnWide}>
                                {renderBusinessCard()}
                            </View>
                            <View style={styles.columnWide}>
                                {renderAdminCard()}
                            </View>
                        </View>
                    ) : (
                        <View
                            ref={overviewRef}
                            collapsable={false}
                            onLayout={() => {
                                if (isTutorialMeasurementActive()) measureOverviewNow();
                            }}
                            style={styles.mobileStack}
                        >
                            {renderBusinessCard()}
                            {renderAdminCard()}
                        </View>
                    )}

                    {isWideScreen && renderQuickActions()}
                </ResponsiveScrollView>
            )}

            {!isLoading && !error && !isWideScreen && renderMobileStickyActions()}

            <CustomTutorialModal
                visible={tutorial.isVisible}
                tourConfig={tutorial.tourConfig}
                currentStep={tutorial.currentStep}
                currentStepIndex={tutorial.currentStepIndex}
                totalSteps={tutorial.totalSteps}
                onNext={tutorial.onNextStep}
                onPrev={tutorial.onPrevStep}
                onSkip={tutorial.onSkipTour}
            />

            {businessAccount && (
                <OwnerQRModal
                    visible={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    business={businessAccount}
                    isOwner={Boolean(isOwner)}
                    onSavePaymentConfig={onSavePaymentConfig || (async () => false)}
                />
            )}
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
    stickyButtonWrapper: {
        flex: 1,
    },
    mobileCustomButton: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    mobileButtonText: {
        fontSize: 12,
    },

    paymentConfigSection: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    paymentConfigHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    paymentConfigTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    paymentConfigTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
    },
    paymentConfigEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.PRIMARY_LIGHT,
    },
    paymentConfigEditBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    paymentConfigSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
});

export default DashboardScreen;
