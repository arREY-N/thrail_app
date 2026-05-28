import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
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
import AdminActionMenu from '@/src/features/Admin/screens/Booking/components/AdminActionMenu';
import AdminCancelModal from '@/src/features/Admin/screens/Booking/components/AdminCancelModal';
import AdminDocumentTab from '@/src/features/Admin/screens/Booking/components/AdminDocumentTab';
import AdminPaymentTab from '@/src/features/Admin/screens/Booking/components/AdminPaymentTab';
import AdminRefundModal from '@/src/features/Admin/screens/Booking/components/AdminRefundModal';
import HikerProfileCard from '@/src/features/Admin/screens/Booking/components/HikerProfileCard';
import ReviewStatusBanner from '@/src/features/Admin/screens/Booking/components/ReviewStatusBanner';

const ReviewScreen = ({ 
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
    error 
}) => {
    
    const {
        activeTab, setActiveTab,
        docStates, setDocStates,
        viewedDocs, setViewedDocs,
        rejectionReason, setRejectionReason,
        personalVerified, setPersonalVerified,
        emergencyVerified, setEmergencyVerified,
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

    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isConfirmPaymentVisible, setIsConfirmPaymentVisible] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState(null);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showCancelUnpaidModal, setShowCancelUnpaidModal] = useState(false);
    
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    const totalAmountPaid = booking?.payment?.reduce((sum, p) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;

    const handleViewFile = async (url, index) => {
        if (!url) return Alert.alert("Notice", "No file uploaded.");
        
        setViewedDocs(prev => ({ ...prev, [index]: true }));

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
        const allApproved = docStates.every(d => d.valid === 'approved');
        
        setIsProcessingAction(true);
        try {
            if (allApproved) {
                await onApprove(docStates);
                setActiveTab('payment');
            } else {
                await onReject(rejectionReason, docStates); 
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
                    
                    <ReviewStatusBanner 
                        currentStatus={currentStatus}
                        cancellationReason={displayCancellationReason}
                        rejectionReason={rejectionReason}
                    />

                    <HikerProfileCard 
                        user={booking.user}
                        emergencyContact={booking.emergencyContact}
                        personalVerified={personalVerified} 
                        emergencyVerified={emergencyVerified}
                        onTogglePersonalVerify={() => setPersonalVerified(!personalVerified)}
                        onToggleEmergencyVerify={() => setEmergencyVerified(!emergencyVerified)}
                        statusText={adminStatusConfig.label}
                        statusBgColor={adminStatusConfig.bgColor}
                        statusTextColor={adminStatusConfig.textColor}
                        isMinor={isMinor}
                    />

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
                        <AdminDocumentTab 
                            booking={booking}
                            docStates={docStates}
                            setDocStates={setDocStates}
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
                        <AdminPaymentTab 
                            booking={booking}
                            currentStatus={currentStatus}
                            isApprovedStatus={isApprovedStatus}
                            isRejectedStatus={isRejectedStatus}
                            isCancelledStatus={isCancelledStatus}
                            onConfirmPaymentClick={() => setIsConfirmPaymentVisible(true)}
                        />
                    )}
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
            
            <CustomSelectionModal 
                visible={showRescheduleModal} 
                onClose={() => setShowRescheduleModal(false)} 
                title="Select New Offer" 
                options={availableOffers} 
                selectedValue={selectedRescheduleOffer?.id} 
                onSelect={(selected) => {
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
                onSelect={(refundType) => {
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

            <AdminCancelModal 
                visible={showCancelUnpaidModal}
                onClose={() => setShowCancelUnpaidModal(false)}
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
            />
            
            <ImagePreviewModal 
                visible={!!previewImageUrl} 
                imageUrl={previewImageUrl} 
                onClose={() => setPreviewImageUrl(null)} 
            />

            <AdminActionMenu 
                visible={showActionMenu}
                onClose={() => setShowActionMenu(false)}
                isCancelledStatus={isCancelledStatus}
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
    }
});

export default ReviewScreen;