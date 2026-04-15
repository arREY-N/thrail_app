import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import { Colors } from '@/src/constants/colors';

const UploadScreen = ({
    amountToPay,
    selectedMethod,
    businessName,
    receiptImage,
    setReceiptImage
}) => {
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
                <CustomText variant="h2" style={styles.sectionTitle}>
                    Transfer Instructions
                </CustomText>

                <View style={styles.instructionCard}>
                    <CustomText variant="body" style={styles.instructionText}>
                        Please open your <CustomText style={styles.boldLabel}>{selectedMethod === 'gcash' ? 'GCash' : 'Maya'}</CustomText> app and send exactly <CustomText style={styles.boldValuePrimary}>₱{amountToPay.toFixed(2)}</CustomText> to the tour provider's account below.
                    </CustomText>
                    
                    <View style={styles.accountBox}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Account Name</CustomText>
                        <CustomText variant="body" style={styles.accountName}>{businessName}</CustomText>
                        
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Account Number</CustomText>
                        <CustomText variant="h1" style={styles.accountNumber}>0912 345 6789</CustomText>
                    </View>
                </View>

                <CustomText variant="h2" style={styles.sectionTitle}>
                    Upload Receipt
                </CustomText>
                
                <DocumentUploadCard 
                    docName={`${selectedMethod === 'gcash' ? 'GCash' : 'Maya'} Receipt`}
                    docKey="receipt"
                    isUploaded={receiptImage}
                    onUploadSuccess={(url) => setReceiptImage(url)}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingBottom: 120, 
    },
    section: { 
        paddingTop: 24, 
    },
    sectionTitle: { 
        marginBottom: 16, 
        color: Colors.TEXT_PRIMARY, 
    },
    boldLabel: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
    },
    boldValuePrimary: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
    },
    instructionCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 24, 
    },
    instructionText: { 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center', 
        marginBottom: 20, 
        lineHeight: 22, 
    },
    accountBox: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 16, 
        borderRadius: 12, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
    },
    accountName: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 12, 
        marginTop: 4, 
    },
    accountNumber: { 
        color: Colors.PRIMARY, 
        letterSpacing: 2, 
        marginTop: 4, 
    },
});

export default UploadScreen;