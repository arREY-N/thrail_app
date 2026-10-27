/**
 * @file ApplyScreen.tsx
 * @description Partner application form screen enabling business owners to submit applications,
 * register office addresses, upload valid government IDs and business permits, and monitor active application review status.
 * Responsive design optimized for both mobile touch and desktop web viewports (maxWidth: 860px).
 */

import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter, { getStickyFooterScrollPadding } from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { useToast } from '@/src/components/Toast/Toast';
import SelectionOption from '@/src/features/Auth/components/SelectionOption';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Application } from '@/src/core/models/Application/Application';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Payload for application update events dispatched to controllers or hooks.
 */
export interface UpdatePayload {
    section: keyof Application | 'root';
    id: string;
    value: string | string[] | Date | null;
}

/**
 * Generates an informative summary of missing fields to guide the user in the error toast.
 */
const getMissingFieldsSummary = (app: Application): string => {
    const missing: string[] = [];
    if (!app?.name?.trim()) missing.push('business name');
    if (!app?.establishedOn) missing.push('date established');
    if (!app?.address?.trim()) missing.push('office address');
    if (!Array.isArray(app?.servicedLocation) || app.servicedLocation.length === 0) missing.push('serviced locations');
    if (!app?.owner?.name?.trim() || !app?.owner?.email?.trim()) missing.push('owner details');
    if (!app?.owner?.validIdFront?.trim() || !app?.owner?.validIdBack?.trim()) missing.push('valid ID photos');
    const missingPermits: string[] = [];
    if (!app?.permits?.bir?.trim()) missingPermits.push('BIR');
    if (!app?.permits?.dti?.trim()) missingPermits.push('DTI');
    if (!app?.permits?.denr?.trim()) missingPermits.push('DENR');
    if (missingPermits.length > 0) missing.push(`permits (${missingPermits.join(', ')})`);

    if (missing.length === 0) return 'Please complete all required fields before submitting.';
    if (missing.length <= 2) {
        return `Please provide ${missing.join(' and ')} before submitting.`;
    }
    return `Please complete required items: ${missing.slice(0, 2).join(', ')}, and ${missing.length - 2} more.`;
};

/**
 * Props for the ApplyScreen presentation component.
 */
interface ApplyScreenProps {
    /** Current state of the draft application */
    application: Application;
    /** Geographic options to populate location selectors */
    options?: {
        provinces?: string[];
    };
    /** Pre-existing application on file for the user, if any */
    existingApplication?: Application | null;
    /** Loading flag indicating background submission or processing */
    isLoading?: boolean;
    /** Callback triggered when a field value is updated */
    onUpdatePress: (payload: UpdatePayload) => void;
    /** Callback triggered when the user submits the form */
    onSubmitPress: () => void;
    /** Callback to navigate back */
    onBackPress: () => void;
}

/**
 * Screen presenting either the partner application form or active application status review card.
 */
const ApplyScreen = ({
    application,
    options,
    existingApplication,
    isLoading = false,
    onUpdatePress,
    onSubmitPress,
    onBackPress,
}: ApplyScreenProps): React.JSX.Element => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;
    const insets = useSafeAreaInsets();
    const scrollPaddingBottom = getStickyFooterScrollPadding(insets.bottom, !isWide);
    const { showToast } = useToast();

    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

    const isExistingActive = existingApplication && (
        existingApplication.status === 'pending' ||
        existingApplication.status === 'reviewed' ||
        existingApplication.status === 'approved'
    );

    const isRejected = existingApplication?.status === 'rejected';

    const safeLocations = Array.isArray(application?.servicedLocation)
        ? application.servicedLocation
        : [];

    const isFormValid = useMemo(() => {
        const locations = Array.isArray(application?.servicedLocation)
            ? application.servicedLocation
            : [];
        return (
            Boolean(application?.name?.trim()) &&
            application?.establishedOn !== null &&
            Boolean(application?.address?.trim()) &&
            locations.length > 0 &&
            Boolean(application?.owner?.name?.trim()) &&
            Boolean(application?.owner?.email?.trim()) &&
            Boolean(application?.owner?.validIdFront?.trim()) &&
            Boolean(application?.owner?.validIdBack?.trim()) &&
            Boolean(application?.permits?.bir?.trim()) &&
            Boolean(application?.permits?.dti?.trim()) &&
            Boolean(application?.permits?.denr?.trim())
        );
    }, [application]);

    const handleFieldUpdate = (payload: UpdatePayload) => {
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
        onUpdatePress(payload);
    };

    const handlePreSubmit = () => {
        if (isLoading) return;

        if (!isFormValid) {
            setHasAttemptedSubmit(true);
            showToast.error(getMissingFieldsSummary(application), {
                mode: 'dismissible',
                onHide: () => setHasAttemptedSubmit(false),
            });
            return;
        }

        setHasAttemptedSubmit(false);
        setShowConfirm(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirm(false);
        onSubmitPress();
    };

    const handleLocationSelect = (location: string) => {
        if (hasAttemptedSubmit) {
            setHasAttemptedSubmit(false);
        }
        let newLocations: string[];
        if (safeLocations.includes(location)) {
            newLocations = safeLocations.filter(loc => loc !== location);
        } else {
            newLocations = [...safeLocations, location];
        }
        onUpdatePress({ section: 'root', id: 'servicedLocation', value: newLocations });
    };

    const permitsList = [
        { id: 'bir', label: 'BIR Certificate' },
        { id: 'dti', label: 'DTI Registration' },
        { id: 'denr', label: 'DENR Permit' },
    ];

    if (isExistingActive && existingApplication) {
        const isApproved = existingApplication.status === 'approved';
        const isReviewed = existingApplication.status === 'reviewed';

        const statusBadgeBg = isApproved
            ? Colors.STATUS_APPROVED_BG
            : isReviewed
                ? Colors.STATUS_NEEDS_REVIEW_BG
                : Colors.STATUS_WARNING_BG;

        const statusBadgeText = isApproved
            ? Colors.STATUS_APPROVED_TEXT
            : isReviewed
                ? Colors.STATUS_NEEDS_REVIEW_TEXT
                : Colors.STATUS_WARNING_TEXT;

        const statusLabel = isApproved
            ? 'Approved Partner'
            : isReviewed
                ? 'Under Final Review'
                : 'Pending Verification';

        const statusIcon = isApproved
            ? 'check-circle'
            : isReviewed
                ? 'eye'
                : 'clock';

        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader
                    title="Partner Application"
                    centerTitle={true}
                    onBackPress={onBackPress}
                />
                <ResponsiveScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.responsiveContainer}>
                        <View style={styles.introSection}>
                            <CustomText variant="h2" style={styles.introTitle}>
                                Application Status
                            </CustomText>
                            <CustomText variant="body" style={styles.introText}>
                                Your business partnership application has been submitted and is currently on file.
                            </CustomText>
                        </View>

                        <View style={styles.formCard}>
                            <View style={styles.statusHeaderRow}>
                                <View style={[styles.statusIconCircle, { backgroundColor: statusBadgeBg }]}>
                                    <CustomIcon
                                        name={statusIcon}
                                        size={28}
                                        color={statusBadgeText}
                                    />
                                </View>
                                <View style={styles.statusTitleBlock}>
                                    <CustomText variant="h3" style={styles.statusHeading}>
                                        {isApproved ? 'Partner Account Active' : 'Application Under Review'}
                                    </CustomText>
                                    <View style={[styles.statusBadge, { backgroundColor: statusBadgeBg }]}>
                                        <CustomText variant="caption" style={[styles.statusBadgeLabel, { color: statusBadgeText }]}>
                                            {statusLabel}
                                        </CustomText>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailsList}>
                                <View style={styles.detailRow}>
                                    <CustomText variant="caption" style={styles.detailLabel}>
                                        Business Name
                                    </CustomText>
                                    <CustomText variant="body" style={styles.detailValue}>
                                        {existingApplication.name || '--'}
                                    </CustomText>
                                </View>

                                <View style={styles.detailRow}>
                                    <CustomText variant="caption" style={styles.detailLabel}>
                                        Submitted On
                                    </CustomText>
                                    <CustomText variant="body" style={styles.detailValue}>
                                        {formatDate(existingApplication.createdAt, 'full')}
                                    </CustomText>
                                </View>

                                <View style={styles.detailRow}>
                                    <CustomText variant="caption" style={styles.detailLabel}>
                                        Registered Owner
                                    </CustomText>
                                    <CustomText variant="body" style={styles.detailValue}>
                                        {existingApplication.owner?.name || '--'} ({existingApplication.owner?.email || '--'})
                                    </CustomText>
                                </View>

                                <View style={styles.detailRow}>
                                    <CustomText variant="caption" style={styles.detailLabel}>
                                        Headquarters Address
                                    </CustomText>
                                    <CustomText variant="body" style={styles.detailValue}>
                                        {existingApplication.address || '--'}
                                    </CustomText>
                                </View>

                                <View style={styles.detailRow}>
                                    <CustomText variant="caption" style={styles.detailLabel}>
                                        Offered Locations
                                    </CustomText>
                                    <CustomText variant="body" style={styles.detailValue}>
                                        {existingApplication.servicedLocation?.join(', ') || '--'}
                                    </CustomText>
                                </View>
                            </View>

                            <View style={styles.infoCallout}>
                                <CustomIcon
                                    name="info"
                                    size={18}
                                    color={Colors.PRIMARY}
                                    style={styles.infoCalloutIcon}
                                />
                                <CustomText variant="caption" style={styles.infoCalloutText}>
                                    Our administration team verifies all submitted permits and government credentials. You will receive an in-app notification once your business account is verified.
                                </CustomText>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <CustomButton
                                title="Return to Profile"
                                onPress={onBackPress}
                                variant="primary"
                            />
                        </View>
                    </View>
                </ResponsiveScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <ConfirmationModal
                visible={showConfirm}
                title="Submit Application"
                message="Are you sure all your business details and uploaded permits are correct?"
                iconName="check-circle"
                confirmText="Submit"
                cancelText="Review"
                onConfirm={handleConfirmSubmit}
                onClose={() => setShowConfirm(false)}
            />

            <CustomHeader
                title="Partner Application"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <ResponsiveScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}>
                <View style={styles.responsiveContainer}>
                    <View style={styles.introSection}>
                        <CustomText variant="h2" style={styles.introTitle}>
                            Get Started
                        </CustomText>
                        <CustomText variant="body" style={styles.introText}>
                            Fill in the details below to register your business on Thrail. All fields are required.
                        </CustomText>
                    </View>

                    {isRejected && (
                        <View style={styles.rejectionBanner}>
                            <CustomIcon
                                name="alert-circle"
                                size={20}
                                color={Colors.ERROR}
                            />
                            <View style={styles.rejectionTextContainer}>
                                <CustomText variant="label" style={styles.rejectionTitle}>
                                    Application Needs Revision
                                </CustomText>
                                <CustomText variant="caption" style={styles.rejectionMessage}>
                                    {existingApplication?.message || 'Please review your submitted documents and re-apply.'}
                                </CustomText>
                            </View>
                        </View>
                    )}

                    <View style={styles.formContainer}>
                        {/* Section 1: Business Info */}
                        <View style={styles.sectionBlock}>
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Business Info
                            </CustomText>

                            <View style={styles.formCard}>
                                <View style={[styles.fieldRow, isWide && styles.fieldRowWide]}>
                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <CustomTextInput
                                            label="Business Name *"
                                            placeholder="e.g. Mt. Maculot Hiking Tours"
                                            value={application?.name || ''}
                                            onChangeText={(val: string) => handleFieldUpdate({ section: 'root', id: 'name', value: val })}
                                            autoCapitalize="words"
                                            containerStyle={styles.inputContainer}
                                        />
                                    </View>

                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <CustomTextInput
                                            type="calendar"
                                            label="Date of Establishment *"
                                            placeholder="MM / DD / YYYY"
                                            value={application?.establishedOn || new Date()}
                                            onChangeText={(val: string | Date | null) => {
                                                const selectedDate = val instanceof Date ? val : val ? new Date(val) : new Date();
                                                handleFieldUpdate({ section: 'root', id: 'establishedOn', value: selectedDate });
                                            }}
                                            showTodayButton={true}
                                            allowFutureDates={false}
                                            defaultMode="year"
                                            containerStyle={styles.inputContainer}
                                        />
                                    </View>
                                </View>

                                <CustomTextInput
                                    label="Owner/Office Address *"
                                    placeholder="e.g. Barangay 1, Cuenca, Batangas"
                                    value={application?.address || ''}
                                    onChangeText={(val: string) => handleFieldUpdate({ section: 'root', id: 'address', value: val })}
                                    containerStyle={styles.inputContainer}
                                />

                                <CustomText variant="label" style={styles.multiSelectLabel}>
                                    Offered Locations *
                                </CustomText>

                                <View style={styles.locationsContainer}>
                                    {options?.provinces?.map((province) => {
                                        return (
                                            <SelectionOption
                                                key={province}
                                                label={province}
                                                selected={safeLocations.includes(province)}
                                                onPress={() => handleLocationSelect(province)}
                                                style={styles.compactSelection}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        </View>

                        {/* Section 2: Owner Info */}
                        <View style={styles.sectionBlock}>
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Owner Info
                            </CustomText>

                            <View style={styles.formCard}>
                                <View style={[styles.fieldRow, isWide && styles.fieldRowWide]}>
                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <CustomTextInput
                                            label="Owner Name *"
                                            placeholder="e.g. Juan Dela Cruz"
                                            value={application?.owner?.name || ''}
                                            onChangeText={(val: string) => handleFieldUpdate({ section: 'owner', id: 'name', value: val })}
                                            autoCapitalize="words"
                                            containerStyle={styles.inputContainer}
                                        />
                                    </View>

                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <CustomTextInput
                                            label="Email *"
                                            placeholder="e.g. owner@example.com"
                                            value={application?.owner?.email || ''}
                                            onChangeText={(val: string) => handleFieldUpdate({ section: 'owner', id: 'email', value: val })}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            containerStyle={styles.inputContainer}
                                        />
                                    </View>
                                </View>

                                <CustomText variant="label" style={styles.multiSelectLabel}>
                                    Valid Government ID *
                                </CustomText>

                                <View style={[styles.fieldRow, isWide && styles.fieldRowWide]}>
                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <DocumentUploadCard
                                            docName="ID Photo (Front)"
                                            docKey="validId"
                                            isUploaded={application?.owner?.validIdFront}
                                            onUploadSuccess={(url) => handleFieldUpdate({ section: 'owner', id: 'validIdFront', value: url })}
                                        />
                                    </View>

                                    <View style={[styles.fieldColumn, isWide && styles.fieldColumnWide]}>
                                        <DocumentUploadCard
                                            docName="ID Photo (Back)"
                                            docKey="validId"
                                            isUploaded={application?.owner?.validIdBack}
                                            onUploadSuccess={(url) => handleFieldUpdate({ section: 'owner', id: 'validIdBack', value: url })}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Section 3: Permits & Documents */}
                        <View style={styles.sectionBlock}>
                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Permits & Documents
                            </CustomText>
                            <CustomText variant="caption" style={styles.sectionSubtitle}>
                                Please upload the required business permits and registration documents.
                            </CustomText>

                            <View style={styles.permitsCard}>
                                {permitsList.map((permit) => {
                                    const permitKey = permit.id as keyof typeof application.permits;
                                    const isUploaded = application?.permits?.[permitKey];

                                    return (
                                        <DocumentUploadCard
                                            key={permit.id}
                                            docName={permit.label}
                                            docKey={permit.id}
                                            isUploaded={isUploaded}
                                            onUploadSuccess={(url) => handleFieldUpdate({ section: 'permits', id: permit.id, value: url })}
                                        />
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </View>
            </ResponsiveScrollView>

            <CustomStickyFooter
                enableToastDock={true}
                primaryButton={{
                    title: 'Submit Application',
                    onPress: handlePreSubmit,
                    variant: 'primary',
                    disabled: isLoading,
                    isLoading: isLoading,
                    validationState: isFormValid ? 'valid' : (hasAttemptedSubmit ? 'error' : 'idle'),
                    hasError: hasAttemptedSubmit && !isFormValid,
                    isIdleDisabled: false,
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 12,
        paddingBottom: 48,
        paddingHorizontal: 16,
    },
    responsiveContainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    introSection: {
        marginBottom: 24,
        paddingHorizontal: 4,
        alignItems: 'flex-start',
    },
    introTitle: {
        marginBottom: 6,
        color: Colors.TEXT_PRIMARY,
    },
    introText: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
    },
    rejectionBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.ERROR,
    },
    rejectionTextContainer: {
        flex: 1,
    },
    rejectionTitle: {
        color: Colors.ERROR,
        marginBottom: 4,
        fontWeight: 'bold',
    },
    rejectionMessage: {
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
    formContainer: {
        gap: 24,
    },
    sectionBlock: {
        gap: 8,
    },
    sectionTitle: {
        marginLeft: 4,
        color: Colors.TEXT_PRIMARY,
    },
    sectionSubtitle: {
        marginLeft: 4,
        marginBottom: 4,
        color: Colors.TEXT_SECONDARY,
    },
    formCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 16,
        ...GlobalStyles.dropShadow(3),
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    permitsCard: {
        gap: 0,
    },
    fieldRow: {
        flexDirection: 'column',
        gap: 0,
    },
    fieldRowWide: {
        flexDirection: 'row',
        gap: 16,
    },
    fieldColumn: {
        width: '100%',
    },
    fieldColumnWide: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    multiSelectLabel: {
        marginBottom: 8,
        marginLeft: 2,
    },
    locationsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 4,
    },
    compactSelection: {
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: Colors.BACKGROUND,
    },
    buttonContainer: {
        marginTop: 8,
    },
    submitButtonActive: {
        opacity: 1,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    statusHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    statusIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusTitleBlock: {
        flex: 1,
    },
    statusHeading: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    statusBadgeLabel: {
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    detailsList: {
        gap: 12,
    },
    detailRow: {
        flexDirection: 'column',
        gap: 2,
    },
    detailLabel: {
        color: Colors.TEXT_SECONDARY,
    },
    detailValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    infoCallout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 16,
        padding: 14,
        marginTop: 20,
        gap: 10,
    },
    infoCalloutIcon: {
        marginTop: 2,
    },
    infoCalloutText: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
});

export default ApplyScreen;
