/**
 * @file OwnerQRModal.tsx
 * @description Dedicated modal for business owners to upload and configure their master QR code,
 * account name, and mobile wallet number. Strictly restricted to owner role accounts.
 */

import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '@/src/components/CustomButton';
import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business, IBusinessPaymentConfig } from '@/src/core/models/Business/Business';
import { FileRepository } from '@/src/core/repositories/fileRepository';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface OwnerQRModalProps {
    visible: boolean;
    onClose: () => void;
    business: Business;
    isOwner: boolean;
    onSavePaymentConfig: (config: IBusinessPaymentConfig<Date> | null) => Promise<boolean>;
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
const MAX_SIZE = 5 * 1024 * 1024;

export const OwnerQRModal: React.FC<OwnerQRModalProps> = ({
    visible,
    onClose,
    business,
    isOwner,
    onSavePaymentConfig,
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const isWideScreen = isDesktop || isTablet;

    const currentConfig = business?.paymentConfig;

    const [qrCodeUrl, setQrCodeUrl] = useState<string>(currentConfig?.qrCodeUrl || '');
    const [pickedLocalUri, setPickedLocalUri] = useState<string | null>(null);
    const [accountName, setAccountName] = useState<string>(currentConfig?.accountName || '');
    const [accountNumber, setAccountNumber] = useState<string>(currentConfig?.accountNumber || '');
    const [providerName, setProviderName] = useState<string>(currentConfig?.providerName || 'GCash / Maya');
    
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    const [prevVisible, setPrevVisible] = useState(false);

    if (visible && !prevVisible) {
        setPrevVisible(true);
        const cfg = business?.paymentConfig;
        setQrCodeUrl(cfg?.qrCodeUrl || '');
        setPickedLocalUri(null);
        setAccountName(cfg?.accountName || '');
        setAccountNumber(cfg?.accountNumber || '');
        setProviderName(cfg?.providerName || 'GCash / Maya');
        setErrorMessage(null);
        setSuccessMessage(null);
    } else if (!visible && prevVisible) {
        setPrevVisible(false);
    }

    const isAccountPhoneInvalid = accountNumber.length > 0 && !/^09\d{9}$/.test(accountNumber);

    const handlePickImage = async () => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMessage('Permission to access photo gallery is required.');
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.9,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const asset = result.assets[0];
            const isImageMime = !asset.mimeType || asset.mimeType.startsWith('image/');
            const rawExt = (asset.fileName || asset.uri).split('?')[0].split('.').pop()?.toLowerCase();
            const hasValidExt = rawExt && ALLOWED_EXTENSIONS.includes(rawExt);
            if (!isImageMime && !hasValidExt) {
                setErrorMessage('Only JPG, PNG, WEBP, or HEIC image files are accepted.');
                return;
            }

            if (asset.fileSize && asset.fileSize > MAX_SIZE) {
                setErrorMessage('Selected image exceeds the 5MB size limit.');
                return;
            }

            setPickedLocalUri(asset.uri);
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to select QR image');
        }
    };

    const handleSave = async () => {
        if (!isOwner) {
            setErrorMessage('Only the registered business owner can modify payment QR settings.');
            return;
        }

        const effectiveQr = pickedLocalUri || qrCodeUrl;
        if (!effectiveQr || effectiveQr.trim() === '') {
            setErrorMessage('Please upload a master QR code image.');
            return;
        }

        if (accountName.trim().length < 2) {
            setErrorMessage('Account name must be at least 2 characters.');
            return;
        }

        if (!/^09\d{9}$/.test(accountNumber.trim())) {
            setErrorMessage('Account / mobile number must be a valid 11-digit PH mobile number starting with 09.');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            let finalQrUrl = qrCodeUrl;

            if (pickedLocalUri) {
                const fileName = `qr_${Date.now()}.png`;
                finalQrUrl = await FileRepository.uploadBusinessFile(business.id, 'payment', {
                    uri: pickedLocalUri,
                    name: fileName,
                    mimeType: 'image/png',
                });
            }

            const updatedConfig: IBusinessPaymentConfig<Date> = {
                qrCodeUrl: finalQrUrl,
                accountName: accountName.trim(),
                accountNumber: accountNumber.trim(),
                providerName: providerName.trim() || 'GCash / Maya',
                updatedAt: new Date(),
                updatedBy: business.owner?.id || '',
            };

            const success = await onSavePaymentConfig(updatedConfig);
            if (success) {
                setQrCodeUrl(finalQrUrl);
                setPickedLocalUri(null);
                setSuccessMessage('Master QR Code successfully saved!');
                setTimeout(() => {
                    onClose();
                }, 1200);
            } else {
                setErrorMessage('Failed to save payment QR code settings.');
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : 'Error uploading QR Code');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmRemove = () => {
        if (!isOwner) return;

        // If it is only a locally selected file not yet saved
        if (!currentConfig?.qrCodeUrl) {
            setPickedLocalUri(null);
            setErrorMessage(null);
            return;
        }

        setShowDeleteConfirm(true);
    };

    const handleRemove = async () => {
        if (!isOwner) return;

        if (!currentConfig?.qrCodeUrl) {
            setPickedLocalUri(null);
            setQrCodeUrl('');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const success = await onSavePaymentConfig(null);
            if (success) {
                setQrCodeUrl('');
                setPickedLocalUri(null);
                setAccountName('');
                setAccountNumber('');
                setSuccessMessage('Master QR Code successfully removed.');
                setTimeout(() => {
                    onClose();
                }, 1200);
            } else {
                setErrorMessage('Failed to remove master QR code.');
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to remove QR');
        } finally {
            setIsSaving(false);
        }
    };

    const displayImageUri = pickedLocalUri || qrCodeUrl;

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                    style={styles.overlay}
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                    <View style={[styles.dialogCard, isWideScreen ? styles.dialogCardWide : styles.dialogCardMobile]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.iconCircle}>
                                    <CustomIcon library="MaterialCommunityIcons" name="qrcode-scan" size={20} color={Colors.PRIMARY} />
                                </View>
                                <View>
                                    <CustomText variant="h3" style={styles.headerTitle}>
                                        Master QR Code Setup
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.headerSubtitle}>
                                        Owner Account Verification Required
                                    </CustomText>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                                <CustomIcon library="Feather" name="x" size={20} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {!isOwner ? (
                                <View style={styles.errorBox}>
                                    <CustomIcon library="Feather" name="shield-off" size={20} color={Colors.ERROR} />
                                    <CustomText variant="body" style={styles.errorText}>
                                        Access Restricted: Only the registered business owner account can upload or modify the master payment QR code.
                                    </CustomText>
                                </View>
                            ) : (
                                <>
                                    {errorMessage && (
                                        <View style={styles.errorBox}>
                                            <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.ERROR} />
                                            <CustomText variant="caption" style={styles.errorText}>
                                                {errorMessage}
                                            </CustomText>
                                        </View>
                                    )}

                                    {successMessage && (
                                        <View style={styles.successBox}>
                                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                            <CustomText variant="caption" style={styles.successText}>
                                                {successMessage}
                                            </CustomText>
                                        </View>
                                    )}

                                    {/* QR Preview Section */}
                                    <View style={styles.previewContainer}>
                                        {displayImageUri ? (
                                            <TouchableOpacity
                                                style={styles.imageWrapper}
                                                activeOpacity={0.8}
                                                onPress={() => setPreviewImageUrl(displayImageUri)}
                                            >
                                                <Image source={{ uri: displayImageUri }} style={styles.qrImage} resizeMode="contain" />
                                                <View style={styles.previewOverlay}>
                                                    <CustomIcon library="Feather" name="maximize-2" size={14} color={Colors.WHITE} />
                                                    <CustomText style={styles.previewText}>Tap to Preview</CustomText>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.placeholderBox}>
                                                <CustomIcon library="Feather" name="image" size={36} color={Colors.GRAY_MEDIUM} />
                                                <CustomText variant="caption" style={styles.placeholderText}>
                                                    No QR Code currently uploaded
                                                </CustomText>
                                            </View>
                                        )}

                                        <CustomButton
                                            title={displayImageUri ? "Change QR Image" : "Select QR Image"}
                                            onPress={handlePickImage}
                                            variant="outline"
                                            icon="upload"
                                            iconLibrary="Feather"
                                            style={styles.uploadBtn}
                                        />
                                    </View>

                                    {/* Form Fields */}
                                    <View style={styles.formGroup}>
                                        <CustomTextInput
                                            label="Account Name"
                                            placeholder="e.g. Mt. Pulag Tours Co."
                                            value={accountName}
                                            onChangeText={setAccountName}
                                            maxLength={80}
                                            sanitizeText={(text) => text.replace(/[^a-zA-Z0-9\s.,'&()-]/g, '').replace(/\s{2,}/g, ' ')}
                                        />
                                        <View>
                                            <CustomTextInput
                                                label="Account / Mobile Number"
                                                placeholder="09XX XXX XXXX (11 digits)"
                                                value={accountNumber}
                                                type="numerical"
                                                keyboardType="number-pad"
                                                maxLength={11}
                                                hasError={isAccountPhoneInvalid}
                                                sanitizeText={(text) => text.replace(/[^0-9]/g, '').slice(0, 11)}
                                                onChangeText={(val: string | Date | null) => setAccountNumber(String(val || '').replace(/[^0-9]/g, '').slice(0, 11))}
                                            />
                                            {isAccountPhoneInvalid && (
                                                <CustomText style={styles.fieldErrorText}>
                                                    Must be a valid 11-digit PH mobile number starting with 09
                                                </CustomText>
                                            )}
                                        </View>
                                        <CustomTextInput
                                            label="Payment Channels Accepted"
                                            placeholder="e.g. GCash / Maya / All Banks"
                                            value={providerName}
                                            onChangeText={setProviderName}
                                            maxLength={60}
                                            sanitizeText={(text) => text.replace(/[^a-zA-Z0-9\s/,&-]/g, '').replace(/\s{2,}/g, ' ')}
                                        />
                                    </View>

                                    <View style={styles.guidanceBox}>
                                        <CustomIcon library="Feather" name="info" size={14} color={Colors.PRIMARY} />
                                        <CustomText style={styles.guidanceText}>
                                            Hikers will scan this QR code or import it into their GCash/Maya app, then upload their payment receipt for verification.
                                        </CustomText>
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {/* Actions */}
                        {isOwner && (
                            <View style={styles.footerRow}>
                                {(currentConfig?.qrCodeUrl || pickedLocalUri) ? (
                                    <CustomButton
                                        title={currentConfig?.qrCodeUrl ? "Delete QR" : "Clear"}
                                        variant="outline"
                                        size="md"
                                        icon="trash-2"
                                        iconLibrary="Feather"
                                        iconColor={Colors.ERROR}
                                        onPress={confirmRemove}
                                        disabled={isSaving}
                                        style={styles.removeBtn}
                                        textStyle={styles.removeBtnText}
                                    />
                                ) : null}
                                <CustomButton
                                    title={isSaving ? "Saving..." : "Save QR Code"}
                                    variant="primary"
                                    size="md"
                                    icon="check"
                                    iconLibrary="Feather"
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    isLoading={isSaving}
                                    style={styles.saveBtn}
                                />
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {previewImageUrl ? (
                <ImagePreviewModal
                    visible={Boolean(previewImageUrl)}
                    imageUrl={previewImageUrl}
                    onClose={() => setPreviewImageUrl(null)}
                />
            ) : null}

            <ConfirmationModal
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    setShowDeleteConfirm(false);
                    handleRemove();
                }}
                title="Delete Payment QR?"
                message="Are you sure you want to delete the master payment QR code? Hikers will no longer be able to submit manual QR payments."
                isDestructive={true}
                confirmText="Yes, Delete"
                cancelText="Cancel"
                iconName="trash-2"
                isLoading={isSaving}
            />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    dialogCard: {
        width: '100%',
        maxWidth: 520,
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...GlobalStyles.dropShadow(5),
    },
    dialogCardMobile: {
        height: '85%',
        maxHeight: '90%',
    },
    dialogCardWide: {
        maxWidth: 560,
        height: 620,
        maxHeight: '90%',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 8,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '700',
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },
    closeBtn: {
        padding: 6,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 24,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    imageWrapper: {
        width: 150,
        height: 150,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 10,
        position: 'relative',
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        gap: 6,
    },
    previewText: {
        color: Colors.WHITE,
        fontSize: 11,
        fontWeight: '600',
    },
    placeholderBox: {
        width: 150,
        height: 150,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_MEDIUM,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 10,
        padding: 12,
    },
    placeholderText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 8,
    },
    uploadBtn: {
        minWidth: 160,
    },
    formGroup: {
        gap: 12,
        marginBottom: 16,
    },
    guidanceBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    guidanceText: {
        flex: 1,
        color: Colors.PRIMARY,
        fontSize: 12,
        lineHeight: 16,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_BORDER,
        marginBottom: 16,
    },
    errorText: {
        flex: 1,
        color: Colors.ERROR,
        fontSize: 12,
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        marginBottom: 16,
    },
    successText: {
        flex: 1,
        color: Colors.SUCCESS,
        fontSize: 12,
        fontWeight: '600',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        backgroundColor: Colors.WHITE,
        flexWrap: 'wrap',
    },
    removeBtn: {
        flex: 1,
        width: 'auto',
        borderColor: Colors.ERROR,
        borderWidth: 1.5,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    removeBtnText: {
        color: Colors.ERROR,
        fontWeight: '700',
    },
    saveBtn: {
        flex: 1.3,
        width: 'auto',
    },
    fieldErrorText: {
        fontSize: 11,
        color: Colors.ERROR,
        marginTop: 4,
        marginLeft: 2,
    },
});
