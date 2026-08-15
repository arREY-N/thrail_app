import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomSelectionModal from '@/src/components/CustomSelectionModal';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

import useReviewLogic from '@/src/features/Admin/hooks/useReviewLogic';
import ActivityLog from '@/src/features/Admin/screens/Booking/components/ActivityLog';
import AdminActionMenu from '@/src/features/Admin/screens/Booking/components/AdminActionMenu';
import AdminRefundModal, { RefundType } from '@/src/features/Admin/screens/Booking/components/AdminRefundModal';
import HikerProfileCard from '@/src/features/Admin/screens/Booking/components/HikerProfileCard';
import DocumentTab, { DocState } from '@/src/features/Admin/screens/Booking/tabs/DocumentTab';
import PaymentTab from '@/src/features/Admin/screens/Booking/tabs/PaymentTab';

import { IBooking } from '@/src/core/models/Booking/Booking';
import { Offer } from '@/src/core/models/Offer/Offer';
import { User } from '@/src/core/models/User/User';

/**
 * Props for ReviewScreen component.
 * @param isLoading - Flag indicating screen is in a loading state.
 * @param booking - The booking details model.
 * @param offers - List of rescheduling offers.
 * @param onBackPress - Callback for back navigation.
 * @param onApprove - Callback when approving the booking.
 * @param onConfirmPayment - Callback when verifying payment.
 * @param onReject - Callback when rejecting the booking.
 * @param onReschedule - Callback when selecting a reschedule offer.
 * @param onRefund - Callback when issuing a refund.
 * @param onCancelUnpaid - Callback when cancelling an unpaid booking.
 * @param error - Optional error message text.
 * @param hikerProfile - The hiker profile details.
 */
export interface ReviewScreenProps {
    isLoading: boolean;
    booking: IBooking;
    offers: Offer[];
    onBackPress: () => void;
    onApprove: (docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null) => Promise<void>;
    onConfirmPayment: () => Promise<void>;
    onReject: (reason: string, docStates: DocState[], personalVerifiedAt: Date | null, emergencyVerifiedAt: Date | null) => Promise<void>;
    onReschedule: (offerData: Offer) => void | Promise<void>;
    onRefund: (refundType: RefundType) => Promise<void>;
    onCancelUnpaid?: () => Promise<void>;
    error?: string;
    hikerProfile?: User | null;
}

/**
 * ReviewScreen — Admin booking review screen that consolidates the document and payment workflows.
 */
const ReviewScreen: React.FC<ReviewScreenProps> = ({ 
    isLoading, 
    booking, 
    offers, 
    onBackPress, 
    onApprove,
    onConfirmPayment, 
    onReject, 
    onReschedule, 
    onRefund, 
    onCancelUnpaid,
    error,
    hikerProfile
}) => {
    const { width } = useWindowDimensions();
    const isWide = width >= 768;

    const {
        activeTab, setActiveTab,
        docStates, setDocStates,
        viewedDocs, setViewedDocs,
        rejectionReason, setRejectionReason,
        personalVerifiedAt,
        emergencyVerifiedAt,
        personalStatus, emergencyStatus,
        personalMonthsRemaining, emergencyMonthsRemaining,
        togglePersonalVerify, toggleEmergencyVerify,
        isMinor,
        currentStatus, 
        isApprovedStatus, 
        isRejectedStatus, 
        isCancelledStatus, 
        isReviewComplete,
        adminStatusConfig,
        hasRejections, isDecisionIncomplete,
        availableOffers,
        displayCancellationReason
    } = useReviewLogic(booking, offers);

    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isConfirmPaymentVisible, setIsConfirmPaymentVisible] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState<any>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showCancelUnpaidModal, setShowCancelUnpaidModal] = useState(false);
    
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const totalAmountPaid = booking?.payment?.reduce((sum: number, p: any) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;

    const handleViewFile = async (url: string, index: number) => {
        if (!url) return Alert.alert("Notice", "No file uploaded.");
        
        setViewedDocs((prev: Record<number, boolean>) => ({ ...prev, [index]: true }));

        if (url.toLowerCase().includes('.pdf')) {
            if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
            }
        } else {
            setPreviewImageUrl(url);
        }
    };

    const handleFinalDecision = async () => {
        setIsConfirmVisible(false);
        const allApproved = docStates.every((d: DocState) => d.valid === 'approved');
        
        setIsProcessingAction(true);
        try {
            if (allApproved) {
                await onApprove(docStates, personalVerifiedAt, emergencyVerifiedAt);
                setActiveTab('payment');
            } else {
                await onReject(rejectionReason, docStates, personalVerifiedAt, emergencyVerifiedAt); 
            }
        } finally {
            setIsProcessingAction(false);
        }
    };


    if (isLoading || !booking || !booking.user) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Review Booking" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomLoading 
                visible={isProcessingAction} 
                message="Processing request..." 
            />

            <CustomHeader 
                title="Review Booking" 
                centerTitle={true} 
                onBackPress={onBackPress} 
                rightActions={
                    <TouchableOpacity 
                        style={styles.headerOptionsBtn} 
                        onPress={() => setShowActionMenu(true)} 
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="more-vertical" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                }
            />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.constrainer}>
                    
                    {error && !error.includes('No payment found') && (
                        <ErrorMessage error={error} />
                    )}
                    <View style={isWide ? styles.splitLayoutContainer : styles.verticalLayoutContainer}>
                        {/* Left Column: Hiker Profile */}
                        <View style={isWide ? styles.leftColumn : styles.fullWidthContainer}>
                            <HikerProfileCard 
                                user={booking.user}
                                emergencyContact={booking.emergencyContact}
                                hikerProfile={hikerProfile}
                                personalStatus={personalStatus}
                                emergencyStatus={emergencyStatus}
                                personalMonthsRemaining={personalMonthsRemaining}
                                emergencyMonthsRemaining={emergencyMonthsRemaining}
                                onTogglePersonalVerify={togglePersonalVerify}
                                onToggleEmergencyVerify={toggleEmergencyVerify}
                                statusText={adminStatusConfig.label}
                                statusBgColor={adminStatusConfig.bgColor}
                                statusTextColor={adminStatusConfig.textColor}
                                isMinor={isMinor}
                            />
                        </View>

                        {/* Right Column: Documents and Payment Verification */}
                        <View style={isWide ? styles.rightColumn : styles.fullWidthContainer}>
                            <View style={styles.tabContainer}>
                                <TouchableOpacity 
                                    style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]} 
                                    onPress={() => setActiveTab('documents')} 
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="file-text" size={16} color={activeTab === 'documents' ? Colors.WHITE : Colors.TEXT_SECONDARY} />
                                    <CustomText style={[styles.tabText, activeTab === 'documents' && { color: Colors.WHITE }]}>
                                        Documents
                                    </CustomText>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.tabBtn, activeTab === 'payment' && styles.tabBtnActive]} 
                                    onPress={() => setActiveTab('payment')} 
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon library="Feather" name="credit-card" size={16} color={activeTab === 'payment' ? Colors.WHITE : Colors.TEXT_SECONDARY} />
                                    <CustomText style={[styles.tabText, activeTab === 'payment' && { color: Colors.WHITE }]}>
                                        Payment
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {activeTab === 'documents' && (
                                <DocumentTab 
                                    booking={booking}
                                    docStates={docStates}
                                    setDocStates={setDocStates as unknown as React.Dispatch<React.SetStateAction<DocState[]>>}
                                    viewedDocs={viewedDocs}
                                    isReviewComplete={isReviewComplete}
                                    isRejectedStatus={isRejectedStatus}
                                    isCancelledStatus={isCancelledStatus}
                                    hasRejections={hasRejections}
                                    rejectionReason={rejectionReason}
                                    setRejectionReason={setRejectionReason}
                                    onViewFile={handleViewFile}
                                />
                            )}

                            {activeTab === 'payment' && (
                                <PaymentTab 
                                    booking={booking}
                                    currentStatus={currentStatus}
                                    isApprovedStatus={isApprovedStatus}
                                    isRejectedStatus={isRejectedStatus}
                                    isCancelledStatus={isCancelledStatus}
                                    onConfirmPaymentClick={() => setIsConfirmPaymentVisible(true)}
                                />
                             )}

                            <ActivityLog booking={booking} currentStatus={currentStatus} />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {!isReviewComplete && activeTab === 'documents' && (
                <View style={styles.footerWrapper}>
                    <CustomStickyFooter
                        primaryButton={{
                            title: "Submit Document Review",
                            onPress: () => {
                                if (isDecisionIncomplete || (hasRejections && !rejectionReason.trim())) {
                                    return Alert.alert(
                                        "Incomplete", 
                                        "Please approve or reject all documents and provide a reason if rejecting."
                                    );
                                }
                                setIsConfirmVisible(true);
                            },
                            disabled: isDecisionIncomplete || (hasRejections && !rejectionReason.trim())
                        }}
                    />
                </View>
            )}

            <ConfirmationModal 
                visible={isConfirmVisible} 
                onClose={() => setIsConfirmVisible(false)} 
                onConfirm={handleFinalDecision} 
                title="Process Decision" 
                message={hasRejections ? "Reject this booking and request corrections?" : "Documents are valid. Approve to proceed to payment?"} 
            />

            <ConfirmationModal 
                visible={isConfirmPaymentVisible} 
                onClose={() => setIsConfirmPaymentVisible(false)} 
                onConfirm={async () => {
                    setIsConfirmPaymentVisible(false);
                    setIsProcessingAction(true);
                    try {
                        await onConfirmPayment();
                    } finally {
                        setIsProcessingAction(false);
                    }
                }} 
                title="Complete Booking" 
                message="Are you sure you want to mark this transaction as verified and complete?" 
            />

            <ConfirmationModal 
                visible={showCancelUnpaidModal}
                onClose={() => setShowCancelUnpaidModal(false)}
                title="Cancel Booking?"
                message="Are you sure you want to cancel this unpaid booking? This will clear the slot."
                confirmText="Yes, Cancel"
                cancelText="Keep Booking"
                onConfirm={async () => {
                    setShowCancelUnpaidModal(false);
                    if (onCancelUnpaid) {
                        setIsProcessingAction(true);
                        try {
                            await onCancelUnpaid();
                        } finally {
                            setIsProcessingAction(false);
                        }
                    }
                }}
                isDestructive={true}
                iconName="alert-triangle"
            />

            <CustomSelectionModal 
                visible={showRescheduleModal} 
                onClose={() => setShowRescheduleModal(false)} 
                title="Select New Offer" 
                options={availableOffers} 
                selectedValue={selectedRescheduleOffer?.id} 
                onSelect={(selected: any) => {
                    setSelectedRescheduleOffer(selected);
                    setShowRescheduleModal(false);
                    setTimeout(async () => {
                        if (onReschedule) {
                            setIsProcessingAction(true);
                            try {
                                await onReschedule(selected.originalData);
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }, 300);
                }} 
            />

            <AdminRefundModal 
                visible={showRefundModal}
                amountPaid={totalAmountPaid}
                onClose={() => setShowRefundModal(false)}
                onSelect={(refundType: RefundType) => {
                    setShowRefundModal(false);
                    setTimeout(async () => {
                        if (onRefund) {
                            setIsProcessingAction(true);
                            try {
                                await onRefund(refundType);
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }
                    }, 300);
                }}
            />

            <ImagePreviewModal 
                visible={!!previewImageUrl} 
                imageUrl={previewImageUrl || undefined} 
                onClose={() => setPreviewImageUrl(null)} 
            />

            <AdminActionMenu 
                visible={showActionMenu}
                onClose={() => setShowActionMenu(false)}
                isCancelledStatus={isCancelledStatus || currentStatus === 'completed'}
                totalAmountPaid={totalAmountPaid}
                onRescheduleClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowRescheduleModal(true), 300);
                }}
                onRefundClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowRefundModal(true), 300);
                }}
                onCancelClick={() => {
                    setShowActionMenu(false);
                    setTimeout(() => setShowCancelUnpaidModal(true), 300);
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    centerContent: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerOptionsBtn: { 
        padding: 4 
    },
    constrainer: { 
        width: '100%', 
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center' 
    },
    scrollContent: { 
        padding: 16, 
        paddingBottom: 120, 
        paddingTop: 20 
    },
    tabContainer: { 
        flexDirection: 'row', 
        backgroundColor: Colors.WHITE, 
        borderRadius: 12, 
        padding: 4, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 20 
    },
    tabBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        paddingVertical: 12, 
        borderRadius: 8 
    },
    tabBtnActive: { 
        backgroundColor: Colors.PRIMARY 
    },
    tabText: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 14 
    },
    footerWrapper: { 
        alignItems: 'center', 
        width: '100%' 
    },

    // Two-Column Grid Styles
    splitLayoutContainer: {
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
        width: '100%',
        marginTop: 16
    },
    verticalLayoutContainer: {
        flexDirection: 'column',
        width: '100%',
        marginTop: 16,
        gap: 20
    },
    leftColumn: {
        flex: 1.2,
        minWidth: 320
    },
    rightColumn: {
        flex: 1.8,
        minWidth: 380
    },
    fullWidthContainer: {
        width: '100%'
    },


});

export default ReviewScreen;
