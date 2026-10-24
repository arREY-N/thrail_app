/**
 * @file ManualQRMethodScreen.tsx
 * @description Dedicated manual QR payment screen displaying organizer QR code,
 * step-by-step payment instructions, "Save QR to Gallery", receipt screenshot upload,
 * optional reference number, and legal terms digital signature.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import CustomButton from '@/src/components/CustomButton';
import { getStickyFooterScrollPadding } from '@/src/components/CustomStickyFooter';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import TermsSignature from '@/src/features/Book/components/TermsSignature';
import { Booking } from '@/src/core/models/Booking/Booking';
import { IBusinessPaymentConfig } from '@/src/core/models/Business/Business';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import { db } from '@/src/core/config/Firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface ManualQRMethodScreenProps {
    bookingData: Booking;
    amountToPay: number;
    paymentType?: 'full' | 'downpayment' | string;
    setPaymentType?: (type: 'full' | 'downpayment') => void;
    receiptUrl: string;
    setReceiptUrl: (url: string) => void;
    referenceCode: string;
    setReferenceCode: (code: string) => void;
    profileFullName: string;
    setIsSignatureValid: (isValid: boolean) => void;
    paymentError?: string | null;
    isPayingBalance: boolean;
    isMinor: boolean;
    minorName?: string;
}

export const ManualQRMethodScreen: React.FC<ManualQRMethodScreenProps> = ({
    bookingData,
    amountToPay,
    paymentType,
    setPaymentType,
    receiptUrl,
    setReceiptUrl,
    referenceCode,
    setReferenceCode,
    profileFullName,
    setIsSignatureValid,
    paymentError,
    isPayingBalance,
    isMinor,
    minorName,
}) => {
    const { showToast } = useToast();
    const [isSavingQR, setIsSavingQR] = useState(false);
    const [previewQRVisible, setPreviewQRVisible] = useState(false);

    const storeOffer = useOfferStore.getState().data.find(o => o.id === bookingData?.offer?.id);
    const businessId = bookingData?.business?.id || storeOffer?.business?.id || '';

    const [livePaymentConfig, setLivePaymentConfig] = useState<IBusinessPaymentConfig<Date> | null>(
        bookingData?.business?.paymentConfig || null
    );
    const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(
        !bookingData?.business?.paymentConfig && Boolean(businessId)
    );

    useEffect(() => {
        if (!businessId) {
            return;
        }

        const businessDocRef = doc(db, 'businesses', businessId);
        const unsubscribe = onSnapshot(
            businessDocRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data?.paymentConfig?.qrCodeUrl) {
                        setLivePaymentConfig({
                            qrCodeUrl: data.paymentConfig.qrCodeUrl,
                            accountName: data.paymentConfig.accountName,
                            accountNumber: data.paymentConfig.accountNumber,
                            providerName: data.paymentConfig.providerName,
                            updatedAt: data.paymentConfig.updatedAt?.toDate ? data.paymentConfig.updatedAt.toDate() : new Date(),
                            updatedBy: data.paymentConfig.updatedBy || '',
                        });
                    } else {
                        setLivePaymentConfig(null);
                    }
                }
                setIsLoadingConfig(false);
            },
            (err) => {
                console.warn('[ManualQRMethodScreen] Error fetching business QR:', err);
                setIsLoadingConfig(false);
            }
        );

        return () => unsubscribe();
    }, [businessId]);

    const paymentConfig = livePaymentConfig || bookingData?.business?.paymentConfig;
    const qrCodeUrl = paymentConfig?.qrCodeUrl;
    const accountName = paymentConfig?.accountName || 'Designated Business Account';
    const accountNumber = paymentConfig?.accountNumber || 'See QR Code';
    const providerName = paymentConfig?.providerName || 'GCash / Maya';

    const handleSaveQR = useCallback(async () => {
        if (!qrCodeUrl) {
            showToast.error('No QR code image available to save.');
            return;
        }

        try {
            setIsSavingQR(true);
            if (Platform.OS === 'web') {
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `thrail-payment-qr-${Date.now()}.png`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast.success('QR Code download started.');
            } else {
                const fileUri = `${FileSystem.documentDirectory || ''}payment-qr-${Date.now()}.png`;
                const { uri } = await FileSystem.downloadAsync(qrCodeUrl, fileUri);

                try {
                    const permission = await MediaLibrary.requestPermissionsAsync();
                    if (permission.granted) {
                        await MediaLibrary.saveToLibraryAsync(uri);
                        showToast.success('QR Code saved to Gallery!');
                    } else if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(uri);
                    } else {
                        showToast.error('Permission to save to Gallery was denied.');
                    }
                } catch (mediaErr) {
                    console.warn('MediaLibrary save failed, falling back to Sharing:', mediaErr);
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(uri);
                    } else {
                        throw mediaErr;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to save QR code:', err);
            showToast.error('Could not save QR code to device.');
        } finally {
            setIsSavingQR(false);
        }
    }, [qrCodeUrl, showToast]);

    const insets = useSafeAreaInsets();
    const { isMobile } = useBreakpoints();
    const bottomScrollPadding = Math.max(getStickyFooterScrollPadding(insets.bottom, isMobile), 140);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: bottomScrollPadding },
            ]}
        >
            <View style={styles.constrainer}>
                {paymentError && (
                    <View style={styles.errorBanner}>
                        <CustomIcon library="Feather" name="alert-circle" size={18} color={Colors.ERROR} />
                        <CustomText style={styles.errorBannerText}>{paymentError}</CustomText>
                    </View>
                )}

                {bookingData?.paymentVerificationStatus === 'rejected' && (
                    <View style={styles.rejectionNoticeCard}>
                        <View style={styles.rejectionNoticeHeader}>
                            <View style={styles.rejectionIconCircle}>
                                <CustomIcon library="Feather" name="alert-triangle" size={18} color={Colors.ERROR} />
                            </View>
                            <View style={styles.rejectionNoticeHeaderTexts}>
                                <CustomText style={styles.rejectionNoticeTitle}>Payment Verification Rejected</CustomText>
                                <CustomText variant="caption" style={styles.rejectionNoticeSubtitle}>
                                    Your previous receipt was not accepted by the organizer.
                                </CustomText>
                            </View>
                        </View>
                        {bookingData.paymentRejectionReason ? (
                            <View style={styles.rejectionReasonBox}>
                                <CustomText variant="caption" style={styles.rejectionReasonLabel}>
                                    Organizer Feedback:
                                </CustomText>
                                <CustomText style={styles.rejectionReasonText}>
                                    {`"${bookingData.paymentRejectionReason}"`}
                                </CustomText>
                            </View>
                        ) : null}
                        <CustomText variant="caption" style={styles.rejectionNoticeDesc}>
                            Please send the payment again and upload a clear screenshot of the valid transaction receipt.
                        </CustomText>
                    </View>
                )}

                {/* Amount to Pay Card */}
                <View style={styles.amountDisplayCard}>
                    <CustomText variant="caption" style={styles.amountDisplayLabel}>
                        {isPayingBalance ? 'Remaining Balance to Settle' : 'Total Package Amount'}
                    </CustomText>
                    <CustomText variant="h1" style={styles.amountDisplayText}>
                        ₱{amountToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </CustomText>
                    <CustomText variant="caption" style={styles.amountHelperText}>
                        {isPayingBalance
                            ? 'Please send your payment to settle the balance.'
                            : 'You may pay in full or send an initial downpayment. The organizer will verify the exact amount from your receipt.'}
                    </CustomText>
                    {isPayingBalance && (
                        <View style={styles.balanceBadge}>
                            <CustomText style={styles.balanceBadgeText}>Balance Settlement</CustomText>
                        </View>
                    )}
                </View>

                {/* Master QR Code Section */}
                <View style={styles.section}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        {"Scan Organizer's QR Code"}
                    </CustomText>
                    <CustomText style={styles.sectionSubtitle}>
                        Scan via {providerName} or any QR Ph compatible banking app.
                    </CustomText>

                    <View style={styles.qrCard}>
                        {isLoadingConfig ? (
                            <View style={styles.qrLoadingBox}>
                                <ActivityIndicator size="small" color={Colors.PRIMARY} />
                                <CustomText style={styles.qrLoadingText}>
                                    Retrieving organizer payment QR...
                                </CustomText>
                            </View>
                        ) : qrCodeUrl ? (
                            <>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setPreviewQRVisible(true)}
                                    style={styles.qrImageContainer}
                                >
                                    <Image
                                        source={{ uri: qrCodeUrl }}
                                        style={styles.qrImage}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.tapToZoomRow}>
                                        <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.TEXT_MUTED} />
                                        <CustomText style={styles.tapToZoomText}>Tap to enlarge</CustomText>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.accountInfoBox}>
                                    <View style={styles.accountInfoRow}>
                                        <CustomText style={styles.accountLabel}>Account Name:</CustomText>
                                        <CustomText style={styles.accountValue}>{accountName}</CustomText>
                                    </View>
                                    <View style={styles.accountInfoRow}>
                                        <CustomText style={styles.accountLabel}>Account / Mobile:</CustomText>
                                        <CustomText style={styles.accountValue}>{accountNumber}</CustomText>
                                    </View>
                                    <View style={styles.accountInfoRow}>
                                        <CustomText style={styles.accountLabel}>Provider:</CustomText>
                                        <CustomText style={styles.accountValue}>{providerName}</CustomText>
                                    </View>
                                </View>

                                <CustomButton
                                    title={isSavingQR ? 'Saving...' : 'Save QR to Gallery'}
                                    variant="outline"
                                    icon="download"
                                    iconLibrary="Feather"
                                    onPress={handleSaveQR}
                                    isLoading={isSavingQR}
                                    style={styles.saveQRButton}
                                />
                            </>
                        ) : (
                            <View style={styles.noQRBox}>
                                <CustomIcon library="Feather" name="alert-triangle" size={32} color={Colors.WARNING} />
                                <CustomText style={styles.noQRTitle}>No Payment QR Available</CustomText>
                                <CustomText style={styles.noQRSubtitle}>
                                    The tour organizer has not yet uploaded their master payment QR. Please contact the organizer directly.
                                </CustomText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Step-by-Step Payment Instructions */}
                <View style={styles.section}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        How to Pay
                    </CustomText>
                    <View style={styles.instructionsContainer}>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>1</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Save or scan the QR code above using your e-wallet (GCash, Maya) or banking app.
                            </CustomText>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>2</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Transfer exactly <CustomText style={{ fontWeight: '700' }}>₱{amountToPay.toFixed(2)}</CustomText> to the account shown.
                            </CustomText>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>3</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Take a clear screenshot of the completed payment receipt showing the Reference Number.
                            </CustomText>
                        </View>
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>4</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Upload the receipt screenshot below and sign the terms before submitting.
                            </CustomText>
                        </View>
                    </View>
                </View>

                {/* Upload Receipt Section */}
                <View style={styles.section}>
                    <CustomText variant="h2" style={styles.sectionTitle}>
                        Upload Payment Receipt
                    </CustomText>
                    <CustomText style={styles.sectionSubtitle}>
                        Proof of transfer is required so the organizer can verify your booking.
                    </CustomText>

                    <DocumentUploadCard
                        docName="Payment Receipt Screenshot"
                        subtitle="Upload clear screenshot showing amount & reference number"
                        isUploaded={receiptUrl || undefined}
                        isRejected={bookingData?.paymentVerificationStatus === 'rejected'}
                        rejectionReason={bookingData?.paymentRejectionReason}
                        onUploadSuccess={(url) => setReceiptUrl(url)}
                        onDelete={() => setReceiptUrl('')}
                    />

                    {/* Reference Number Input */}
                    <View style={styles.refInputContainer}>
                        <CustomTextInput
                            label="Reference / Transaction Number (Optional)"
                            placeholder="e.g. 1002 9384 1234"
                            value={referenceCode}
                            onChangeText={setReferenceCode}
                            icon="hash"
                            iconLibrary="Feather"
                        />
                    </View>
                </View>

                {/* Terms & Digital Signature */}
                <View style={styles.section}>
                    <TermsSignature
                        expectedName={profileFullName}
                        isMinor={isMinor}
                        minorName={minorName}
                        onValidChange={setIsSignatureValid}
                    />
                </View>
            </View>

            {/* Modal for viewing large QR */}
            {qrCodeUrl && (
                <ImagePreviewModal
                    visible={previewQRVisible}
                    imageUrl={qrCodeUrl}
                    onClose={() => setPreviewQRVisible(false)}
                />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 16,
    },
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        gap: 20,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
    },
    errorBannerText: {
        flex: 1,
        color: Colors.STATUS_CANCELLED_TEXT,
        fontSize: 13,
        fontWeight: '500',
    },
    amountDisplayCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    amountDisplayLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    amountDisplayText: {
        color: Colors.PRIMARY,
        fontSize: 32,
        fontWeight: 'bold',
    },
    amountHelperText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 6,
        paddingHorizontal: 12,
        lineHeight: 16,
    },
    balanceBadge: {
        marginTop: 8,
        backgroundColor: Colors.STATUS_PENDING_BG,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    balanceBadgeText: {
        color: Colors.STATUS_PENDING_TEXT,
        fontSize: 12,
        fontWeight: '700',
    },
    section: {
        gap: 8,
    },
    sectionTitle: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        marginTop: -4,
        marginBottom: 4,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: Colors.WHITE,
        ...GlobalStyles.dropShadow(1),
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    toggleTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    qrCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 16,
    },
    qrImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    qrImage: {
        width: 220,
        height: 220,
        borderRadius: 8,
    },
    tapToZoomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    tapToZoomText: {
        fontSize: 11,
        color: Colors.TEXT_MUTED,
    },
    accountInfoBox: {
        width: '100%',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 14,
        gap: 8,
    },
    accountInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    accountValue: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
    },
    saveQRButton: {
        width: '100%',
    },
    qrLoadingBox: {
        paddingVertical: 36,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    qrLoadingText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    noQRBox: {
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    noQRTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    noQRSubtitle: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 18,
    },
    instructionsContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(1),
        gap: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepNumberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
    refInputContainer: {
        marginTop: 12,
    },
    rejectionNoticeCard: {
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: Colors.ERROR_BORDER,
        gap: 12,
        ...GlobalStyles.dropShadow(2),
    },
    rejectionNoticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rejectionIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    rejectionNoticeHeaderTexts: {
        flex: 1,
        gap: 2,
    },
    rejectionNoticeTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    rejectionNoticeSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    rejectionReasonBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.ERROR,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 4,
    },
    rejectionReasonLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.ERROR,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    rejectionReasonText: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    rejectionNoticeDesc: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
});

export default ManualQRMethodScreen;
