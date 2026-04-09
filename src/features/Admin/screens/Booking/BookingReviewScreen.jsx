import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const BookingReviewScreen = ({ 
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

    useEffect(() => {
        if (booking?.documents && Array.isArray(booking.documents)) {
            setDocStates(booking.documents.map(doc => ({ 
                name: doc.name, 
                file: doc.file, 
                valid: doc.valid ?? null 
            })));
        } else if (booking?.documents && typeof booking.documents === 'object') {
            const normalized = Object.entries(booking.documents).map(([key, value]) => ({
                name: value.name || key,
                file: value.file || '',
                valid: value.valid ?? null
            }));
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

    const hasRejections = docStates.some(d => d.valid === false);
    const isDecisionIncomplete = docStates.some(d => d.valid === null);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Review Documents" centerTitle onBackPress={onBackPress} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                        </View>
                    </View>
                </View>

                {error && <CustomText style={styles.errorText}>{error}</CustomText>}

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
                                style={[styles.decisionBtn, doc.valid === true && styles.btnActiveApprove]}
                                onPress={() => toggleDocDecision(index, true)}
                            >
                                <CustomIcon library="Feather" name="check" size={16} color={doc.valid === true ? Colors.WHITE : Colors.SUCCESS} />
                                <CustomText style={[styles.btnText, doc.valid === true && {color: Colors.WHITE}]}>Approve</CustomText>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.decisionBtn, doc.valid === false && styles.btnActiveReject]}
                                onPress={() => toggleDocDecision(index, false)}
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

                {hasRejections && (
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
                )}

                <CustomText variant="h3" style={[styles.sectionTitle, { marginTop: 12 }]}>Reschedule Offer</CustomText>
                {offers && offers.map(o => o.id !== booking.offer.id && (
                    <TouchableOpacity key={o.id} style={styles.offerItem} onPress={() => onReschedule(o)}>
                        <CustomText style={styles.offerDate}>{formatDate(o.date)}</CustomText>
                        <CustomText style={styles.offerPrice}>₱{o.price}</CustomText>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.refundBtn} onPress={onRefund}>
                    <CustomText style={styles.refundText}>Issue Refund</CustomText>
                </TouchableOpacity>
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "Submit Review",
                    onPress: () => setIsConfirmVisible(true),
                    disabled: isDecisionIncomplete || (hasRejections && !rejectionReason.trim())
                }}
            />

            <ConfirmationModal 
                visible={isConfirmVisible}
                onClose={() => setIsConfirmVisible(false)}
                onConfirm={handleFinalDecision}
                title="Process Decision"
                message={hasRejections ? "Are you sure you want to reject this booking and request document corrections?" : "All documents are valid. Approve this booking for payment?"}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 120 
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
    textArea: {
        minHeight: 140,
        height: 140,
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
    },
    offerItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 16, 
        backgroundColor: Colors.WHITE, 
        borderRadius: 12, 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    offerDate: { 
        fontWeight: '600', 
        color: Colors.PRIMARY 
    },
    offerPrice: { 
        fontWeight: 'bold' 
    },
    refundBtn: { 
        marginTop: 20, 
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
    errorText: { 
        color: Colors.ERROR, 
        marginBottom: 16, 
        textAlign: 'center' 
    },
    emptyState: { 
        padding: 40, 
        alignItems: 'center' 
    }
});

export default BookingReviewScreen;