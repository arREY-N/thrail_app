import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomSelectModal from '@/src/components/CustomSelectModal';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const BookingReviewScreen = ({ 
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
    const [docStates, setDocStates] = useState([]);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleOffer, setSelectedRescheduleOffer] = useState(null);

    // --- ARCHITECTURAL FIX: Infer State from Backend Status ---
    const currentStatus = booking?.status;
    const isApprovedStatus = ['for-payment', 'paid', 'completed'].includes(currentStatus);
    const isRejectedStatus = currentStatus === 'reservation-rejected';
    const isReviewComplete = isApprovedStatus || isRejectedStatus;

    useEffect(() => {
        if (!booking?.documents) return;

        const mapDocument = (name, file, valid) => {
            let inferredValid = valid ?? null;
            
            // If the backend didn't save the array, we infer the visual state from the overall status
            if (isApprovedStatus) inferredValid = true;
            if (isRejectedStatus && inferredValid === null) inferredValid = false;

            return { name, file, valid: inferredValid };
        };

        if (Array.isArray(booking.documents)) {
            setDocStates(booking.documents.map(doc => mapDocument(doc.name, doc.file, doc.valid)));
        } else if (typeof booking.documents === 'object') {
            const normalized = Object.entries(booking.documents).map(([key, value]) => 
                mapDocument(value.name || key, value.file || '', value.valid)
            );
            setDocStates(normalized);
        }
    }, [booking]);

    const handleViewFile = async (url) => {
        if (!url) return Alert.alert("Notice", "No file uploaded.");
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Cannot open this file URL.");
        }
    };

    const toggleDocDecision = (index, isValid) => {
        // Prevent changing decisions if the review is already submitted
        if (isReviewComplete) return; 
        
        const updated = [...docStates];
        updated[index].valid = isValid;
        setDocStates(updated);
    };

    const handleFinalDecision = () => {
        const allApproved = docStates.every(d => d.valid === true);
        if (allApproved) {
            onApprove(docStates); 
        } else {
            onReject(rejectionReason, docStates); 
        }
        setIsConfirmVisible(false);
    };

    if (isLoading) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Review Documents" centerTitle={true} onBackPress={onBackPress} />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    <CustomText style={{marginTop: 16, color: Colors.TEXT_SECONDARY}}>Loading booking details...</CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    if (!booking || !booking.user) {
        return null; 
    }

    const hasRejections = docStates.some(d => d.valid === false);
    const isDecisionIncomplete = docStates.length > 0 && docStates.some(d => d.valid === null);
    
    const availableOffers = offers 
        ? offers.filter(o => o.id !== booking.offer.id)
                .map(o => ({ id: o.id, label: formatDate(o.date), subLabel: `₱${o.price}`, originalData: o }))
        : [];

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Review Documents" centerTitle={true} onBackPress={onBackPress} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {isReviewComplete && (
                    <View style={styles.completedBanner}>
                        <CustomIcon library="Feather" name={isApprovedStatus ? "check-circle" : "alert-circle"} size={20} color={isApprovedStatus ? Colors.SUCCESS : Colors.ERROR} />
                        <CustomText style={{color: isApprovedStatus ? Colors.SUCCESS : Colors.ERROR, fontWeight: 'bold'}}>
                            {isApprovedStatus ? "Review Completed & Approved" : "Booking Rejected"}
                        </CustomText>
                    </View>
                )}

                <View style={styles.hikerCard}>
                    <CustomText variant="label" style={styles.label}>HIKER PROFILE</CustomText>
                    <View style={styles.hikerRow}>
                        <View style={styles.avatarLarge}>
                            <CustomText style={styles.avatarText}>
                                {booking.user.firstname?.[0]}{booking.user.lastname?.[0]}
                            </CustomText>
                        </View>
                        <View style={styles.hikerInfoGroup}>
                            <CustomText variant="h3">{booking.user.firstname} {booking.user.lastname}</CustomText>
                            <CustomText variant="caption">{booking.user.email}</CustomText>
                            {booking.user.username && (
                                <CustomText variant="caption">@{booking.user.username}</CustomText>
                            )}
                        </View>
                    </View>

                    {booking.emergencyContact && booking.emergencyContact.name ? (
                        <>
                            <View style={styles.cardDivider} />
                            <CustomText variant="label" style={styles.label}>EMERGENCY CONTACT</CustomText>
                            <View style={styles.emergencyRow}>
                                <View style={styles.iconCircle}>
                                    <CustomIcon library="Feather" name="phone-call" size={16} color={Colors.PRIMARY} />
                                </View>
                                <View style={styles.emergencyTextGroup}>
                                    <CustomText style={styles.emergencyName}>{booking.emergencyContact.name}</CustomText>
                                    <CustomText variant="caption">{booking.emergencyContact.contactNumber}</CustomText>
                                </View>
                            </View>
                        </>
                    ) : null}
                </View>

                {error && <ErrorMessage error={error} />}

                <CustomText variant="h3" style={styles.sectionTitle}>Submitted Requirements</CustomText>

                {docStates.length > 0 ? docStates.map((doc, index) => (
                    <View key={index} style={[
                        styles.docCard, 
                        doc.valid === true && styles.cardApproved,
                        doc.valid === false && styles.cardRejected
                    ]}>
                        <View style={styles.docHeader}>
                            <CustomText style={styles.docName}>{doc.name}</CustomText>
                            {doc.valid !== null && (
                                <View style={[styles.badge, { backgroundColor: doc.valid ? Colors.STATUS_APPROVED_BG : Colors.ERROR_BG }]}>
                                    <CustomText variant="caption" style={[styles.badgeText, { color: doc.valid ? Colors.SUCCESS : Colors.ERROR }]}>
                                        {doc.valid ? "VALID" : "INVALID"}
                                    </CustomText>
                                </View>
                            )}
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.viewFileBtn} 
                            onPress={() => handleViewFile(doc.file)}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="eye" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.viewFileText}>Open Attachment</CustomText>
                        </TouchableOpacity>

                        <View style={styles.btnRow}>
                            <TouchableOpacity 
                                style={[styles.decisionBtn, doc.valid === true && styles.btnActiveApprove, isReviewComplete && { opacity: 0.8 }]}
                                onPress={() => toggleDocDecision(index, true)}
                                activeOpacity={isReviewComplete ? 1 : 0.7}
                            >
                                <CustomIcon library="Feather" name="check" size={16} color={doc.valid === true ? Colors.WHITE : Colors.SUCCESS} />
                                <CustomText style={[styles.btnText, doc.valid === true && {color: Colors.WHITE}]}>Approve</CustomText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.decisionBtn, doc.valid === false && styles.btnActiveReject, isReviewComplete && { opacity: 0.8 }]}
                                onPress={() => toggleDocDecision(index, false)}
                                activeOpacity={isReviewComplete ? 1 : 0.7}
                            >
                                <CustomIcon library="Feather" name="x" size={16} color={doc.valid === false ? Colors.WHITE : Colors.ERROR} />
                                <CustomText style={[styles.btnText, doc.valid === false && {color: Colors.WHITE}]}>Reject</CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )) : (
                    <View style={styles.emptyState}>
                        <CustomText variant="caption">No documents attached.</CustomText>
                    </View>
                )}

                {/* Show read-only reason if already rejected, OR show input box if actively rejecting */}
                {isRejectedStatus && booking?.cancellationReason ? (
                    <View style={styles.reasonBox}>
                        <CustomText variant="label" style={{color: Colors.ERROR, marginBottom: 8}}>Rejection Reason</CustomText>
                        <View style={styles.readOnlyReason}>
                            <CustomText style={{color: Colors.ERROR}}>{booking.cancellationReason}</CustomText>
                        </View>
                    </View>
                ) : (
                    hasRejections && !isReviewComplete && (
                        <View style={styles.reasonBox}>
                            <CustomTextInput 
                                label="Rejection Reason *"
                                placeholder="Explain what needs to be fixed..."
                                value={rejectionReason}
                                onChangeText={setRejectionReason}
                                multiline={true}
                                numberOfLines={3}
                                inputStyle={styles.textArea}
                            />
                        </View>
                    )
                )}

                <CustomText variant="h3" style={[styles.sectionTitle, { marginTop: 12 }]}>Reschedule Offer</CustomText>
                
                <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowRescheduleModal(true)}
                    activeOpacity={0.7}
                >
                    <CustomText style={selectedRescheduleOffer ? styles.dropdownText : styles.dropdownPlaceholder}>
                        {selectedRescheduleOffer ? selectedRescheduleOffer.label : "Select new date..."}
                    </CustomText>
                    <CustomIcon library="Feather" name="chevron-down" size={20} color={Colors.TEXT_SECONDARY} />
                </TouchableOpacity>

                {selectedRescheduleOffer && (
                    <CustomButton 
                        title="Confirm Reschedule"
                        onPress={() => onReschedule(selectedRescheduleOffer.originalData)}
                        variant="primary"
                        style={{marginBottom: 16}}
                    />
                )}

                <TouchableOpacity style={styles.refundBtn} onPress={onRefund}>
                    <CustomText style={styles.refundText}>Issue Refund</CustomText>
                </TouchableOpacity>
            </ScrollView>

            {/* ONLY show the footer if the review is NOT complete */}
            {!isReviewComplete && (
                <CustomStickyFooter
                    primaryButton={{
                        title: "Submit Review",
                        onPress: () => {
                            if (isDecisionIncomplete || (hasRejections && !rejectionReason.trim())) {
                                Alert.alert("Incomplete", "Please approve or reject all documents and provide a reason if rejecting.");
                                return;
                            }
                            setIsConfirmVisible(true);
                        },
                        disabled: isDecisionIncomplete || (hasRejections && !rejectionReason.trim())
                    }}
                />
            )}

            <ConfirmationModal 
                visible={isConfirmVisible}
                onClose={() => setIsConfirmVisible(false)}
                onConfirm={handleFinalDecision}
                title="Process Decision"
                message={hasRejections ? "Are you sure you want to reject this booking and request document corrections?" : "All documents are valid. Approve this booking for payment?"}
            />

            <CustomSelectModal 
                visible={showRescheduleModal}
                onClose={() => setShowRescheduleModal(false)}
                title="Select New Offer"
                options={availableOffers}
                selectedValue={selectedRescheduleOffer?.id}
                onSelect={(selected) => setSelectedRescheduleOffer(selected)}
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
    scrollContent: { 
        padding: 16, 
        paddingBottom: 120 
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
    hikerCard: { 
        backgroundColor: Colors.WHITE, 
        padding: 20, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 20 
    },
    label: { 
        color: Colors.PRIMARY, 
        fontSize: 11, 
        letterSpacing: 1, 
        marginBottom: 12 
    },
    hikerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16 
    },
    avatarLarge: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        backgroundColor: Colors.SECONDARY, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    avatarText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 18 
    },
    hikerInfoGroup: { 
        flex: 1 
    },
    sectionTitle: { 
        marginBottom: 16, 
        fontWeight: 'bold', 
        marginLeft: 4 
    },
    docCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        padding: 16, 
        marginBottom: 16 
    },
    cardApproved: { 
        borderColor: Colors.SUCCESS, 
        backgroundColor: Colors.STATUS_APPROVED_BG 
    },
    cardRejected: { 
        borderColor: Colors.ERROR, 
        backgroundColor: Colors.ERROR_BG 
    },
    docHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    docName: { 
        fontSize: 15, 
        fontWeight: '600' 
    },
    badge: { 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: 6 
    },
    badgeText: { 
        fontWeight: 'bold', 
        fontSize: 10 
    },
    viewFileBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 12, 
        borderRadius: 12, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    viewFileText: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    btnRow: { 
        flexDirection: 'row', 
        gap: 12 
    },
    decisionBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8, 
        paddingVertical: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        backgroundColor: Colors.WHITE 
    },
    btnActiveApprove: { 
        backgroundColor: Colors.SUCCESS, 
        borderColor: Colors.SUCCESS 
    },
    btnActiveReject: { 
        backgroundColor: Colors.ERROR, 
        borderColor: Colors.ERROR 
    },
    btnText: { 
        fontWeight: 'bold', 
        fontSize: 14, 
        color: Colors.TEXT_PRIMARY 
    },
    reasonBox: { 
        marginBottom: 24, 
        paddingHorizontal: 4,
    },
    readOnlyReason: {
        backgroundColor: Colors.ERROR_BG, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER
    },
    textArea: {
        minHeight: 140,
        height: 140,
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: Colors.WHITE,
    },
    dropdownText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: '500',
    },
    dropdownPlaceholder: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 16,
    },
    refundBtn: { 
        marginTop: 12, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR,  
        alignItems: 'center' 
    },
    refundText: { 
        color: Colors.ERROR, 
        fontWeight: 'bold' 
    },
    emptyState: { 
        padding: 40, 
        alignItems: 'center' 
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    emergencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyTextGroup: {
        flex: 1,
    },
    emergencyName: {
        fontWeight: 'bold',
        fontSize: 15,
        color: Colors.TEXT_PRIMARY,
    },
});

export default BookingReviewScreen;