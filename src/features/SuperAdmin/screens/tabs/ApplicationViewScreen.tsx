/**
 * @file ApplicationViewScreen.tsx
 * @description Pure UI screen for viewing a business application's details and approving/rejecting it.
 */

import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Application } from '@/src/core/models/Application/Application';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface ApplicationViewScreenProps {
    application: Application;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    rejectionReason: string;
    onRejectionReasonChange: (reason: string) => void;
    error: string | null;
    onBack: () => void;
    pendingCount?: number;
    onTabPress?: (tab: SuperadminTab) => void;
    onBackToSettings?: () => void;
}

const ApplicationViewScreen: React.FC<ApplicationViewScreenProps> = ({
    application,
    onApprove,
    onReject,
    rejectionReason,
    onRejectionReasonChange,
    error = null,
    onBack,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
}) => {
    const { isDesktop } = useBreakpoints();
    const isPending = application.status === 'pending';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return Colors.STATUS_APPROVED_TEXT;
            case 'rejected': return Colors.ERROR;
            case 'pending':
            default: return Colors.STATUS_WARNING_TEXT;
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'approved': return Colors.STATUS_APPROVED_BG;
            case 'rejected': return Colors.ERROR_BG;
            case 'pending':
            default: return Colors.STATUS_WARNING_BG;
        }
    };

    const backHeaderAction = (
        <TouchableOpacity
            style={styles.backHeaderButton}
            onPress={onBack}
            activeOpacity={0.7}
        >
            <CustomIcon library="Feather" name="chevron-left" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
    );

    return (
        <SuperadminShell
            activeTab="application"
            titleOverride="Application Details"
            leftActionOverride={backHeaderAction}
            enableSearch={false}
            pendingCount={pendingCount}
            onTabPress={onTabPress || (() => {})}
            onBackToSettings={onBackToSettings || (() => {})}
        >
            <KeyboardAvoidingView 
                style={styles.keyboardFlex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {error ? (
                        <View style={styles.errorWrapper}>
                            <ErrorMessage error={error} />
                        </View>
                    ) : null}

                    {/* Single Column Stack Layout */}
                    <View style={styles.singleColumnStack}>
                        
                        {/* 1. Status Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.cardHeaderLeft}>
                                    <CustomIcon library="Feather" name="activity" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle}>Status</CustomText>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(application.status) }]}>
                                    <CustomText variant="caption" style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                                        {application.status.toUpperCase()}
                                    </CustomText>
                                </View>
                            </View>

                            <View style={styles.inlineRowNoBorder}>
                                <CustomText style={styles.inlineLabel}>Applied on:</CustomText>
                                <CustomText style={styles.inlineValue}>
                                    {formatDateToStandard(application.createdAt)}
                                </CustomText>
                            </View>
                        </View>

                        {/* 2. Applicant Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <CustomIcon library="Feather" name="user" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>Applicant</CustomText>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.inlineRow}>
                                    <CustomText style={styles.inlineLabel}>Name</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.owner?.name || 'Not provided'}</CustomText>
                                </View>
                                <View style={styles.inlineRow}>
                                    <CustomText style={styles.inlineLabel}>Email</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.owner?.email || 'Not provided'}</CustomText>
                                </View>
                                <View style={styles.inlineRowNoBorder}>
                                    <CustomText style={styles.inlineLabel}>User ID</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.owner?.id || 'Not provided'}</CustomText>
                                </View>
                            </View>
                        </View>

                        {/* 3. Business Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <CustomIcon library="Feather" name="briefcase" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>Business</CustomText>
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.inlineRow}>
                                    <CustomText style={styles.inlineLabel}>Business Name</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.name || 'Not provided'}</CustomText>
                                </View>
                                <View style={styles.inlineRow}>
                                    <CustomText style={styles.inlineLabel}>Address</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.address || 'Not provided'}</CustomText>
                                </View>
                                <View style={styles.inlineRow}>
                                    <CustomText style={styles.inlineLabel}>Established On</CustomText>
                                    <CustomText style={styles.inlineValue}>{formatDateToStandard(application.establishedOn)}</CustomText>
                                </View>
                                <View style={styles.inlineRowNoBorder}>
                                    <CustomText style={styles.inlineLabel}>Serviced Locations</CustomText>
                                    <CustomText style={styles.inlineValue}>{application.servicedLocation?.join(', ') || 'None'}</CustomText>
                                </View>
                            </View>
                        </View>

                        {/* 4. Permits Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <CustomIcon library="Feather" name="file-text" size={18} color={Colors.PRIMARY} />
                                <CustomText variant="h3" style={styles.cardTitle}>Permits</CustomText>
                            </View>
                            <View style={styles.permitsList}>
                                <DocumentUploadCard
                                    docName="DENR Permit"
                                    isUploaded={application.permits?.denr}
                                    readOnly={true}
                                />
                                <DocumentUploadCard
                                    docName="DTI Registration"
                                    isUploaded={application.permits?.dti}
                                    readOnly={true}
                                />
                                <DocumentUploadCard
                                    docName="BIR Registration"
                                    isUploaded={application.permits?.bir}
                                    readOnly={true}
                                />
                            </View>
                        </View>

                        {/* 5. Review Decision Card */}
                        {isPending && (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon library="Feather" name="check-square" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle}>Review Decision</CustomText>
                                </View>
                                <CustomTextInput
                                    label="Reason for rejection (Optional)"
                                    placeholder="Missing/invalid requirements, incomplete information, etc."
                                    value={rejectionReason}
                                    onChangeText={onRejectionReasonChange}
                                    multiline
                                    numberOfLines={3}
                                    style={styles.rejectionInput}
                                />
                                <View style={styles.buttonRow}>
                                    <View style={styles.buttonWrapper}>
                                        <CustomButton
                                            title="Reject Application"
                                            variant="outline"
                                            onPress={() => onReject(application.id)}
                                            style={styles.rejectButton}
                                            textStyle={{ color: Colors.ERROR }}
                                        />
                                    </View>
                                    <View style={styles.buttonWrapper}>
                                        <CustomButton
                                            title="Approve Application"
                                            variant="primary"
                                            onPress={() => onApprove(application.id)}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {!isPending && application.message ? (
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <CustomIcon library="Feather" name="message-square" size={18} color={Colors.PRIMARY} />
                                    <CustomText variant="h3" style={styles.cardTitle}>Decision Message</CustomText>
                                </View>
                                <CustomText variant="body" style={styles.messageText}>
                                    {application.message}
                                </CustomText>
                            </View>
                        ) : null}

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    keyboardFlex: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        maxWidth: Layout.MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 24,
    },
    backHeaderButton: {
        padding: 6,
        marginLeft: -6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorWrapper: {
        marginBottom: 16,
    },
    singleColumnStack: {
        width: '100%',
        gap: 20,
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
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
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardTitle: {
        marginBottom: 0,
        color: Colors.BLACK,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardBody: {
        flexDirection: 'column',
    },
    inlineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    inlineRowNoBorder: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
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
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontWeight: 'bold',
    },
    permitsList: {
        gap: 4,
        marginTop: 4,
    },
    rejectionInput: {
        marginTop: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    buttonWrapper: {
        flex: 1,
    },
    rejectButton: {
        borderColor: Colors.ERROR,
    },
    messageText: {
        color: Colors.TEXT_PRIMARY,
        lineHeight: 20,
        fontStyle: 'italic',
    }
});

export default ApplicationViewScreen;
