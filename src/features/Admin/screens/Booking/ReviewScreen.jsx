import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomSelectModal from '@/src/components/CustomSelectModal';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

import DocumentReviewCard from '@/src/features/Admin/components/DocumentReviewCard';
import HikerProfileCard from '@/src/features/Admin/components/HikerProfileCard';

const ReviewScreen = ({ 
    isLoading, 
    booking, 
    offers, 
    onBackPress, 
    onApprove, 
    onReject, 
    onReschedule, 
    onRefund, 
    error 
}) => {
    const [activeTab, setActiveTab] = useState('documents'); 
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    const [docStates, setDocStates] = useState([]);
    const [viewedDocs, setViewedDocs] = useState({});
    const [rejectionReason, setRejectionReason] = useState('');
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState(null);

    const [personalVerified, setPersonalVerified] = useState(false);
    const [emergencyVerified, setEmergencyVerified] = useState(false);
    const [isMinor, setIsMinor] = useState(false);

    const currentStatus = booking?.status || 'for-reservation';
    const isApprovedStatus = ['for-payment', 'paid', 'completed'].includes(currentStatus);
    const isRejectedStatus = currentStatus === 'reservation-rejected';
    const isReviewComplete = isApprovedStatus || isRejectedStatus;

    useEffect(() => {
        if (booking?.user?.birthday) {
            const bday = new Date(booking.user.birthday);
            if (Number.isNaN(bday.getTime())) {
                setIsMinor(false);
                return;
            }

            const today = new Date();
            let age = today.getFullYear() - bday.getFullYear();
            const m = today.getMonth() - bday.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
                age--;
            }
            setIsMinor(age < 18);
        } else {
            setIsMinor(false);
        }
    }, [booking?.user?.birthday]);

    useEffect(() => {
        if (!booking?.documents) return;

        const mapDocument = (name, file, valid) => {
            let validState = 'pending';
            if (valid === 'approved' || valid === true) validState = 'approved';
            if (valid === 'rejected' || valid === false) validState = 'rejected';
            if (isApprovedStatus) validState = 'approved';
            if (isRejectedStatus && validState === 'pending') validState = 'rejected';
            return { 
                name: name || 'Unnamed Document', 
                file, 
                valid: validState 
            };
        };

        const docsArray = Array.isArray(booking.documents) 
            ? booking.documents.map((d, i) => mapDocument(d.name || `Req ${i+1}`, d.file, d.valid))
            : Object.entries(booking.documents).map(([k, v]) => mapDocument(v.name || k, v.file || '', v.valid));
        
        setDocStates(docsArray);
        
        const initialViewed = {};
        docsArray.forEach((d, i) => { 
            if (d.valid !== 'pending') {
                initialViewed[i] = true; 
            }
        });
        setViewedDocs(initialViewed);
        
        if (isApprovedStatus) {
            setActiveTab('payment');
        }

    }, [booking, booking?.documents, isApprovedStatus, isRejectedStatus]);

    const handleViewFile = async (url, index) => {
        if (!url) {
            return Alert.alert("Notice", "No file uploaded.");
        }
        
        setViewedDocs(prev => ({ ...prev, [index]: true }));

        if (url.toLowerCase().includes('.pdf')) {
            if (await Linking.canOpenURL(url)) {
                await Linking.openURL(url);
            }
        } else {
            setPreviewImageUrl(url);
        }
    };

    const toggleDocDecision = (index, statusString) => {
        if (isReviewComplete) return; 
        
        if (!viewedDocs[index] && docStates[index].valid === 'pending') {
            return Alert.alert("Review Required", "Please open the attachment first.");
        }
        
        const updated = [...docStates];
        updated[index] = { ...updated[index], valid: statusString };
        setDocStates(updated);
    };

    const handleFinalDecision = () => {
        const allApproved = docStates.every(d => d.valid === 'approved');
        
        if (allApproved) {
            onApprove(docStates);
            setActiveTab('payment');
        } else {
            onReject(rejectionReason, docStates); 
        }
        setIsConfirmVisible(false);
    };

    const getStatusText = () => {
        if (isRejectedStatus) return "REJECTED";
        if (currentStatus === 'for-payment') return "AWAITING PAYMENT";
        if (currentStatus === 'paid' || currentStatus === 'completed') return "COMPLETED";
        return "NEEDS REVIEW";
    };

    if (isLoading || !booking || !booking.user) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader 
                    title="Review Booking" 
                    centerTitle={true} 
                    onBackPress={onBackPress} 
                />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            </ScreenWrapper>
        );
    }

    const hasRejections = docStates.some(d => d.valid === 'rejected');
    const isDecisionIncomplete = docStates.length > 0 && docStates.some(d => d.valid === 'pending');
    
    const availableOffers = offers 
        ? offers.filter(o => o.id !== booking.offer.id).map(o => ({ 
            id: o.id, 
            label: formatDate(o.date), 
            subLabel: `₱${o.price}`, 
            originalData: o 
        })) 
        : [];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
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
                        <CustomIcon 
                            library="Feather" 
                            name="more-vertical" 
                            size={24} 
                            color={Colors.PRIMARY} 
                        />
                    </TouchableOpacity>
                }
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    
                    {error && !error.includes('No payment found') && (
                        <ErrorMessage error={error} />
                    )}
                    
                    {isReviewComplete && (
                        <View style={styles.completedBanner}>
                            <CustomIcon 
                                library="Feather" 
                                name={isApprovedStatus ? "check-circle" : "alert-circle"} 
                                size={20} 
                                color={isApprovedStatus ? Colors.SUCCESS : Colors.ERROR} 
                            />
                            <CustomText 
                                style={[
                                    styles.completedBannerText,
                                    { color: isApprovedStatus ? Colors.SUCCESS : Colors.ERROR }
                                ]}
                            >
                                {isApprovedStatus ? "Review Completed & Approved" : "Booking Rejected"}
                            </CustomText>
                        </View>
                    )}

                    <HikerProfileCard 
                        user={booking.user}
                        emergencyContact={booking.emergencyContact}
                        personalVerified={personalVerified} 
                        emergencyVerified={emergencyVerified}
                        onTogglePersonalVerify={() => setPersonalVerified(!personalVerified)}
                        onToggleEmergencyVerify={() => setEmergencyVerified(!emergencyVerified)}
                        statusText={getStatusText()}
                        isApprovedStatus={isApprovedStatus}
                        isRejectedStatus={isRejectedStatus}
                        isMinor={isMinor}
                    />

                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[
                                styles.tabBtn, 
                                activeTab === 'documents' && styles.tabBtnActive
                            ]} 
                            onPress={() => setActiveTab('documents')}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="file-text" 
                                size={16} 
                                color={activeTab === 'documents' ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                            />
                            <CustomText 
                                style={[
                                    styles.tabText, 
                                    activeTab === 'documents' && { color: Colors.WHITE }
                                ]}
                            >
                                Documents
                            </CustomText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.tabBtn, 
                                activeTab === 'payment' && styles.tabBtnActive
                            ]} 
                            onPress={() => setActiveTab('payment')}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="credit-card" 
                                size={16} 
                                color={activeTab === 'payment' ? Colors.WHITE : Colors.TEXT_SECONDARY} 
                            />
                            <CustomText 
                                style={[
                                    styles.tabText, 
                                    activeTab === 'payment' && { color: Colors.WHITE }
                                ]}
                            >
                                Payment
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'documents' && (
                        <View style={styles.tabContent}>
                            {docStates.map((doc, index) => (
                                <DocumentReviewCard 
                                    key={index} 
                                    doc={doc} 
                                    index={index} 
                                    needsReview={!viewedDocs[index] && doc.valid === 'pending'}
                                    isReviewComplete={isReviewComplete}
                                    onViewFile={handleViewFile} 
                                    onToggleDecision={toggleDocDecision}
                                />
                            ))}

                            {isRejectedStatus && booking?.cancellationReason ? (
                                <View style={styles.reasonBox}>
                                    <CustomText style={styles.rejectionLabel}>
                                        Rejection Reason
                                    </CustomText>
                                    <View style={styles.readOnlyReason}>
                                        <CustomText style={{ color: Colors.ERROR }}>
                                            {booking.cancellationReason}
                                        </CustomText>
                                    </View>
                                </View>
                            ) : (
                                hasRejections && !isReviewComplete && (
                                    <View style={styles.reasonBox}>
                                        <CustomFeedbackInput 
                                            label="Rejection Reason *"
                                            helperText="Explain why the document was rejected. The hiker will receive this exact message."
                                            placeholder="Explain what needs to be fixed..."
                                            value={rejectionReason}
                                            onChangeText={setRejectionReason}
                                            suggestions={[
                                                "Blurry / Unreadable Image",
                                                "Document Expired",
                                                "Wrong File Uploaded"
                                            ]}
                                        />
                                    </View>
                                )
                            )}
                        </View>
                    )}

                    {activeTab === 'payment' && (
                        <View style={styles.tabContent}>
                            {!isApprovedStatus ? (
                                <View style={styles.emptyPaymentBox}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="lock" 
                                        size={32} 
                                        color={Colors.GRAY_MEDIUM} 
                                        style={{ marginBottom: 12 }} 
                                    />
                                    <CustomText style={styles.emptyPaymentText}>
                                        You must approve all documents before accessing the payment verification phase.
                                    </CustomText>
                                </View>
                            ) : (
                                <View style={styles.paymentCard}>
                                    <CustomText style={styles.paymentInstruction}>
                                        The documents are approved. Awaiting hiker payment receipt.
                                    </CustomText>
                                    <CustomButton 
                                        title="Confirm Payment Received" 
                                        variant="primary" 
                                        onPress={() => Alert.alert("Coming Soon", "Backend payment logic not connected yet!")} 
                                    />
                                </View>
                            )}
                        </View>
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
                                    return Alert.alert("Incomplete", "Please approve or reject all documents and provide a reason if rejecting.");
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
            
            <CustomSelectModal 
                visible={showRescheduleModal} 
                onClose={() => setShowRescheduleModal(false)} 
                title="Select New Offer" 
                options={availableOffers} 
                selectedValue={selectedRescheduleOffer?.id} 
                onSelect={(selected) => {
                    setSelectedRescheduleOffer(selected);
                    setShowRescheduleModal(false);
                    setTimeout(() => {
                        if (onReschedule) onReschedule(selected.originalData);
                    }, 300);
                }} 
            />
            
            <ImagePreviewModal 
                visible={!!previewImageUrl} 
                imageUrl={previewImageUrl} 
                onClose={() => setPreviewImageUrl(null)} 
            />

            <Modal 
                transparent={true} 
                visible={showActionMenu} 
                animationType="fade" 
                onRequestClose={() => setShowActionMenu(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowActionMenu(false)}
                >
                    <View style={styles.actionSheetWrapper}>
                        <View style={styles.actionSheet}>
                            <View style={styles.actionSheetHandle} />
                            
                            <CustomText variant="h3" style={styles.actionSheetTitle}>
                                Manage Booking
                            </CustomText>
                            
                            <TouchableOpacity 
                                style={styles.actionItem} 
                                onPress={() => { 
                                    setShowActionMenu(false); 
                                    setTimeout(() => setShowRescheduleModal(true), 300); 
                                }}
                            >
                                <View style={styles.actionIconBg}>
                                    <CustomIcon library="Feather" name="calendar" size={18} color={Colors.PRIMARY} />
                                </View>
                                <CustomText style={styles.actionItemText}>
                                    Reschedule Booking
                                </CustomText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.actionItem} 
                                onPress={() => { 
                                    setShowActionMenu(false); 
                                    setTimeout(() => {
                                        if (onRefund) onRefund();
                                    }, 300); 
                                }}
                            >
                                <View style={[styles.actionIconBg, { backgroundColor: Colors.ERROR_BG }]}>
                                    <CustomIcon library="Feather" name="refresh-ccw" size={18} color={Colors.ERROR} />
                                </View>
                                <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>
                                    Issue Refund / Cancel
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

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
        maxWidth: 768, 
        alignSelf: 'center',
    },
    scrollContent: { 
        padding: 16, 
        paddingBottom: 120, 
        paddingTop: 20 
    },
    completedBanner: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 16, 
        backgroundColor: Colors.WHITE, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        gap: 8 
    },
    completedBannerText: {
        fontWeight: 'bold'
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
    tabContent: { 
        paddingTop: 4 
    },
    reasonBox: { 
        marginBottom: 24 
    },
    rejectionLabel: {
        color: Colors.ERROR, 
        marginBottom: 8,
        fontWeight: 'bold'
    },
    readOnlyReason: { 
        backgroundColor: Colors.ERROR_BG, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER 
    },
    paymentCard: { 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    paymentInstruction: {
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 12
    },
    emptyPaymentBox: { 
        backgroundColor: '#F9FAFB', 
        padding: 32, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
        alignItems: 'center' 
    },
    emptyPaymentText: {
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY
    },
    footerWrapper: { 
        alignItems: 'center', 
        width: '100%' 
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end', 
        alignItems: 'center' 
    },
    actionSheetWrapper: { 
        width: '100%', 
        maxWidth: 768 
    },
    actionSheet: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        padding: 24, 
        paddingBottom: 40 
    },
    actionSheetHandle: { 
        width: 40, 
        height: 4, 
        backgroundColor: Colors.GRAY_LIGHT, 
        borderRadius: 2, 
        alignSelf: 'center', 
        marginBottom: 16 
    },
    actionSheetTitle: { 
        marginBottom: 20 
    },
    actionItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        gap: 16 
    },
    actionIconBg: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    actionItemText: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: Colors.TEXT_PRIMARY 
    },
});

export default ReviewScreen;