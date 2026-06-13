import React, { ReactNode } from 'react';
import {
    Modal,
    StyleSheet,
    View
} from 'react-native';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { IconLibrary } from '@/src/types/ui.types';

/**
 * A reusable confirmation dialog with destructive/primary action support.
 * Renders as a centered modal overlay with icon, title, message, and action buttons.
 */

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    isDestructive?: boolean;
    iconName?: string;
    iconLibrary?: IconLibrary;
    children?: ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    visible, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?",
    cancelText = "Cancel",
    confirmText = "Confirm",
    isDestructive = false,
    iconName,
    iconLibrary = "Feather",
    children
}) => {

    const containerBgColor: string = isDestructive ? Colors.WHITE : Colors.SECONDARY;
    const textColor: string = isDestructive ? Colors.TEXT_PRIMARY : Colors.TEXT_INVERSE;
    const primaryButtonVariant: 'destructive' | 'primary' = isDestructive ? "destructive" : "primary";
    const cancelButtonVariant: 'secondary' = "secondary"; 
    const defaultIconColor: string = isDestructive ? Colors.ERROR : Colors.TEXT_INVERSE;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View 
                    style={[
                        styles.container, 
                        { backgroundColor: containerBgColor }
                    ]}
                >
                    
                    {iconName && (
                        <View style={styles.iconWrapper}>
                            <CustomIcon 
                                library={iconLibrary} 
                                name={iconName} 
                                size={36} 
                                color={defaultIconColor} 
                            />
                        </View>
                    )}
                
                    <CustomText 
                        variant="subtitle" 
                        style={[
                            styles.title, 
                            { color: textColor }
                        ]}
                    >
                        {title}
                    </CustomText>

                    {children ? (
                        children
                    ) : (
                        <CustomText 
                            variant="caption" 
                            style={[
                                styles.message, 
                                { color: textColor }
                            ]}
                        >
                            {message}
                        </CustomText>
                    )}

                    <View style={styles.buttonContainer}>
                        <CustomButton 
                            title={cancelText}
                            onPress={onClose}
                            variant={cancelButtonVariant}
                            style={[
                                styles.modalButton,
                                isDestructive && {
                                    borderColor: Colors.GRAY_LIGHT,
                                    borderWidth: 1
                                }
                            ]}
                        />

                        <CustomButton 
                            title={confirmText}
                            onPress={onConfirm}
                            variant={primaryButtonVariant}
                            style={styles.modalButton} 
                        />
                    </View>

                </View>
            </View>
        </Modal>
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
    container: {
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 16,
        width: '100%',
        maxWidth: 380, 
        shadowColor: Colors.SHADOW,
        shadowOffset: { 
            width: 0, 
            height: 4 
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
...GlobalStyles.dropShadow(5),
    },
    iconWrapper: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        textAlign: 'center',
        paddingHorizontal: 16,
        marginBottom: 32,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    modalButton: {
        flex: 1, 
        marginBottom: 0,
    }
});

export default ConfirmationModal;