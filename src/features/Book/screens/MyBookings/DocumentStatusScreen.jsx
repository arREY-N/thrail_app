import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const DocumentStatusScreen = ({ 
    bookingData, 
    onBackPress, 
    onViewDetails,
    onReuploadDoc 
}) => {
    const trailName = bookingData?.trail?.name || "Hiking Package";
    const businessName = bookingData?.business?.name || "Tour Provider";
    const currentStatus = bookingData?.status;

    // Check if the overall booking is rejected
    const isRejected = currentStatus === 'reservation-rejected';

    // Gracefully handle Phase 1 Data Mismatch (Object vs Array)
    let documents = [];
    if (Array.isArray(bookingData?.documents)) {
        documents = bookingData.documents;
    } else if (bookingData?.documents && typeof bookingData.documents === 'object') {
        documents = Object.entries(bookingData.documents).map(([name, valid]) => ({ name, file: '', valid }));
    }

    // Dynamic Header Configuration
    let headerIcon = "file-text";
    let headerColor = Colors.PRIMARY;
    let headerTitle = "Review in Progress";
    let headerSubtitle = `Your documents for ${trailName} are currently being reviewed by ${businessName}.`;

    if (isRejected) {
        headerIcon = "alert-circle";
        headerColor = Colors.ERROR;
        headerTitle = "Action Required";
        headerSubtitle = `Some documents for ${trailName} were rejected by ${businessName}. Please review and update them below.`;
    } else if (currentStatus === 'for-payment' || currentStatus === 'approved-docs') {
        headerIcon = "check-circle";
        headerColor = Colors.SUCCESS;
        headerTitle = "Verification Complete";
        headerSubtitle = `Your documents for ${trailName} have been approved! You can now proceed to payment.`;
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Verification Status" 
                centerTitle={true} 
                onBackPress={onBackPress} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.headerSection}>
                    <View style={[styles.iconCircle, { backgroundColor: headerColor, shadowColor: headerColor }]}>
                        <CustomIcon 
                            library="Feather" 
                            name={headerIcon} 
                            size={36} 
                            color={Colors.WHITE} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.title}>
                        {headerTitle}
                    </CustomText>
                    <CustomText variant="body" style={styles.subtitle}>
                        {headerSubtitle}
                    </CustomText>
                </View>

                <View style={styles.documentListContainer}>
                    <CustomText variant="h3" style={styles.listTitle}>
                        Document Status
                    </CustomText>

                    {documents.map((doc, index) => {
                        const isApproved = doc.valid;
                        const isDocRejected = isRejected && !isApproved;
                        
                        let docIcon = "clock";
                        let docColor = Colors.WARNING; 
                        let docStatusText = "Pending Review";

                        if (isApproved) {
                            docIcon = "check-circle";
                            docColor = Colors.SUCCESS;
                            docStatusText = "Approved";
                        } else if (isDocRejected) {
                            docIcon = "x-circle";
                            docColor = Colors.ERROR;
                            docStatusText = "Rejected - Needs Update";
                        }

                        return (
                            <View key={index} style={[styles.docCard, isDocRejected && styles.docCardRejected]}>
                                <View style={styles.docHeader}>
                                    <View style={styles.docNameRow}>
                                        <CustomIcon library="Feather" name="file" size={20} color={Colors.TEXT_PRIMARY} />
                                        <CustomText variant="label" style={styles.docName}>
                                            {doc.name}
                                        </CustomText>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${docColor}15` }]}>
                                        <CustomIcon library="Feather" name={docIcon} size={12} color={docColor} />
                                        <CustomText variant="caption" style={[styles.statusBadgeText, { color: docColor }]}>
                                            {docStatusText}
                                        </CustomText>
                                    </View>
                                </View>

                                {isDocRejected && (
                                    <TouchableOpacity 
                                        style={styles.reuploadButton}
                                        onPress={() => onReuploadDoc && onReuploadDoc(doc)}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="upload-cloud" size={16} color={Colors.WHITE} />
                                        <CustomText variant="caption" style={styles.reuploadButtonText}>
                                            Re-upload Document
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

                {!isRejected && currentStatus !== 'for-payment' && currentStatus !== 'approved-docs' && (
                    <View style={styles.infoBox}>
                        <CustomIcon library="Feather" name="info" size={20} color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.infoText}>
                            Verification usually takes 1–2 business days. You will receive a notification once you are cleared to proceed to payment.
                        </CustomText>
                    </View>
                )}
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "View Booking Details",
                    onPress: onViewDetails
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingHorizontal: 24, 
        paddingTop: 32, 
        paddingBottom: 120,
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 32,
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    title: { 
        marginBottom: 12, 
        textAlign: 'center',
        color: Colors.TEXT_PRIMARY,
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    documentListContainer: {
        width: '100%',
        marginBottom: 32,
    },
    listTitle: {
        marginBottom: 16,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    docCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    docCardRejected: {
        borderColor: Colors.ERROR,
        backgroundColor: '#FFF5F5',
    },
    docHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    docNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    docName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusBadgeText: {
        fontWeight: 'bold',
        fontSize: 11,
    },
    reuploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.ERROR,
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    reuploadButtonText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'flex-start',
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    },
});

export default DocumentStatusScreen;