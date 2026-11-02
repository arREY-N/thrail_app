/**
 * @file ManualQRMethodScreen.tsx
 * @description Dedicated manual QR payment screen displaying organizer QR code,
 * step-by-step payment instructions, "Save QR to Gallery", receipt screenshot upload,
 * optional reference number, and legal terms digital signature.
 */

import CustomButton from '@/src/components/CustomButton';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomIcon from '@/src/components/CustomIcon';
import { getStickyFooterScrollPadding } from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { useManualQRMethodTutorial } from '@/src/components/Tutorial/Tutorial';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { db } from '@/src/core/config/Firebase';
import { Booking } from '@/src/core/models/Booking/Booking';
import { IBusinessPaymentConfig } from '@/src/core/models/Business/Business';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import TermsSignature from '@/src/features/Book/components/TermsSignature';
import { BookingNoticeBanner } from '@/src/features/Book/screens/MyBookings/components/BookingNoticeBanner';
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
    onSignatureChange?: (text: string) => void;
    paymentError?: string | null;
    isPayingBalance: boolean;
    isMinor: boolean;
    minorName?: string;
    activeTutorialStep?: string;
    isTutorialVisible?: boolean;
    isRejected?: boolean;
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
    onSignatureChange,
    paymentError,
    isPayingBalance,
    isMinor,
    minorName,
    activeTutorialStep,
    isTutorialVisible,
    isRejected,
}) => {
        const { showToast } = useToast();
    const {
        scrollViewRef,
        rejectionBannerRef,
        qrCardRef,
        instructionsRef,
        receiptUploadRef,
        termsRef,
        handleScroll,
        handleMomentumScrollEnd,
        handleScrollEndDrag,
        handlers: {
            handleRejectionBannerLayout,
            handleQRSectionLayout,
            handleQRCardLayout,
            handleInstructionsSectionLayout,
            handleInstructionsLayout,
            handleReceiptSectionLayout,
            handleTermsSectionLayout,
        },
    } = useManualQRMethodTutorial({
        activeTutorialStep,
        isTutorialVisible,
        isRejected,
    });
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
    const defaultBottomPadding = Math.max(getStickyFooterScrollPadding(insets.bottom, isMobile), 140);
    const bottomScrollPadding = isTutorialVisible ? 320 : defaultBottomPadding;

    const hasUploadedReceipt = Boolean(receiptUrl);
    const isReceiptRejected = bookingData?.paymentVerificationStatus === 'rejected' && !hasUploadedReceipt;

    return (
        <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onScrollEndDrag={handleScrollEndDrag}
            scrollEventThrottle={16}
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
                    <View
                        ref={rejectionBannerRef}
                        collapsable={false}
                        onLayout={handleRejectionBannerLayout}
                    >
                        <BookingNoticeBanner
                            variant="error"
                            title="Payment Verification Rejected"
                            message="Your previous receipt was not accepted by the organizer."
                            details={bookingData.paymentRejectionReason}
                            detailsLabel="ORGANIZER FEEDBACK:"
                            hint="Please review the feedback above and resubmit your payment and valid receipt to confirm your reservation."
                        />
                    </View>
                )}

                {/* Master QR Code Section */}
                <View style={styles.section} onLayout={handleQRSectionLayout}>
                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h2" style={styles.sectionTitleFlat}>
                            {"Scan Organizer's QR Code"}
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.sectionSubtitle}>
                        Scan via {providerName} or any QR Ph compatible banking app.
                    </CustomText>

                    <View style={[styles.qrCard, !isMobile && styles.qrCardWeb]}>
                        {isLoadingConfig ? (
                            <View style={styles.qrLoadingBox}>
                                <ActivityIndicator size="small" color={Colors.PRIMARY} />
                                <CustomText style={styles.qrLoadingText}>
                                    Retrieving organizer payment QR...
                                </CustomText>
                            </View>
                        ) : qrCodeUrl ? (
                            <>
                                {isMobile ? (
                                    /* Mobile: Integrated streamlined vertical flow */
                                    <View style={styles.mobileCardContent}>
                                        <View style={styles.mobileAmountHeader}>
                                            <CustomText variant="caption" style={styles.amountDisplayLabel}>
                                                {isPayingBalance ? "Remaining Balance to Settle" : "Total Amount to Pay"}
                                            </CustomText>
                                            <CustomText variant="h1" style={styles.amountDisplayText}>
                                                ₱{amountToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </CustomText>
                                            {isPayingBalance && (
                                                <View style={styles.balanceBadge}>
                                                    <CustomText style={styles.balanceBadgeText}>Balance Settlement</CustomText>
                                                </View>
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            ref={qrCardRef}

                                            onLayout={handleQRCardLayout}
                                            activeOpacity={0.9}
                                            onPress={() => setPreviewQRVisible(true)}
                                            style={styles.qrImageContainer}
                                        >
                                            <Image
                                                source={{ uri: qrCodeUrl }}
                                                style={styles.qrImage}
                                                resizeMode="contain"
                                            />
                                            <View style={styles.floatingEnlargeBadge}>
                                                <CustomText variant="caption" style={styles.floatingEnlargeText}>Tap to enlarge</CustomText>
                                                <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.WHITE} style={{ marginLeft: 4 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <CustomButton
                                            title={isSavingQR ? "Saving..." : "Save QR to Gallery"}
                                            variant="outline"
                                            icon="download"
                                            iconLibrary="Feather"
                                            onPress={handleSaveQR}
                                            isLoading={isSavingQR}
                                            style={styles.saveQRButtonMobile}
                                        />

                                        <View style={styles.cardDivider} />

                                        <View style={styles.accountInfoList}>
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
                                    </View>
                                ) : (
                                    /* Web: Balanced 2-Column with Unified Payment Slip on the right */
                                    <>
                                        <TouchableOpacity
                                            ref={qrCardRef}

                                            onLayout={handleQRCardLayout}
                                            activeOpacity={0.9}
                                            onPress={() => setPreviewQRVisible(true)}
                                            style={styles.qrImageContainerWeb}
                                        >
                                            <Image
                                                source={{ uri: qrCodeUrl }}
                                                style={styles.qrImage}
                                                resizeMode="contain"
                                            />
                                            <View style={styles.floatingEnlargeBadge}>
                                                <CustomText variant="caption" style={styles.floatingEnlargeText}>Tap to enlarge</CustomText>
                                                <CustomIcon library="Feather" name="maximize-2" size={12} color={Colors.WHITE} style={{ marginLeft: 4 }} />
                                            </View>
                                        </TouchableOpacity>

                                        <View style={styles.paymentSlipWeb}>
                                            <View style={styles.slipAmountSection}>
                                                <CustomText variant="caption" style={styles.amountDisplayLabel}>
                                                    {isPayingBalance ? "Remaining Balance to Settle" : "Total Amount to Pay"}
                                                </CustomText>
                                                <CustomText variant="h1" style={styles.amountDisplayTextWeb}>
                                                    ₱{amountToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </CustomText>
                                                {isPayingBalance && (
                                                    <View style={styles.balanceBadge}>
                                                        <CustomText style={styles.balanceBadgeText}>Balance Settlement</CustomText>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.cardDivider} />

                                            <View style={styles.slipDetailsSection}>
                                                <CustomText variant="caption" style={styles.slipSectionHeader}>
                                                    Recipient Details
                                                </CustomText>
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

                                            <View style={styles.cardDivider} />

                                            <CustomButton
                                                title={isSavingQR ? "Saving..." : "Save QR to Gallery"}
                                                variant="outline"
                                                icon="download"
                                                iconLibrary="Feather"
                                                onPress={handleSaveQR}
                                                isLoading={isSavingQR}
                                                style={styles.saveQRButton}
                                            />
                                        </View>
                                    </>
                                )}
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
                <View style={styles.section} onLayout={handleInstructionsSectionLayout}>
                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h2" style={styles.sectionTitleFlat}>
                            How to Pay
                        </CustomText>
                    </View>
                    <View
                        ref={instructionsRef}
                        collapsable={false}
                        onLayout={handleInstructionsLayout}
                        style={styles.instructionsContainer}
                    >
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>1</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Save or scan the QR code above using your e-wallet (GCash, Maya) or banking app.
                            </CustomText>
                        </View>
                        <View style={styles.ruleDivider} />
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>2</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Transfer exactly <CustomText style={{ fontWeight: '700' }}>₱{amountToPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CustomText> to the account shown.
                            </CustomText>
                        </View>
                        <View style={styles.ruleDivider} />
                        <View style={styles.stepRow}>
                            <View style={styles.stepNumberBadge}>
                                <CustomText style={styles.stepNumberText}>3</CustomText>
                            </View>
                            <CustomText style={styles.stepText}>
                                Take a clear screenshot of the completed payment receipt showing the Reference Number.
                            </CustomText>
                        </View>
                        <View style={styles.ruleDivider} />
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
                <View style={styles.section} onLayout={handleReceiptSectionLayout}>
                    <View style={styles.sectionHeaderRow}>
                        <CustomText variant="h2" style={styles.sectionTitleFlat}>
                            Upload Payment Receipt
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.sectionSubtitle}>
                        Proof of transfer is required so the organizer can verify your booking.
                    </CustomText>

                    <DocumentUploadCard
                        docName="Payment Receipt"
                        subtitle={hasUploadedReceipt ? "Receipt attached • Ready to submit" : "Screenshot showing amount & reference no."}
                        isUploaded={receiptUrl || undefined}
                        isRejected={isReceiptRejected}
                        uploadButtonRef={receiptUploadRef}
                        onUploadSuccess={(url) => setReceiptUrl(url)}
                        onDelete={() => setReceiptUrl('')}
                    />
                </View>

                {/* Terms & Digital Signature */}
                <View
                    ref={termsRef}
                    collapsable={false}
                    onLayout={handleTermsSectionLayout}
                    style={styles.section}
                >
                    <TermsSignature
                        expectedName={profileFullName}
                        isMinor={isMinor}
                        minorName={minorName}
                        onValidChange={setIsSignatureValid}
                        onSignatureChange={onSignatureChange}
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
    amountDisplayLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    amountDisplayText: {
        color: Colors.PRIMARY,
        fontSize: 30,
        fontWeight: 'bold',
    },
    amountDisplayTextWeb: {
        color: Colors.PRIMARY,
        fontSize: 28,
        fontWeight: 'bold',
    },
    balanceBadge: {
        marginTop: 6,
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
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitleFlat: {
        marginBottom: 0,
    },
    sectionSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
        marginTop: -4,
        marginBottom: 12,
    },
    qrCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    qrCardWeb: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
    },
    mobileCardContent: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    mobileAmountHeader: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 4,
    },
    qrImageContainer: {
        width: '100%',
        maxWidth: 340,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        position: 'relative',
        overflow: 'hidden',
    },
    qrImageContainerWeb: {
        width: 360,
        height: 360,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        position: 'relative',
        overflow: 'hidden',
    },
    qrImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    floatingEnlargeBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    floatingEnlargeText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 11,
    },
    saveQRButtonMobile: {
        width: '100%',
    },
    cardDivider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 4,
    },
    accountInfoList: {
        width: '100%',
        gap: 10,
        paddingVertical: 4,
    },
    paymentSlipWeb: {
        flex: 1,
        maxWidth: 360,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 14,
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    slipAmountSection: {
        width: '100%',
        alignItems: 'flex-start',
    },
    slipDetailsSection: {
        width: '100%',
        gap: 8,
        paddingVertical: 4,
    },
    slipSectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    accountInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountLabel: {
        fontSize: 13,
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
        marginTop: 4,
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
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    ruleDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
        paddingVertical: 2,
    },
    stepNumberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.TRAIL_RULES_BULLET_BG,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 1,
        flexShrink: 0,
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.TRAIL_RULES_BULLET_TEXT,
        marginBottom: 1,
    },
    stepText: {
        flex: 1,
        flexShrink: 1,
        flexWrap: 'wrap',
        fontSize: 14,
        lineHeight: 22,
        color: Colors.TEXT_PRIMARY,
        marginTop: 1,
    },
});

export default ManualQRMethodScreen;
